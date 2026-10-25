# ICT Assignment 4 Part B3 — Accessibility audit

Project: MY CAFÉ. Audit date: 25 October 2026 (Asia/Qyzylorda).

## Scope and method

The current React frontend and its local image-credits page were checked in production, using Chrome 155.0.8059.86 and fresh temporary browser storage. Viewports were 360×800 and 1280×900 CSS px. All five app views, all menu categories, relevant empty/error/form states and all five order-status labels were included. No normal user orders or browser data were changed.

The audit combined a scan of 18 frontend/source HTML/SVG files, visual review of the product images, DOM/image inspection, caption geometry, computed styles, audio API instrumentation, network request observation and axe WCAG A/AA scans. Actual structured results: `comparison/b3-audit.json`. Initial failures: `comparison/b3-before-fix.json`.

PASS means the stated requirement was checked and met in this build and scope. FAIL means a checked requirement has an unresolved problem. NOT APPLICABLE means the content that would trigger the requirement is absent; it does not mean captions or sound alternatives were implemented. There are no unresolved FAIL entries in this audit. This is a focused Part B3 audit, not a claim of full WCAG certification or a live PostgreSQL integration test. A real screen reader was not used; live-region semantics were checked in the DOM.

## Requirement decisions and code evidence

| Requirement | Final status | Checked result | File and line evidence |
|---|---|---|---|
| Meaningful images have descriptive alt | **PASS** | All eight product photos have non-empty descriptions matching the reviewed images. Both variants use the same description. | `web/src/media.tsx:4`; `web/src/media.tsx:31` |
| Decorative images use alt="" | **PASS** | The cart icon is decorative. Its button has visible text “View Cart”; the image does not add a duplicate spoken name. | `web/src/pages/MenuPage.tsx:45`; `tools/audit-b3.mjs:162` |
| Speech media has captions or a transcript | **NOT APPLICABLE** | No speech media, audio/video players or embedded players are connected to the site. No captions/transcripts are claimed to exist. | `tools/audit-b3.mjs:87`; `comparison/b3-audit.json:45` |
| Sound notifications have a visual equivalent | **NOT APPLICABLE** | There are no active sound notifications. Visible add-to-cart feedback, order-status words and error text were checked independently. | `comparison/b3-audit.json:25`; `web/src/pages/MenuPage.tsx:25`; `web/src/components.tsx:9` |
| No automatic sound playback | **PASS** | Source scanning and runtime instrumentation observed no media playback, Audio/Web Audio construction or speech synthesis in the audited flows. | `tools/audit-b3.mjs:17`; `comparison/b3-audit.json:46`; `comparison/b3-audit.json:24` |
| Text over images has contrast of at least 4.5:1 | **NOT APPLICABLE** | There is no authored interface text over a photograph. Captions are below the images on solid white cards. No CSS image backgrounds were found. | `web/src/media.tsx:33`; `web/src/styles.css:49`; `comparison/b3-audit.json:43`; `comparison/b3-audit.json:47` |
| Related text contrast, including inactive product cards | **PASS** | Initially FAIL: whole-card opacity faded readable text and active Edit/Enable controls. The opacity was removed. The cart summary now uses an explicit opaque white text color. | `web/src/styles.css:42`; `web/src/styles.css:37`; `comparison/b3-audit.json:48` |

For absence findings, there is no application line declaring “no audio”. The cited scanner/observer code and the saved zero-match results provide the evidence. The complete scanned-file list appears below.

## Every image rendered by the site

The image descriptions were compared with the actual images, rather than treating any non-empty string as a valid description. The examples do not claim to be photographs of the café's actual dishes. The eight image assets have sixteen responsive WebP files. Alternative text is attached to the single image element, so the selected file variant does not change its meaning.

| Asset | Purpose | Actual alternative text | Status | Source line |
|---|---|---|---|---|
| `cheeseburger` (both responsive variants) | Meaningful example product image | `Example cheeseburger with cheese, lettuce and tomato on a white background` | PASS | `web/src/media.tsx:5` |
| `chicken-burger` (both responsive variants) | Meaningful example product image | `Example fried chicken burger in a bun` | PASS | `web/src/media.tsx:6` |
| `double-burger` (both responsive variants) | Meaningful example product image | `Example double cheeseburger with a grilled cheese bun` | PASS | `web/src/media.tsx:7` |
| `cola` (both responsive variants) | Meaningful example product image | `Example glass of cola on a table beside flowers` | PASS | `web/src/media.tsx:8` |
| `lemonade` (both responsive variants) | Meaningful example product image | `Example pale lemonade served in a glass jar` | PASS | `web/src/media.tsx:9` |
| `americano` (both responsive variants) | Meaningful example product image | `Example black coffee in a white cup` | PASS | `web/src/media.tsx:10` |
| `cheesecake` (both responsive variants) | Meaningful example product image | `Example New York cheesecake with a red fruit topping` | PASS | `web/src/media.tsx:11` |
| `brownie` (both responsive variants) | Meaningful example product image | `Example chocolate brownie` | PASS | `web/src/media.tsx:12` |
| `cart-icon.svg` | Decorative image next to visible “View Cart” text | `alt=""` | PASS | `web/src/pages/MenuPage.tsx:45` |

No other image element, inline SVG used as UI content, or CSS image background was found in the app. `web/public/media/cafe-logo.svg` is an unused asset, not a rendered logo or favicon. The original text-only MY CAFÉ header is unchanged. The root screenshot and files in `фотки/` are not directly loaded as page images. The supplied PNG is the source of the optimized cheeseburger variants.

Actual image markup, `web/src/media.tsx:23`:

```tsx
 23:       <img
 24:         src={`/media/${photo.slug}-${width}.webp`}
 25:         srcSet={`/media/${photo.slug}-400.webp 400w, /media/${photo.slug}-${width}.webp ${width}w`}
 26:         sizes="(max-width: 400px) calc(100vw - 84px), (max-width: 520px) calc(100vw - 92px), 428px"
 27:         width={width}
 28:         height={height}
 29:         loading={priority ? 'eager' : 'lazy'}
 30:         decoding="async"
 31:         alt={photo.alt}
 32:       />
```

Decorative icon and its visibly named button, `web/src/pages/MenuPage.tsx:45`:

```tsx
 45:           <button className="btn sm" onClick={onCart}><img className="cart-icon" src="/media/cart-icon.svg" width={20} height={20} alt="" />View Cart</button>
```

## Speech, notifications and autoplay

There are no connected audio/video elements, speech playback, embedded media players or source matches for playback APIs. The audit observed 0 audio/video requests and 0 playback API calls/events in the checked flows. These are actual audit counts, not performance timings.

The files `фотки/order_alert.mp3` and `фотки/order_alert.wav` are unconnected source materials outside the app's public directory. Their content was not listened to or classified as speech, because the application does not load or play them. A transcript is therefore not required for the current site; this must be reassessed if either file is connected later.

The page already provides visible feedback without sound. Add-to-cart feedback uses the following persistent live region:

```tsx
 25:         <p className="added-message" role="status" aria-live="polite" aria-atomic="true"><span key={notice.sequence}>{notice.text}</span></p>
```

Its message is updated here:

```tsx
 36:                 setNotice((previous) => ({ text: `${p.name} added to cart.`, sequence: previous.sequence + 1 }));
```

Order states also have visible words, rather than relying only on color or sound:

```tsx
  9: export const Badge = ({ s }: { s: string }) => <span className={`badge s-${s}`}>{s.toUpperCase()}</span>;
```

No autoplay stop/volume control was added, because nothing plays sound. No speech caption or transcript is falsely marked as implemented.

## Image text and contrast

There is no authored interface text over product photographs. The audit checked that each caption begins below its image; no overlap was recorded. The fixed cart summary has an opaque brand-colored background. Names, prices and captions use solid card surfaces. Words incidentally present inside a source photo are not used to communicate essential menu information.

The caption rule is:

```css
 49: .product-photo figcaption{padding:7px 0 0;background:var(--card);color:var(--mute);font-size:.75rem}
```

For the real text surfaces, the following ratios were calculated from the actual opaque CSS color values using WCAG relative luminance. Axe independently checked rendered text contrast, including the inactive-card state. Ratios are color calculations, not Network measurements.

| Text / surface | Foreground | Background | Calculated ratio | Status |
|---|---|---|---:|---|
| Product captions and secondary text / white card | `#526174` | `#ffffff` | 6.32:1 | PASS |
| Inactive-card secondary text / white card | `#526174` | `#ffffff` | 6.32:1 | PASS |
| Edit and Enable labels / white card | `#14466e` | `#ffffff` | 9.85:1 | PASS |
| Cart summary / brand background | `#ffffff` | `#14466e` | 9.85:1 | PASS |
| Feedback text / panel | `#14466e` | `#e8eff6` | 8.50:1 | PASS |

### Violations found and fixed

1. **Initial FAIL — inactive product card.** `.off{opacity:.6}` faded the entire card, including text and the still-active Edit/Enable buttons. Axe reported 2.70:1 for secondary text and 3.44:1 for these buttons. Those ratios failed 4.5:1. The fix removes whole-card opacity and uses a dashed border; the existing visible “Disabled — hidden from customers” text still explains the state. The final secondary text is 6.32:1 and the button labels are 9.85:1 against white.
2. **Initial FAIL in the automated cart-summary check.** Axe flagged the translucent small cart-summary label in a scrolled menu state. The fix removes its opacity and specifies the existing white text color directly. The final opaque text/background pair is 9.85:1, and the same state passes the repeated axe check. The initial diagnostic is preserved; its compositing estimate is not presented as a hand-measured pixel ratio.

Actual final CSS:

```css
 37: .cartbar small{display:block;color:var(--on)}.cartbar .btn{background:var(--card);color:var(--brand)}
 42: .flow{color:var(--brand);font-weight:600}.empty{text-align:center;padding:28px 10px;color:var(--mute)}.off{border-style:dashed}
```

Only presentation styles were changed in the app. API calls, order rules, product data, authentication, storage and checkout were not edited. Native disabled buttons remain disabled; this fix concerns readable information and active controls inside a product card. The inactive-control contrast exception does not excuse fading active Edit/Enable buttons. See [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## Runtime coverage and results

The initial audit recorded 2 failing state/rule entries. After the fixes, all 27 audited states had zero detected axe A/AA violations. Image-alt checks, decorative-button naming, media-call checks and image-caption geometry checks passed. No horizontal document overflow was observed in the audited viewports. Automated results do not prove that every possible assistive-technology interaction is correct.

- 360 px menu: Burgers
- 360 px menu: Drinks
- 360 px menu: Desserts
- 360 px menu: empty search
- 360 px empty cart
- 360 px empty customer orders
- 360 px staff login
- 360 px login error
- 360 px new product form
- 360 px product validation error
- 360 px edit product form
- 360 px inactive product: Edit and Enable remain active
- 360 px cart feedback and decorative SVG
- 360 px populated cart
- 360 px customer orders: all five status labels
- 360 px staff orders: All
- 360 px staff orders: New
- 360 px staff orders: Preparing
- 360 px staff orders: Ready
- 360 px staff orders: Completed
- 1280 px Menu
- 1280 px Cart
- 1280 px My orders
- 1280 px Orders (staff)
- 1280 px Manage menu
- 1280 px image credits
- 360 px image credits

The customer-order status samples were fixtures in a disposable browser context, covering New, Preparing, Ready, Completed and Cancelled. They were not added to the user's normal data.

## Reproduce the checks

From `C:\cafebuisness`:

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

- `web/src/api.ts`
- `web/src/App.tsx`
- `web/src/components.tsx`
- `web/src/main.tsx`
- `web/src/media.tsx`
- `web/src/pages/AdminOrdersPage.tsx`
- `web/src/pages/CartPage.tsx`
- `web/src/pages/ManageMenuPage.tsx`
- `web/src/pages/MenuPage.tsx`
- `web/src/pages/MyOrdersPage.tsx`
- `web/src/store.tsx`
- `web/src/styles.css`
- `web/src/types.ts`
- `web/src/vite-env.d.ts`
- `web/index.html`
- `web/public/media/cafe-logo.svg`
- `web/public/media/cart-icon.svg`
- `web/public/media/credits.html`

## Standards used to interpret the findings

- [W3C Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html): text alternatives and decorative content.
- [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): contrast and inactive-component exceptions.
- [W3C Audio Control](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html): automatic audio playback.
