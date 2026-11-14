"""Fail if two pinned CPU runs disagree beyond documented tolerance."""
import json
import pathlib
import sys
root = pathlib.Path(sys.argv[1])
a, b = [json.loads((root / (name + '.json')).read_text()) for name in ['run1','run2']]
assert a['manifestSha256'] == b['manifestSha256'], 'Manifest differs'
assert a['config'] == b['config'], 'Configuration differs'
maximum = 0.0
for left, right in zip(a['runs'],b['runs'],strict=True):
    assert left['name'] == right['name']
    for kind in ['predictions','displayed']:
        for p,q in zip(left[kind],right[kind],strict=True):
            assert (p['image_id'],p['category_id']) == (q['image_id'],q['category_id'])
            maximum = max(maximum,abs(p['score']-q['score']),*(abs(x-y) for x,y in zip(p['bbox'],q['bbox'],strict=True)))
assert maximum <= 1e-5, f'Prediction difference: {maximum}'
summaries = [json.loads((root/(name+'-summary.json')).read_text()) for name in ['run1','run2']]
for p,q in zip(summaries[0]['results'],summaries[1]['results'],strict=True):
    for key in ['AP50_95','AP50','AP_small','AR100','precision50','recall50']:
        assert abs(p[key]-q[key])<=0.0001, (key,p[key],q[key])
print(f'Reproducibility passed: max score/coordinate difference {maximum}; all metric differences <=0.01 percentage points. Timing/RSS excluded.')
