# Existing-model benchmark reproduction

This is a **32-image engineering subset of COCO2017 validation**, not the full 5,000-image benchmark, an independent validation claim, a phone benchmark, or a hidden-camera test. COCO128 training images are suitable only for development; their prior audit metrics are not directly comparable to this split.

The retrieval script fixes membership by SHA-256 ordering of `SafeSpace-quality-v1:<image-id>` **before inference**. The first 16 images are validation; the next 16 are untouched holdout. The only candidate changes `minScore` from 0.55 to 0.40 on validation. COCO-SSD 2.2.3 uses that argument for **both score filtering and NMS IoU**. It is not a confidence-only sweep. No candidate is selected for production; only the unchanged baseline is evaluated on holdout. Small sample size, sparse per-class support, unverified original training membership and missing phone timings do not justify changing the operating point.

`benchmark-manifest.json` freezes annotation/model/image SHA-256 hashes, image membership, label mapping, original sizes, source URLs and image license IDs. The official COCO2017 train and val image ID lists were checked disjoint. This verifies the published split, not the complete pretraining provenance of the original TensorFlow checkpoint, which has not been independently attested. Do not describe these results as validated hidden-camera or tracker accuracy.

## Reproduce

From a clean checkout, use Node 24.22.1, Python 3.12 and the committed npm lockfile:

```sh
npm --prefix website ci
python3 -m venv .cache/benchmark-venv
.cache/benchmark-venv/bin/pip install numpy==2.4.2 pycocotools==2.0.11
python3 scripts/prepare-benchmark.py .cache/benchmark
npm --prefix website run benchmark -- "$PWD/.cache/benchmark" run1
.cache/benchmark-venv/bin/python scripts/evaluate-benchmark.py .cache/benchmark run1
npm --prefix website run benchmark -- "$PWD/.cache/benchmark" run2
.cache/benchmark-venv/bin/python scripts/evaluate-benchmark.py .cache/benchmark run2
python3 scripts/compare-benchmarks.py .cache/benchmark
```

Windows: use the virtualenv's `Scripts/python.exe` and an absolute cache path. The script verifies every retrieved asset against the committed manifest before accepting it. A changed upstream file must fail, not silently create a new baseline. The annotations archive is about 241 MiB; images/weights/cache stay outside Git. The workflow-dispatch benchmark lane runs independently of PR gates and retains synthetic/public-dataset predictions and manifests for seven days. No room imagery or nearby identifiers are used or uploaded.

The runner uses COCO-SSD 2.2.3 / TensorFlow.js 4.22.0 **pure-JavaScript CPU**. JPEG decoding uses jpeg-js 0.4.4, RGB int32 tensors; aspect-preserving maximum side 640, bilinear resize with alignCorners=false, integer conversion. Predictions are rescaled to original image coordinates. This standardized still-image input is a reproducible proxy for a 640-pixel browser preview, not proof of browser camera preprocessing equivalence. Warm-up is the model package's own load warm-up. Timings exclude JPEG decoding/resize and include `detect`; local cold/warm loading includes model initialization and reads from a loopback HTTP cache, **not internet/CDN cold load**. RSS includes the Node process and retained decoded-image buffers; tensor counts/bytes are recorded separately. Do not compare absolute latency with the audit's different host or phone measurements.

`run*.json` records source revision, working diff checksum, manifest checksum, package/backend/environment, configuration, all post-NMS model API predictions (cap 20), displayed observations (cap 8), per-image timing, tensor count and process memory. “Model predictions” here means the configured detect API, not raw graph logits. `run*-summary.json` uses pycocotools' standard `COCOeval` bbox metrics: AP50:95, AP50, small-object AP, AR100 and per-class AP. IoU .50 micro precision/recall/false positives use COCO's matching/ignore rules. Image-level bootstrap intervals (2,000 resamples, fixed seed) show uncertainty in those operating-point metrics; sparse AP slices cannot support strong conclusions. Default COCO maxDets [1,10,100] is preserved even though the detector returns at most 20.

Expected deterministic tolerance: same input/backend/package versions should produce identical labels/counts and scores/coordinates within 1e-5; AP differences <=0.01 percentage points are acceptable. Timing and process RSS depend on CPU contention/JIT/GC and are not deterministic. Compare two runs before interpreting a runtime change.

## Asset hosting and licenses

Production retains the existing upstream model URL and baseline settings. Benchmark assets are SHA-verified; production's upstream URL is not immutable. Self-hosting is compatible with COCO-SSD's existing `modelUrl` option, but bundling weights into this quality PR would add tens of MB and requires preserving notices and confirming the weight license provenance. No self-hosting or model-base change is adopted here. The TensorFlow.js package/source is Apache-2.0; the original checkpoint's rights/notices must be checked before redistributing weights. COCO annotations have their own terms and images retain individual Flickr/COCO license attribution. Retrieve from official sources for authorized evaluation; this repository does not redistribute imagery or invent a project license.

## Results

Both CPU runs produced **identical labels, scores and boxes** (maximum difference 0). The evaluation source is `3c8841b`; each raw run also records the working-diff hash. Subsequent source changes only format code and guard malformed native BLE callbacks/pagehide; model configuration and inference behavior remain unchanged. See the committed `benchmark-run{1,2}.json` and `benchmark-run{1,2}-summary.json` files for full predictions, slices and provenance.

| Split/configuration                                  | Images/boxes | AP50:95 |   AP50 | Small AP | Precision50 | Recall50 | False positives50 |
| ---------------------------------------------------- | -----------: | ------: | -----: | -------: | ----------: | -------: | ----------------: |
| Validation baseline 0.55 (before and retained after) |       16/148 |  26.79% | 38.05% |    0.20% |      94.59% |   23.65% |                 2 |
| Validation candidate 0.40 (not adopted)              |       16/148 |  28.58% | 41.16% |    0.20% |      88.89% |   27.03% |                 5 |
| Holdout baseline 0.55 only                           |        16/74 |  29.14% | 36.12% |    0.70% |      90.00% |   36.49% |                 3 |

UI-displayed predictions and model-API predictions had identical metrics **on this subset**: no image exceeded eight returned observations. This does not establish that a display cap of eight is harmless on broader data. Crowded/ignored detections are excluded from precision/false-positive counts by COCO matching rules.

Candidate person AP fell 0.36 percentage points; bottle AP rose 8.37 points. Other changes were umbrella +3.96, fork +30.30 and dining table +9.69 points; sparse class support makes those changes unstable. Validation image-bootstrap 95% precision intervals overlap: baseline 87.10–100%, candidate 76.78–100%. Recall intervals also overlap: baseline 15.67–36.84%, candidate 18.80–41.67%. No small-object improvement was demonstrated. These facts, increased false positives, absent device timing and uncertain pretraining provenance support **retaining 0.55**, not a production accuracy-gain claim.

Run 1 validation p50/p95 inference: baseline 5.76/7.90 s, candidate 2.82/3.21 s. Run 2: baseline 2.81/4.99 s, candidate 2.89/5.53 s. The shared host had concurrent build/test/install activity; timing variance prevents a credible speed comparison. Holdout baseline p50/p95: run 1 2.68/3.76 s, run 2 2.86/4.59 s. Local cold/warm model loads were 4.59/6.31 s and 4.95/4.31 s respectively. These are pure-JS CPU/cache timings, not browser or phone timings.

Both runs held 262 model tensors after each inference and returned to **zero tensors/data buffers/TF.js bytes after disposal**. TF.js marks byte estimates unreliable under GC. Peak Node RSS ranged about 320–399 MiB across configuration runs; this includes input buffers and process overhead and does not prove a browser memory plateau. No model accuracy improvement is claimed from crash, parser or lifecycle fixes.
