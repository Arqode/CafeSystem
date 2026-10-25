"""Rebuild the credits and evidence-based Part B report from local artifacts."""
import html
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / 'web/public/media'
assets = json.loads((MEDIA / 'provenance.json').read_text(encoding='utf-8'))


def esc(value):
    return html.escape(value, quote=True)


credits = []
for asset in assets:
    source = (f'<a href="{esc(asset["source_page"])}">{esc(asset["source_title"])}</a>'
              if asset['source_page'] else f'Local user-supplied file: {esc(asset["source_local"])}')
    credits.append(f'<li><strong>{esc(asset["product"])}</strong>: '
                   f'{source} '
                   f'by {esc(asset["author"])}. Licence/status: {esc(asset["license"])}. '
                   f'{esc(asset["changes"])}</li>')
(MEDIA / 'credits.html').write_text('''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>MY CAFÉ — Image credits</title><style>
body{margin:0;background:#eef3f8;color:#17202b;font:16px/1.6 system-ui,sans-serif}
main{max-width:720px;margin:auto;padding:24px}a{color:#14466e;overflow-wrap:anywhere}
li{margin:16px 0}h1{font-size:1.5rem}:focus-visible{outline:3px solid #14466e;outline-offset:3px}
</style></head><body><main><h1>Image credits</h1>
<p>These are example food photographs, not photographs of this café's actual dishes.
Names, ingredients, portion sizes and presentation may differ. Product descriptions describe the menu items.</p>
<ul>''' + '\n'.join(credits) + '''</ul>
<p>The decorative cart SVG was drawn for this project and is released under
<a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>.
No third-party icon or font is included. The original text-only MY CAFÉ header is restored.</p>
<p>CC0 photographs: <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0 dedication</a>.
Public domain photographs are identified as such on their linked source pages; this is a copyright status, not an invented licence.</p>
<p>Full source metadata: <a href="provenance.json">provenance.json</a>.
Original graphic licence: <a href="OWN_ASSET_LICENSE.txt">OWN_ASSET_LICENSE.txt</a>.</p>
<p><a href="/">Back to the café</a></p></main></body></html>
''', encoding='utf-8')


def luminance(color):
    channels = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    linear = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in channels]
    return sum(x * w for x, w in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(a, b):
    x, y = sorted([luminance(a), luminance(b)])
    return (y + 0.05) / (x + 0.05)


inventory = []
for asset in assets:
    v400, v800 = asset['variants']
    source = (f'[{asset["source_title"]}]({asset["source_page"]})' if asset['source_page']
              else f'User-supplied `{asset["source_local"]}`')
    inventory.append(f'| `{v400["file"]}`, `{v800["file"]}` | '
                     f'Menu → {asset["product"]}; `web/src/media.tsx` | WebP | {v400["width"]}×{v400["height"]}; {v800["width"]}×{v800["height"]} | '
                     f'{v400["bytes"]:,}; {v800["bytes"]:,} | '
                     f'{source}, {asset["author"]} | {asset["license"]} |')
logo_bytes = (MEDIA / 'cafe-logo.svg').stat().st_size
inventory.append(f'| `cafe-logo.svg` | Unused; removed from header and favicon at user request | SVG | viewBox 64×64 | {logo_bytes:,} | Created in this task; no third-party graphic | CC0 1.0, explicitly recorded in `OWN_ASSET_LICENSE.txt` |')
inventory.append(f'| `cart-icon.svg` | Decorative icon in View Cart button; `MenuPage.tsx` | SVG | viewBox 24×24; displayed 20×20 | {(MEDIA / "cart-icon.svg").stat().st_size:,} | Created in this task; no third-party graphic | CC0 1.0; `OWN_ASSET_LICENSE.txt` |')
for supplied in sorted((ROOT / 'фотки').glob('*')):
    if not supplied.is_file():
        continue
    dimensions = 'Not applicable (audio; not used)'
    if supplied.suffix.lower() in ('.jpg', '.png', '.webp'):
        with Image.open(supplied) as image:
            dimensions = f'{image.width}×{image.height}'
    use = 'Source for cheeseburger WebP variants' if supplied.suffix == '.png' else 'Supplied material; not loaded by the app'
    inventory.append(f'| `фотки/{supplied.name}` | {use} | {supplied.suffix[1:].upper()} | {dimensions} | {supplied.stat().st_size:,} | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |')
inventory.append('| `added-feedback` | Text notification after Add to cart; `MenuPage.tsx`, `styles.css` | CSS keyframes | 240 ms; 4 px vertical movement | Included in CSS bundle | Original CSS written in this task | No third-party asset; supplied as project code, no separate pre-existing licence |')
unused = ROOT / 'chrome_0S2jMh3xdw.png'
if unused.exists():
    with Image.open(unused) as image:
        dimensions = f'{image.width}×{image.height}'
    inventory.append(f'| `chrome_0S2jMh3xdw.png` (existing) | Root folder only; not referenced or served by the app | PNG | {dimensions} | {unused.stat().st_size:,} | Not documented in project | Not documented; not reused |')

original_total = sum(a['original_bytes'] for a in assets)
small_total = sum(a['variants'][0]['bytes'] for a in assets)
large_total = sum(a['variants'][1]['bytes'] for a in assets)
ratios = [
    ('Normal text / card', '#17202b', '#ffffff'),
    ('Secondary text and photo captions / card', '#526174', '#ffffff'),
    ('Secondary text / panel', '#526174', '#e8eff6'),
    ('Secondary text / page', '#526174', '#eef3f8'),
    ('White button text / brand', '#ffffff', '#14466e'),
    ('Category Burgers', '#ffffff', '#a8452a'),
    ('Category Drinks', '#ffffff', '#1f6f6b'),
    ('Category Desserts', '#ffffff', '#7a4b8a'),
    ('Feedback text / panel', '#14466e', '#e8eff6'),
]
for label, fg, bg in ratios:
    assert contrast(fg, bg) >= 4.5, label
contrast_table = '\n'.join(f'| {label} | `{fg}` | `{bg}` | {contrast(fg,bg):.2f}:1 |' for label, fg, bg in ratios)
builds = []
for name, folder in [('Before', ROOT / 'comparison/before/web/dist'), ('After', ROOT / 'web/dist')]:
    if folder.exists():
        files = list(folder.rglob('*'))
        code_files = [p for p in files if p.is_file() and p.suffix in ('.html', '.js', '.css') and 'media' not in p.parts]
        builds.append(f'| {name} | ' + ' + '.join(f'`{p.relative_to(folder).as_posix()}`: {p.stat().st_size:,} B' for p in sorted(code_files)) + ' |')
build_table = '\n'.join(builds) if builds else '| Pending | Run `node tools/build-comparison.mjs` |'
verification_path = ROOT / 'comparison/verification.json'
verification = json.loads(verification_path.read_text(encoding='utf-8')) if verification_path.exists() else None
verification_text = ('Checks have not finished. Do not treat planned checks as results.' if not verification else
                     f'Actual automated run: Chrome {verification["browser"]}; production demo builds; isolated browser contexts; '
                     '360×800 CSS px, DPR 1, plus a DPR 2 image-selection check.\n\n' +
                     '\n'.join('- ' + check + '.' for check in verification['checks']) +
                     '\n\nDetailed results: `comparison/verification.json`. UI screenshots: '
                     '`comparison/qa-before-360.png`, `comparison/qa-after-360.png`. '
                     'These are layout screenshots, not DevTools Network evidence. Automated scans do not prove full accessibility compliance.')

media_source = (ROOT / 'web/src/media.tsx').read_text(encoding='utf-8')
img_snippet = media_source[media_source.index('      <img'):media_source.index('      <figcaption>')].rstrip()
css_source = (ROOT / 'web/src/styles.css').read_text(encoding='utf-8')
css_start = css_source.index('.added-message span{')
css_end = css_source.index('@media(max-width:400px)')
css_snippet = css_source[css_start:css_end].strip()

report = f'''# ICT Assignment 4 — Part B: Multimedia in the prototype

Project: MY CAFÉ. Work date: 25 October 2026 (Asia/Qyzylorda).

## B1 — Asset inventory and changes

### Original prototype

The app uses React, TypeScript and Vite in `web/`. The optional REST API and PostgreSQL code are in `server/`.
The original menu is text only. A source search found no image elements, SVG graphics, audio, video, CSS image URLs, CSS keyframes or animation declarations in the running frontend. Buttons use text or Unicode characters such as + and −. The stylesheet names system fonts; no webfont file is downloaded. The root PNG listed below is not referenced by the app. Its source and licence are unknown, so it was not reused.

Before any edits, application source and configuration files were copied to `comparison/before/` (both `web` and `server`, plus root README, Docker Compose, ignore file and lockfile). Dependencies, generated builds, runtime logs and the unrelated `welcome-to-docker` folder were excluded. `comparison/before-source-manifest.json` records the original file bytes and SHA-256 hashes. The build script verifies every recorded file before building. Both versions use the same locked React/Vite dependencies.

### Assets in the finished prototype

All photo files below are in `web/public/media/`. They are local resources, not hotlinked images. The two files on each row are responsive variants of one asset. Photo labels on the page say “Example photo · actual presentation may vary”. These are representative stock photographs, not photos of this café's actual dishes. The double burger has a grilled cheese bun; the photograph does not redefine the menu ingredients. New or renamed products without a matching photograph remain text cards.

| Name | Where used | Format | Pixel dimensions | File bytes (small; large) | Source and author | Licence / copyright status |
|---|---|---|---|---:|---|---|
{chr(10).join(inventory)}

Sources and licences of the seven Commons photographs were read from the individual file pages and their imageinfo metadata. The cheeseburger was replaced with the PNG supplied by the user in `фотки`; no author or external licence was supplied, so none is claimed. JPG and WebP alternatives and two notification sound files were also supplied; the sounds are not connected to playback. “Public domain” is a copyright status, not a newly assigned licence. Exact usage terms, original dimensions, download URLs or local source paths, source hashes and output bytes are in `web/public/media/provenance.json`. Original Commons metadata and downloaded originals are in `comparison/media-originals/`; the earlier Commons cheeseburger remains archived but is no longer used. No source or licence was inferred from the food name or from a search thumbnail.

At the user's request, the MY CAFÉ header and browser favicon were restored to the original version. The added cup logo is unused. A small original SVG cart icon is used beside the View Cart button text instead. Its CC0 dedication is explicitly recorded in `web/public/media/OWN_ASSET_LICENSE.txt`. Source and licence links are available in `web/public/media/credits.html`.

### Media optimisation

- Photos: centre crop to 8:5, resize with Lanczos, WebP quality 76, method 6, no EXIF metadata. The downloaded originals are not in the production public folder.
- Every image has a 400×250 version. Large versions are 800×500 for seven stock photos and 740×462 for the supplied cheeseburger, preserving its source width without upscaling. Images use `srcSet`, `sizes`, fixed intrinsic dimensions, `decoding="async"`, and lazy loading except for the first card in the current results.
- The eight active source images (seven JPEGs and the supplied PNG) total **{original_total:,} bytes**. The eight 400w files total **{small_total:,} bytes**; the eight large variants total **{large_total:,} bytes**; all 16 active WebP files total **{small_total + large_total:,} bytes**. These are actual filesystem sizes, not browser transfer measurements. A browser normally chooses one variant per photo.
- Actual file validation is saved in `comparison/media-checks.json`: 16 WebP files match their recorded dimensions, bytes and source hashes; none is upscaled and none contains EXIF. Side-by-side visual review used `comparison/quality-source-vs-webp-1.png` and `comparison/quality-source-vs-webp-2.png`, plus the 360 px UI screenshots. At the intended card size (276 CSS px wide in a 360 px viewport), no obvious quality loss was seen. This is a visual assessment, not a numerical quality score or a speed measurement.
- SVG stays sharp at different screen densities. The CSS animation is a single 240 ms text entrance after an explicit button press; it uses no audio, GIF or video download. Reduced-motion users get static feedback.

Recreate the photo outputs with `python tools/prepare_media.py` (Python with Pillow 12.2.0). Existing archived sources are reused. `python tools/write_report.py` refreshes credits and this report from the saved manifest and test results.

## B2 — Before / After performance evidence

### Real Network measurements — student must fill these in

**No DevTools Network timings or transfer totals were measured for this report.** The cells below are intentional placeholders. Build output, disk bytes and UI screenshots are not substitutions for Network measurements. The original page had no photos, so the new media page may transfer more bytes and make more requests than the text-only original. WebP optimisation reduces the added photo cost; it does not establish an overall Before/After speed improvement.

| Evidence from Chrome Network | Before: port 4173 | After: port 4174 |
|---|---|---|
| Screenshot file | [insert real Before screenshot] | [insert real After screenshot] |
| Transferred | [fill from Network summary] | [fill from Network summary] |
| Requests | [fill from Network summary] | [fill from Network summary] |
| Finish | [fill actual time] | [fill actual time] |
| Load | [fill actual time] | [fill actual time] |
| DOMContentLoaded (optional) | [fill actual time] | [fill actual time] |
| Chrome version / machine | [fill] | [same machine and version] |
| Viewport / DPR | 360×800 / 1 | 360×800 / 1 |
| Cache / throttling | Disable cache / Fast 4G | Disable cache / Fast 4G |

### Production build preparation and launch

From `C:\\cafebuisness`:

```powershell
# Dependencies (already installed in this delivered workspace)
npm.cmd --prefix web ci
npm.cmd --prefix comparison/before/web ci

# Verify baseline hashes, type-check and build BOTH versions in demo mode
node tools/build-comparison.mjs

# Terminal 1: original production build
node tools/serve-comparison.mjs before

# Terminal 2: media production build
node tools/serve-comparison.mjs after
```

Before: <http://127.0.0.1:4173>. After: <http://127.0.0.1:4174>.
Use `127.0.0.1` consistently for both, without switching one version to `localhost`.
The build script sets `VITE_API_URL` to the empty string at process level, overriding Vite env files. Both builds use the original seeded demo API and browser storage; PostgreSQL is not required. This avoids comparing API latency with demo latency. The source files `api.ts` and `store.tsx` have not been edited. The earlier development server at port 5173 is unsuitable for this production comparison.

### Steps for two genuine screenshots

1. Open a fresh Chrome Incognito window, with extensions disabled. This gives clean storage without clearing the normal browser's orders. Use the same window and computer for both ports. Do not log in, add products or change the data before measuring.
2. Open DevTools and the Network panel. Select **All**, remove text filters, enable **Disable cache**, select **Fast 4G**, and disable **Preserve log**. Disable cache works while DevTools is open.
3. In device emulation, set a responsive viewport of **360×800 CSS px** and **DPR 1**. Use the same browser zoom and DevTools layout for both. Keep the menu at the top with the default **Burgers** category and no search text.
4. Visit `http://127.0.0.1:4173`. Clear the Network log, then reload with DevTools open. Do not scroll or interact. Wait until the initial requests have completed; capture the request list and bottom summary showing Requests, Transferred, Finish and Load. Include the cache and throttle controls in the screenshot when possible. Record the displayed units exactly.
5. Repeat the same procedure at `http://127.0.0.1:4174`. Lazy loading makes viewport and scrolling relevant, so keep them identical. Save the two real screenshots in `comparison/` and fill in the table.
6. If all summary timings are not visible in one screenshot, widen DevTools or capture an extra view. Do not replace missing values with estimates. Compare the results honestly, even if the media version is larger or slower. An optional second test can scroll through all categories, but that must be reported separately from initial page load.

### Actual disk evidence, separate from Network results

The following HTML/JS/CSS file sizes were read from the production builds on disk. Public media and credits are accounted for separately above. Compression, HTTP headers, cache and browser requests affect Network transfer totals.

| Build | Actual output file sizes |
|---|---|
{build_table}

## B3 — Accessibility implementation and evidence

The focused B3 audit is documented in `B3_ACCESSIBILITY.md`, with PASS / FAIL / NOT APPLICABLE decisions, exact file/line references, and evidence from all audited screens. It also records the contrast fixes for inactive product cards and the cart summary.

### Meaningful photos, decorative cart icon and accessible controls

`web/src/media.tsx` contains descriptive `alt` text for each photo. For example:

```tsx
  americano: {{ slug: 'americano', alt: 'Example black coffee in a white cup' }},
```

The actual image markup is:

```tsx
{img_snippet}
```

`web/src/pages/MenuPage.tsx` uses a decorative cart icon inside the visibly named View Cart button. `App.tsx` has the original text-only MY CAFÉ header:

```tsx
<img className="cart-icon" src="/media/cart-icon.svg" width={{20}} height={{20}} alt="" />
```

The empty `alt` keeps the decorative cart icon silent. Native buttons retain visible text. `MenuPage.tsx` keeps ``aria-label={{`Add ${{p.name}} to cart`}}``; `CartPage.tsx` keeps `aria-label="Decrease quantity"` and `aria-label="Increase quantity"` on its − and + controls. These are accessible names for the symbol buttons. No unnamed interactive SVG icon was added. The page has a `main` landmark and visible keyboard focus styles.

### Visual feedback, motion and sound

`web/src/pages/MenuPage.tsx` keeps a persistent live region:

```tsx
<p className="added-message" role="status" aria-live="polite" aria-atomic="true"><span key={{notice.sequence}}>{{notice.text}}</span></p>
```

After adding a product it displays and announces “[product name] added to cart.” The cart count and total also update. It does not rely on sound or colour alone. Two audio files were supplied in the local materials folder but are not loaded or played by the app. There are no audio/video elements, speech playback, Web Audio calls or autoplay attributes in either version. Subtitles and transcripts are therefore not applicable. No sound is played automatically or on a timer.

The actual CSS from `web/src/styles.css` is:

```css
{css_snippet}
```

### 360 px layout

Images use `display:block; width:100%; height:auto; aspect-ratio:8/5`. The viewport meta tag is present in `web/index.html`. Navigation wraps to additional rows; narrow-screen rows can wrap; cards allow long text to break. Buttons retain their original minimum heights of 44–48 px. The menu, cart, customer orders and staff views were checked at 360 px; see actual check results below. No data model or persistence change was needed for these layout changes.

### Contrast

No interface text is placed over photographs. Captions, product names, prices and buttons sit on opaque CSS surfaces. There is therefore no variable image background behind the readable UI text. Text visible inside a source photograph (for example a bottle label) is not used to provide essential menu information. The menu provides that information separately as text.

The muted text colour was darkened from `#667487` to `#526174`. Ratios below are calculated from the actual CSS sRGB hex values using the WCAG relative-luminance formula `(Llighter + 0.05) / (Ldarker + 0.05)`. These are calculations, not invented performance measurements. All listed text pairs exceed **4.5:1**.

| Text / surface | Foreground | Background | Calculated contrast |
|---|---|---|---:|
{contrast_table}

### Build and functional verification

Both builds pass TypeScript and Vite production compilation. Tests can be repeated while both comparison servers are running:

The requested standard build command was also run successfully from the project root:

```powershell
npm.cmd --prefix web run build
```

For the comparison, `node tools/build-comparison.mjs` then rebuilt both versions with the same explicit demo environment. Repeat the local media checks and production browser checks with:

```powershell
npm.cmd --prefix tools ci
python tools/review_media.py
npm.cmd --prefix tools run check
```

The check script uses installed Google Chrome in headless mode with fresh temporary browser contexts. It never opens or changes the user's normal browser storage. It tests the existing demo flow, not a live PostgreSQL deployment.

{verification_text}

### Remaining student actions

- Capture the two real Chrome DevTools Network screenshots and fill B2 with the displayed values. No measurement claims should be made before this step.
- Review the 360 px UI yourself, including keyboard focus and a screen-reader spot check. Automated scans cover only part of accessibility.
- If actual café photography is required by the marking rubric, replace the clearly labelled example photos with photographs you own or have permission to use, then rerun the build, checks and measurements.
'''
report_path = ROOT / 'PART_B_REPORT.md'
# Keep any real measurements the student has entered when regenerating evidence.
if report_path.exists():
    previous = report_path.read_text(encoding='utf-8')
    start = '| Evidence from Chrome Network |'
    end = '### Production build preparation and launch'
    if start in previous and end in previous:
        old_table = previous[previous.index(start):previous.index(end)]
        # Empty only the original prompts; retain any real measurements entered later.
        import re
        old_table = re.sub(r'\[(?:fill[^\]]*|insert real[^\]]*|same machine and version)\]', '', old_table)
        report = report[:report.index(start)] + old_table + report[report.index(end):]
report_path.write_text(report, encoding='utf-8')
print('Updated credits.html and PART_B_REPORT.md using actual local evidence.')
