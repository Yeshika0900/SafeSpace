import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { performance } from "node:perf_hooks";
import os from "node:os";
import tf from "@tensorflow/tfjs";
import coco from "@tensorflow-models/coco-ssd";
import jpeg from "jpeg-js";
import { INFERENCE } from "../src/services/inference.ts";
const root = process.argv[2],
  run = process.argv[3] || "run1";
if (!root)
  throw new Error("Usage: node bench/run.mjs <asset-directory> [run1|run2]");
const sha = (data) => createHash("sha256").update(data).digest("hex");
const manifest = JSON.parse(readFileSync(`${root}/manifest.json`, "utf8"));
const verify = (file, expected) => {
  const bytes = readFileSync(`${root}/${file}`);
  if (sha(bytes) !== expected) throw new Error(`Checksum mismatch: ${file}`);
  return bytes;
};
verify("instances_val2017.json", manifest.annotationSha256);
for (const [path, hash] of Object.entries(manifest.modelArtifacts))
  verify(`model/${path}`, hash);
for (const image of manifest.images)
  verify(`images/${image.file_name}`, image.sha256);
const server = createServer((req, res) => {
  const path = req.url.slice(1);
  if (!Object.hasOwn(manifest.modelArtifacts, path)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.end(readFileSync(`${root}/model/${path}`));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
await tf.setBackend("cpu");
await tf.ready();
const source = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const diffSha = sha(
  execFileSync("git", [
    "diff",
    "HEAD",
    "--",
    "src",
    "bench",
    "package-lock.json",
  ]),
);
const output = {
  run,
  source,
  workingDiffSha256: diffSha,
  manifestSha256: sha(readFileSync(`${root}/manifest.json`)),
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpu: os.cpus()[0].model,
    tfjs: tf.version.tfjs,
    coco: "2.2.3",
    backend: tf.getBackend(),
  },
  config: {
    ...INFERENCE,
    maxSide: 640,
    resize: "bilinear alignCorners=false",
    input: "jpeg-js RGB int32",
  },
  runs: [],
};
try {
  const url = `http://127.0.0.1:${server.address().port}/model.json`;
  const loadStart = performance.now();
  const model = await coco.load({ base: INFERENCE.base, modelUrl: url });
  output.coldLocalLoadMs = performance.now() - loadStart;
  const warmStart = performance.now();
  const warm = await coco.load({ base: INFERENCE.base, modelUrl: url });
  output.warmLocalLoadMs = performance.now() - warmStart;
  warm.dispose();
  // Compare on validation only. Holdout receives baseline only: no candidate was selected.
  for (const config of [
    { name: "baseline", minScore: 0.55 },
    { name: "candidate-minScore-0.40", minScore: 0.4 },
  ]) {
    const images =
      config.name === "baseline"
        ? manifest.images
        : manifest.images.filter((i) => i.split === "validation");
    const result = { ...config, images: [], predictions: [], displayed: [] };
    for (const image of images) {
      const decoded = jpeg.decode(
        verify(`images/${image.file_name}`, image.sha256),
        { useTArray: true, formatAsRGBA: false },
      );
      const scale = Math.min(1, 640 / Math.max(decoded.width, decoded.height));
      const width = Math.round(decoded.width * scale),
        height = Math.round(decoded.height * scale);
      const tensor = tf.tidy(() =>
        tf.image
          .resizeBilinear(
            tf.tensor3d(
              decoded.data,
              [decoded.height, decoded.width, 3],
              "int32",
            ),
            [height, width],
          )
          .toInt(),
      );
      const start = performance.now();
      const predictions = await model.detect(
        tensor,
        INFERENCE.maxPredictions,
        config.minScore,
      );
      const ms = performance.now() - start;
      tensor.dispose();
      const mapped = predictions.map((p) => {
        const category = manifest.categories.find((c) => c.name === p.class);
        if (!category) throw new Error(`Unknown class ${p.class}`);
        return {
          image_id: image.id,
          category_id: category.id,
          bbox: [
            (p.bbox[0] * image.width) / width,
            (p.bbox[1] * image.height) / height,
            (p.bbox[2] * image.width) / width,
            (p.bbox[3] * image.height) / height,
          ],
          score: p.score,
        };
      });
      result.predictions.push(...mapped);
      result.displayed.push(...mapped.slice(0, INFERENCE.displayCap));
      result.images.push({
        id: image.id,
        split: image.split,
        ms,
        memory: tf.memory(),
        rss: process.memoryUsage().rss,
      });
      console.log(
        `${run} ${config.name} ${result.images.length}/${images.length} ${Math.round(ms)}ms`,
      );
    }
    output.runs.push(result);
    writeFileSync(
      `${root}/${run}.json`,
      JSON.stringify(output, null, 2) + "\n",
    );
  }
  model.dispose();
  output.finalMemory = tf.memory();
  writeFileSync(`${root}/${run}.json`, JSON.stringify(output, null, 2) + "\n");
} finally {
  server.close();
}
