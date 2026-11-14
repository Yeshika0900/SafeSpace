"""Established COCOeval metrics for pinned, small engineering runs."""
import contextlib
import io
import json
import pathlib
import sys
import numpy as np
from pycocotools.coco import COCO
from pycocotools.cocoeval import COCOeval
root = pathlib.Path(sys.argv[1])
source = json.loads((root / (sys.argv[2] + '.json')).read_text())
manifest = json.loads((root / 'manifest.json').read_text())
gt = COCO(str(root / 'instances_val2017.json'))
summary = {'run': source['run'], 'source': source['source'], 'manifestSha256': source['manifestSha256'], 'coldLocalLoadMs':source['coldLocalLoadMs'],'warmLocalLoadMs':source['warmLocalLoadMs'], 'config': source['config'], 'environment': source['environment'], 'results': []}
for run in source['runs']:
    splits = ['validation', 'holdout'] if run['name'] == 'baseline' else ['validation']
    for split in splits:
        ids = [image['id'] for image in manifest['images'] if image['split'] == split]
        timings = [image['ms'] for image in run['images'] if image['id'] in ids]
        for cap in ['predictions','displayed']:
            predictions = [p for p in run[cap] if p['image_id'] in ids]
            with contextlib.redirect_stdout(io.StringIO()):
                # COCO.loadRes indexes result[0], so explicitly support an empty detector.
                if predictions:
                    dt = gt.loadRes(predictions)
                else:
                    dt = COCO()
                    dt.dataset = {**gt.dataset,'annotations':[]}
                    dt.createIndex()
                evaluator=COCOeval(gt,dt,'bbox');evaluator.params.imgIds=ids
                evaluator.evaluate();evaluator.accumulate();evaluator.summarize()
            precision = evaluator.eval['precision']
            per_class = {}
            for k,cat_id in enumerate(evaluator.params.catIds):
                values=precision[:,:,k,0,-1];values=values[values>=0]
                if values.size: per_class[gt.cats[cat_id]['name']]=float(values.mean())
            # Micro precision at IoU .50; ignored/crowd detections excluded using COCO matching.
            counts=[]
            for image_id in ids:
                tp=fp=positive=0
                for entry in evaluator.evalImgs:
                    if entry is None or entry['image_id']!=image_id or entry['aRng']!=evaluator.params.areaRng[0]: continue
                    ignored=np.array(entry['dtIgnore'][0],dtype=bool)
                    matched=np.array(entry['dtMatches'][0])>0
                    tp+=int(np.sum(matched & ~ignored));fp+=int(np.sum(~matched & ~ignored))
                    positive+=int(np.sum(~np.array(entry['gtIgnore'],dtype=bool)))
                counts.append([tp,fp,positive])
            totals=np.sum(counts,axis=0);tp,fp,positive=totals
            rng=np.random.default_rng(20261114)
            bootstrap=np.array([np.sum(np.array(counts)[rng.integers(0,len(counts),len(counts))],axis=0) for _ in range(2000)])
            p_samples=bootstrap[:,0]/np.maximum(1,bootstrap[:,0]+bootstrap[:,1]);r_samples=bootstrap[:,0]/np.maximum(1,bootstrap[:,2])
            summary['results'].append({'configuration':run['name'],'split':split,'scope':cap,'images':len(ids),'boxes':int(positive),'detections':len(predictions),'AP50_95':float(evaluator.stats[0]),'AP50':float(evaluator.stats[1]),'AP_small':float(evaluator.stats[3]),'AR100':float(evaluator.stats[8]),'precision50':float(tp/max(1,tp+fp)),'recall50':float(tp/max(1,positive)),'falsePositives50':int(fp),'precision50ImageBootstrap95':np.quantile(p_samples,[.025,.975]).tolist(),'recall50ImageBootstrap95':np.quantile(r_samples,[.025,.975]).tolist(),'p50InferenceMs':float(np.quantile(timings,.5)),'p95InferenceMs':float(np.quantile(timings,.95)),'perClassAP50_95':per_class,'tensorCounts':sorted({image['memory']['numTensors'] for image in run['images']}),'maxRSSBytes':max(image['rss'] for image in run['images'])})
(root / (source['run'] + '-summary.json')).write_text(json.dumps(summary,indent=2)+'\n')
for result in summary['results']:
    print(f"{result['configuration']} {result['split']} {result['scope']}: AP={100*result['AP50_95']:.2f}% AP50={100*result['AP50']:.2f}% small={100*result['AP_small']:.2f}% P={100*result['precision50']:.2f}% R={100*result['recall50']:.2f}% p50/p95={result['p50InferenceMs']:.0f}/{result['p95InferenceMs']:.0f} ms")
