"""Check WebP files against provenance and prepare source/output visual comparisons."""
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'web/public/media'
EVIDENCE = ROOT / 'comparison'
assets = json.loads((MEDIA / 'provenance.json').read_text(encoding='utf-8'))
checks = []
panels = []
for asset in assets:
    source = ROOT / asset['source_local'] if asset.get('source_local') else EVIDENCE / 'media-originals' / f'{asset["slug"]}.jpg'
    content = source.read_bytes()
    assert hashlib.sha256(content).hexdigest() == asset['original_sha256'], source
    with Image.open(io.BytesIO(content)) as original:
        original = ImageOps.exif_transpose(original).convert('RGB')
        reference = ImageOps.fit(original, (400, 250), method=Image.Resampling.LANCZOS)
        for variant in asset['variants']:
            file = MEDIA / variant['file']
            with Image.open(file) as output:
                assert output.format == 'WEBP', file
                assert list(output.size) == [variant['width'], variant['height']], file
                assert output.width <= original.width and output.height <= original.height, file
                assert not output.getexif(), file
                assert file.stat().st_size == variant['bytes'], file
                checks.append({'file': file.name, 'dimensions': list(output.size), 'bytes': file.stat().st_size,
                               'format': 'WEBP', 'no_upscaling': True, 'no_exif': True})
        panel = Image.new('RGB', (800, 280), 'white')
        panel.paste(reference, (0, 25))
        with Image.open(MEDIA / asset['variants'][0]['file']) as output:
            panel.paste(output.convert('RGB'), (400, 25))
        draw = ImageDraw.Draw(panel)
        draw.text((8, 5), asset['slug'] + ' - original source crop', fill='black')
        draw.text((408, 5), 'WebP 400w, quality 76', fill='black')
        panels.append(panel)

expected = {v['file'] for a in assets for v in a['variants']}
assert expected == {p.name for p in MEDIA.glob('*.webp')}, 'Unexpected/missing public WebP files'
for batch in range(2):
    sheet = Image.new('RGB', (800, 1120), 'white')
    for row, panel in enumerate(panels[batch * 4:(batch + 1) * 4]):
        sheet.paste(panel, (0, row * 280))
    sheet.save(EVIDENCE / f'quality-source-vs-webp-{batch + 1}.png')
contact = Image.new('RGB', (800, 1120), 'white')
for index, panel in enumerate(panels):
    contact.paste(panel.crop((400, 0, 800, 280)), ((index % 2) * 400, (index // 2) * 280))
contact.save(EVIDENCE / 'media-contact-sheet.jpg', quality=90)
(EVIDENCE / 'media-checks.json').write_text(json.dumps({'checks': checks, 'total_webp_bytes': sum(x['bytes'] for x in checks),
    'note': 'Actual local file checks only. Side-by-side source/output sheets support visual review; no Network performance was measured.'}, indent=2), encoding='utf-8')
print(f'Checked {len(checks)} WebP files: dimensions, source hashes, no upscaling, no EXIF, and actual byte sizes.')
