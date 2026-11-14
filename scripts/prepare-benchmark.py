"""Retrieve official COCO2017 subset and TF.js artifacts; never load room imagery."""
import concurrent.futures
import hashlib
import json
import pathlib
import sys
import urllib.request
import zipfile

root = pathlib.Path(sys.argv[1]).resolve()
root.mkdir(parents=True, exist_ok=True)
archive = root / 'annotations_trainval2017.zip'
def download(url, path):
    if not path.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            path.write_bytes(response.read())
    return hashlib.sha256(path.read_bytes()).hexdigest()

archive_sha = download('https://images.cocodataset.org/annotations/annotations_trainval2017.zip', archive)
with zipfile.ZipFile(archive) as z:
    annotations = z.read('annotations/instances_val2017.json')
    data = json.loads(annotations)
    # Read only the image section of train2017; do not load all training boxes.
    with z.open('annotations/instances_train2017.json') as f:
        chunks = b''
        while b'"annotations":' not in chunks:
            part = f.read(1024 * 1024)
            if not part:
                raise ValueError('Missing train image section')
            chunks += part
        train = json.loads(chunks.split(b'"annotations":')[0] + b'"annotations":[]}')
    train_ids = {image['id'] for image in train['images']}
assert not train_ids.intersection(image['id'] for image in data['images'])
(root / 'instances_val2017.json').write_bytes(annotations)
# Membership is fixed before any inference, ordered by a deterministic hash.
selected = sorted(data['images'], key=lambda image: hashlib.sha256(('SafeSpace-quality-v1:' + str(image['id'])).encode()).hexdigest())[:32]
(root / 'images').mkdir(exist_ok=True)
def image_record(pair):
    i, image = pair
    url = 'https://images.cocodataset.org/val2017/' + image['file_name']
    sha = download(url, root / 'images' / image['file_name'])
    return {**image, 'sha256': sha, 'split': 'validation' if i < 16 else 'holdout'}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    images = list(pool.map(image_record, enumerate(selected)))
model_base = 'https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/'
model_dir = root / 'model'
model_dir.mkdir(exist_ok=True)
model_sha = download(model_base + 'model.json', model_dir / 'model.json')
model = json.loads((model_dir / 'model.json').read_text())
artifacts = {'model.json': model_sha}
for group in model['weightsManifest']:
    for path in group['paths']:
        artifacts[path] = download(model_base + path, model_dir / path)
manifest = {'dataset':'COCO2017 val, deterministic 32-image engineering subset; not full benchmark', 'annotationArchiveSha256':archive_sha,'annotationSha256':hashlib.sha256(annotations).hexdigest(),'images':images,'modelUrl':model_base+'model.json','modelArtifacts':artifacts,'train2017Val2017ImageIdOverlap':0,'pretrainingOverlap':'Official train/val image IDs checked disjoint. Exact original weight training membership is not independently attested; do not call this independent validation.','categories':data['categories']}
expected_path = pathlib.Path(__file__).resolve().parents[1] / 'docs/quality/benchmark-manifest.json'
if expected_path.exists():
    expected = json.loads(expected_path.read_text())
    if manifest != expected:
        raise ValueError('Retrieved assets differ from committed benchmark manifest')
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps({'images':len(images),'annotationsSha256':manifest['annotationSha256'],'modelArtifacts':artifacts},indent=2))
