"""Write the B3 report using the saved production audit and current source lines."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
audit = json.loads((ROOT / 'comparison/b3-audit.json').read_text(encoding='utf-8'))
before = json.loads((ROOT / 'comparison/b3-before-fix.json').read_text(encoding='utf-8'))
assert not audit['summary']['violations'], 'Do not publish a passing report with unresolved violations'


def line(file, text):
    for index, content in enumerate((ROOT / file).read_text(encoding='utf-8').splitlines(), 1):
        if text in content:
            return index
    raise ValueError(f'Missing evidence: {file}: {text}')


def ref(file, text):
    return f'`{file}:{line(file, text)}`'


def snippet(file, start, end=None):
    lines = (ROOT / file).read_text(encoding='utf-8').splitlines()
    first = line(file, start) - 1
    last = line(file, end) if end else first + 1
    return '\n'.join(f'{index + 1:>3}: {lines[index]}' for index in range(first, last))


def contrast(foreground, background):
    def luminance(color):
        values = [int(color[i:i+2], 16) / 255 for i in (1, 3, 5)]
        values = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
        return sum(v * w for v, w in zip(values, (0.2126, 0.7152, 0.0722)))
    light, dark = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (light + 0.05) / (dark + 0.05)


image_rows = []
for content in (ROOT / 'web/src/media.tsx').read_text(encoding='utf-8').splitlines():
    match = re.search(r"slug: '([^']+)', alt: '([^']+)'", content)
    if match:
        slug, alt = match.groups()
        image_rows.append(f'| `{slug}` (both responsive variants) | Meaningful example product image | `{alt}` | PASS | {ref("web/src/media.tsx", content.strip())} |')
image_rows.append(f'| `cart-icon.svg` | Decorative image next to visible “View Cart” text | `alt=""` | PASS | {ref("web/src/pages/MenuPage.tsx", "cart-icon.svg")} |')
assert len(image_rows) == 9

requirements = [
    ('Meaningful images have descriptive alt', 'PASS', 'All eight product photos have non-empty descriptions matching the reviewed images. Both variants use the same description.',
     ref('web/src/media.tsx', 'const PHOTOS:') + '; ' + ref('web/src/media.tsx', 'alt={photo.alt}')),
    ('Decorative images use alt=""', 'PASS', 'The cart icon is decorative. Its button has visible text “View Cart”; the image does not add a duplicate spoken name.',
     ref('web/src/pages/MenuPage.tsx', 'cart-icon.svg') + '; ' + ref('tools/audit-b3.mjs', 'const imageErrors =')),
    ('Speech media has captions or a transcript', 'NOT APPLICABLE', 'No speech media, audio/video players or embedded players are connected to the site. No captions/transcripts are claimed to exist.',
     ref('tools/audit-b3.mjs', 'const playbackPattern =') + '; ' + ref('comparison/b3-audit.json', '"audioVideoElements": []')),
    ('Sound notifications have a visual equivalent', 'NOT APPLICABLE', 'There are no active sound notifications. Visible add-to-cart feedback, order-status words and error text were checked independently.',
     ref('comparison/b3-audit.json', '"mediaRequests": []') + '; ' + ref('web/src/pages/MenuPage.tsx', 'role="status"') + '; ' + ref('web/src/components.tsx', 'export const Badge')),
    ('No automatic sound playback', 'PASS', 'Source scanning and runtime instrumentation observed no media playback, Audio/Web Audio construction or speech synthesis in the audited flows.',
     ref('tools/audit-b3.mjs', 'HTMLMediaElement.prototype.play =') + '; ' + ref('comparison/b3-audit.json', '"playbackCalls": []') + '; ' + ref('comparison/b3-audit.json', '"playbackMatches": []')),
    ('Text over images has contrast of at least 4.5:1', 'NOT APPLICABLE', 'There is no authored interface text over a photograph. Captions are below the images on solid white cards. No CSS image backgrounds were found.',
     ref('web/src/media.tsx', '<figcaption>') + '; ' + ref('web/src/styles.css', '.product-photo figcaption') + '; ' + ref('comparison/b3-audit.json', '"overlaps": []') + '; ' + ref('comparison/b3-audit.json', '"cssImageBackgrounds": []')),
    ('Related text contrast, including inactive product cards', 'PASS', 'Initially FAIL: whole-card opacity faded readable text and active Edit/Enable controls. The opacity was removed. The cart summary now uses an explicit opaque white text color.',
     ref('web/src/styles.css', '.off{') + '; ' + ref('web/src/styles.css', '.cartbar small{') + '; ' + ref('comparison/b3-audit.json', '"violations": []')),
]
rows = '\n'.join(f'| {name} | **{status}** | {explanation} | {evidence} |' for name, status, explanation, evidence in requirements)
state_list = '\n'.join('- ' + state['label'] for state in audit['states'])
colors = [
    ('Product captions and secondary text / white card', '#526174', '#ffffff'),
    ('Inactive-card secondary text / white card', '#526174', '#ffffff'),
    ('Edit and Enable labels / white card', '#14466e', '#ffffff'),
    ('Cart summary / brand background', '#ffffff', '#14466e'),
    ('Feedback text / panel', '#14466e', '#e8eff6'),
]
color_rows = '\n'.join(f'| {label} | `{fg}` | `{bg}` | {contrast(fg, bg):.2f}:1 | PASS |' for label, fg, bg in colors)
source_evidence = '\n'.join('- `' + file + '`' for file in audit['sourceFilesScanned'])
report = f'''# ICT Assignment 4 Part B3 — Accessibility audit

Project: MY CAFÉ. Audit date: 25 October 2026 (Asia/Qyzylorda).

## Scope and method

The current React frontend and its local image-credits page were checked in production, using Chrome {audit['browser']} and fresh temporary browser storage. Viewports were 360×800 and 1280×900 CSS px. All five app views, all menu categories, relevant empty/error/form states and all five order-status labels were included. No normal user orders or browser data were changed.

The audit combined a scan of {len(audit['sourceFilesScanned'])} frontend/source HTML/SVG files, visual review of the product images, DOM/image inspection, caption geometry, computed styles, audio API instrumentation, network request observation and axe WCAG A/AA scans. Actual structured results: `comparison/b3-audit.json`. Initial failures: `comparison/b3-before-fix.json`.

PASS means the stated requirement was checked and met in this build and scope. FAIL means a checked requirement has an unresolved problem. NOT APPLICABLE means the content that would trigger the requirement is absent; it does not mean captions or sound alternatives were implemented. There are no unresolved FAIL entries in this audit. This is a focused Part B3 audit, not a claim of full WCAG certification or a live PostgreSQL integration test. A real screen reader was not used; live-region semantics were checked in the DOM.

## Requirement decisions and code evidence

| Requirement | Final status | Checked result | File and line evidence |
|---|---|---|---|
{rows}

For absence findings, there is no application line declaring “no audio”. The cited scanner/observer code and the saved zero-match results provide the evidence. The complete scanned-file list appears below.

## Every image rendered by the site

The image descriptions were compared with the actual images, rather than treating any non-empty string as a valid description. The examples do not claim to be photographs of the café's actual dishes. The eight image assets have sixteen responsive WebP files. Alternative text is attached to the single image element, so the selected file variant does not change its meaning.

| Asset | Purpose | Actual alternative text | Status | Source line |
|---|---|---|---|---|
{chr(10).join(image_rows)}

No other image element, inline SVG used as UI content, or CSS image background was found in the app. `web/public/media/cafe-logo.svg` is an unused asset, not a rendered logo or favicon. The original text-only MY CAFÉ header is unchanged. The root screenshot and files in `фотки/` are not directly loaded as page images. The supplied PNG is the source of the optimized cheeseburger variants.

Actual image markup, {ref('web/src/media.tsx', '<img')}:

```tsx
{snippet('web/src/media.tsx', '      <img', '      />')}
```

Decorative icon and its visibly named button, {ref('web/src/pages/MenuPage.tsx', 'cart-icon.svg')}:

```tsx
{snippet('web/src/pages/MenuPage.tsx', 'cart-icon.svg')}
```

## Speech, notifications and autoplay

There are no connected audio/video elements, speech playback, embedded media players or source matches for playback APIs. The audit observed {len(audit['mediaRequests'])} audio/video requests and {len(audit['summary']['playbackCalls'])} playback API calls/events in the checked flows. These are actual audit counts, not performance timings.

The files `фотки/order_alert.mp3` and `фотки/order_alert.wav` are unconnected source materials outside the app's public directory. Their content was not listened to or classified as speech, because the application does not load or play them. A transcript is therefore not required for the current site; this must be reassessed if either file is connected later.

The page already provides visible feedback without sound. Add-to-cart feedback uses the following persistent live region:

```tsx
{snippet('web/src/pages/MenuPage.tsx', 'role="status"')}
```

Its message is updated here:

```tsx
{snippet('web/src/pages/MenuPage.tsx', 'setNotice((previous)')}
```

Order states also have visible words, rather than relying only on color or sound:

```tsx
{snippet('web/src/components.tsx', 'export const Badge')}
```

No autoplay stop/volume control was added, because nothing plays sound. No speech caption or transcript is falsely marked as implemented.

## Image text and contrast

There is no authored interface text over product photographs. The audit checked that each caption begins below its image; no overlap was recorded. The fixed cart summary has an opaque brand-colored background. Names, prices and captions use solid card surfaces. Words incidentally present inside a source photo are not used to communicate essential menu information.

The caption rule is:

```css
{snippet('web/src/styles.css', '.product-photo figcaption')}
```

For the real text surfaces, the following ratios were calculated from the actual opaque CSS color values using WCAG relative luminance. Axe independently checked rendered text contrast, including the inactive-card state. Ratios are color calculations, not Network measurements.

| Text / surface | Foreground | Background | Calculated ratio | Status |
|---|---|---|---:|---|
{color_rows}

### Violations found and fixed

1. **Initial FAIL — inactive product card.** `.off{{opacity:.6}}` faded the entire card, including text and the still-active Edit/Enable buttons. Axe reported 2.70:1 for secondary text and 3.44:1 for these buttons. Those ratios failed 4.5:1. The fix removes whole-card opacity and uses a dashed border; the existing visible “Disabled — hidden from customers” text still explains the state. The final secondary text is 6.32:1 and the button labels are 9.85:1 against white.
2. **Initial FAIL in the automated cart-summary check.** Axe flagged the translucent small cart-summary label in a scrolled menu state. The fix removes its opacity and specifies the existing white text color directly. The final opaque text/background pair is 9.85:1, and the same state passes the repeated axe check. The initial diagnostic is preserved; its compositing estimate is not presented as a hand-measured pixel ratio.

Actual final CSS:

```css
{snippet('web/src/styles.css', '.cartbar small{')}
{snippet('web/src/styles.css', '.off{')}
```

Only presentation styles were changed in the app. API calls, order rules, product data, authentication, storage and checkout were not edited. Native disabled buttons remain disabled; this fix concerns readable information and active controls inside a product card. The inactive-control contrast exception does not excuse fading active Edit/Enable buttons. See [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Runtime coverage and results

The initial audit recorded {len(before['summary']['violations'])} failing state/rule entries. After the fixes, all {audit['summary']['states']} audited states had zero detected axe A/AA violations. Image-alt checks, decorative-button naming, media-call checks and image-caption geometry checks passed. No horizontal document overflow was observed in the audited viewports. Automated results do not prove that every possible assistive-technology interaction is correct.

{state_list}

The customer-order status samples were fixtures in a disposable browser context, covering New, Preparing, Ready, Completed and Cancelled. They were not added to the user's normal data.

## Reproduce the checks

From `C:\\cafebuisness`:

```powershell
npm.cmd --prefix web run build
```

Serve the optimized production build (port 4174 is already running in this workspace):

```powershell
node tools/serve-comparison.mjs after
```

Then run the focused B3 audit and refresh this report:

```powershell
npm.cmd --prefix tools run audit:b3
python tools/write_b3_report.py
```

The initial-failure evidence is intentionally retained separately. The audit requires installed Chrome and the dependencies from `npm.cmd --prefix tools ci`. `comparison/b3-inactive-product-360.png` records the final inactive-card layout. No timing, transfer or page-load performance result is claimed here.

## Source files scanned for media and playback

{source_evidence}

## Standards used to interpret the findings

- [W3C Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html): text alternatives and decorative content.
- [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): contrast and inactive-component exceptions.
- [W3C Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html): automatic audio playback.
'''
(ROOT / 'B3_ACCESSIBILITY.md').write_text(report, encoding='utf-8')
print('Wrote B3_ACCESSIBILITY.md with current file/line evidence and saved audit results.')
