import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
const dist = fileURLToPath(new URL("../website/dist/", import.meta.url));
const manifest = JSON.parse(
  readFileSync(`${dist}/.vite/manifest.json`, "utf8"),
);
const visited = new Set();
function visit(key) {
  if (visited.has(key)) return;
  visited.add(key);
  for (const dependency of manifest[key].imports || []) visit(dependency);
}
for (const [key, entry] of Object.entries(manifest))
  if (entry.isEntry) visit(key);
const initial = [...visited]
  .map((key) => manifest[key].file)
  .filter((file) => file.endsWith(".js"));
let bytes = 0,
  gzip = 0;
for (const file of initial) {
  const data = readFileSync(`${dist}/${file}`);
  bytes += data.length;
  gzip += gzipSync(data).length;
}
console.log(
  JSON.stringify(
    { initial, bytes, gzip, budgetBytes: 240000, budgetGzip: 75000 },
    null,
    2,
  ),
);
if (bytes > 240000 || gzip > 75000)
  throw new Error(
    "Initial JavaScript budget exceeded. Deferred model chunks are excluded.",
  );
