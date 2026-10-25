"""Download documented Commons originals and make local, metadata-free WebP files.

Requires Pillow 12.2.0. Originals and licence metadata are kept outside web/public.
Run from the project root: python tools/prepare_media.py
"""
import hashlib
import io
import json
import re
import urllib.parse
import urllib.request
import urllib.error
import time
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / 'comparison' / 'media-originals'
PUBLIC = ROOT / 'web' / 'public' / 'media'
SOURCES = [
    ('cheeseburger', 'Cheeseburger', 'Yummy cheeseburger close-up.jpg'),
    ('chicken-burger', 'Chicken Burger', 'Fried chicken burger .jpg'),
    ('double-burger', 'Double Burger', "Grilled Cheese Cheeseburger Double - Wendy's 2025-11-21.jpg"),
    ('cola', 'Cola', 'Cola and flowers (Unsplash).jpg'),
    ('lemonade', 'Lemonade', 'Lemonade mason jar.jpg'),
    ('americano', 'Americano', 'White cup of black coffee.jpg'),
    ('cheesecake', 'Cheesecake', 'New York cheesecake 3.jpg'),
    ('brownie', 'Brownie', 'Brownie (1).jpg'),
]


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'MyCafeAssignment/1.0 (educational prototype)'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or attempt == 3:
                raise
            time.sleep(5 * (attempt + 1))


def plain(value):
    import html
    return html.unescape(re.sub('<[^>]+>', '', value)).strip()


def main():
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    manifest = []
    for slug, product, title in SOURCES:
        supplied = ROOT / 'фотки' / 'cheeseburger_hero (1).png'
        if slug == 'cheeseburger' and supplied.exists():
            content = supplied.read_bytes()
            with Image.open(io.BytesIO(content)) as image:
                image = ImageOps.exif_transpose(image).convert('RGB')
                dimensions = list(image.size)
                variants = []
                for width in (400, min(800, image.width)):
                    height = width * 5 // 8
                    output = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS)
                    target = PUBLIC / f'{slug}-{width}.webp'
                    output.save(target, 'WEBP', quality=76, method=6)
                    variants.append({'file': target.name, 'width': width, 'height': height, 'bytes': target.stat().st_size})
            manifest.append({'slug': slug, 'product': product, 'source_title': supplied.name,
                             'source_page': '', 'source_local': supplied.relative_to(ROOT).as_posix(),
                             'download_url': '', 'author': 'Not provided; file supplied by the user',
                             'license': 'Not provided; no external licence or authorship claim is made',
                             'license_url': '', 'usage_terms': 'User requested use in this prototype',
                             'original_dimensions': dimensions, 'original_bytes': len(content),
                             'original_sha256': hashlib.sha256(content).hexdigest(),
                             'changes': 'Centre crop to 8:5; resize; WebP quality 76; strip metadata.',
                             'variants': variants})
            print(slug, 'user-supplied PNG', dimensions, '->', [v['bytes'] for v in variants], flush=True)
            continue
        metadata_path = ARCHIVE / f'{slug}.metadata.json'
        if metadata_path.exists():
            page = json.loads(metadata_path.read_text(encoding='utf-8'))
        else:
            params = {'action': 'query', 'titles': f'File:{title}', 'prop': 'imageinfo',
                      'iiprop': 'url|extmetadata|size', 'format': 'json'}
            data = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))
            page = next(iter(data['query']['pages'].values()))
            metadata_path.write_text(json.dumps(page, indent=2, ensure_ascii=False), encoding='utf-8')
        if page['title'] != f'File:{title}':
            raise ValueError(f'Stale metadata cache for {slug}; review the source before replacing archived inputs.')
        info = page['imageinfo'][0]
        meta = info['extmetadata']
        license_name = meta.get('LicenseShortName', {}).get('value', '')
        if license_name not in ('CC0', 'Public domain'):
            raise ValueError(f'Review licence before using {title}: {license_name}')
        original = ARCHIVE / f'{slug}.jpg'
        if not original.exists():
            original.write_bytes(fetch(info['url'].split('?')[0]))
        content = original.read_bytes()
        with Image.open(io.BytesIO(content)) as image:
            image = ImageOps.exif_transpose(image).convert('RGB')
            dimensions = list(image.size)
            variants = []
            for width in (400, 800):
                height = width * 5 // 8
                resized = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS)
                target = PUBLIC / f'{slug}-{width}.webp'
                resized.save(target, 'WEBP', quality=76, method=6)
                variants.append({'file': target.name, 'width': width, 'height': height,
                                 'bytes': target.stat().st_size})
        manifest.append({'slug': slug, 'product': product, 'source_title': page['title'],
                         'source_page': info['descriptionurl'], 'download_url': info['url'],
                         'author': plain(meta.get('Artist', {}).get('value', 'Not stated')),
                         'license': license_name,
                         'license_url': meta.get('LicenseUrl', {}).get('value', ''),
                         'usage_terms': plain(meta.get('UsageTerms', {}).get('value', '')),
                         'original_dimensions': dimensions, 'original_bytes': len(content),
                         'original_sha256': hashlib.sha256(content).hexdigest(),
                         'changes': 'Centre crop to 8:5; resize; WebP quality 76; strip metadata.',
                         'variants': variants})
        print(slug, dimensions, len(content), '->', [v['bytes'] for v in variants], flush=True)
    (PUBLIC / 'provenance.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding='utf-8')


if __name__ == '__main__':
    main()
