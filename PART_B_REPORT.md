# ICT Assignment 4 — Part B: Multimedia in the prototype

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
| `cheeseburger-400.webp`, `cheeseburger-740.webp` | Menu → Cheeseburger; `web/src/media.tsx` | WebP | 400×250; 740×462 | 12,992; 31,210 | User-supplied `фотки/cheeseburger_hero (1).png`, Not provided; file supplied by the user | Not provided; no external licence or authorship claim is made |
| `chicken-burger-400.webp`, `chicken-burger-800.webp` | Menu → Chicken Burger; `web/src/media.tsx` | WebP | 400×250; 800×500 | 11,978; 30,982 | [File:Fried chicken burger .jpg](https://commons.wikimedia.org/wiki/File:Fried_chicken_burger_.jpg), Kurt Kaiser | CC0 |
| `double-burger-400.webp`, `double-burger-800.webp` | Menu → Double Burger; `web/src/media.tsx` | WebP | 400×250; 800×500 | 12,298; 29,474 | [File:Grilled Cheese Cheeseburger Double - Wendy's 2025-11-21.jpg](https://commons.wikimedia.org/wiki/File:Grilled_Cheese_Cheeseburger_Double_-_Wendy%27s_2025-11-21.jpg), Andy Li | CC0 |
| `cola-400.webp`, `cola-800.webp` | Menu → Cola; `web/src/media.tsx` | WebP | 400×250; 800×500 | 12,514; 37,454 | [File:Cola and flowers (Unsplash).jpg](https://commons.wikimedia.org/wiki/File:Cola_and_flowers_(Unsplash).jpg), Brooke Cagle brookecagle | CC0 |
| `lemonade-400.webp`, `lemonade-800.webp` | Menu → Lemonade; `web/src/media.tsx` | WebP | 400×250; 800×500 | 2,822; 7,144 | [File:Lemonade mason jar.jpg](https://commons.wikimedia.org/wiki/File:Lemonade_mason_jar.jpg), Corn cheese | CC0 |
| `americano-400.webp`, `americano-800.webp` | Menu → Americano; `web/src/media.tsx` | WebP | 400×250; 800×500 | 2,532; 5,918 | [File:White cup of black coffee.jpg](https://commons.wikimedia.org/wiki/File:White_cup_of_black_coffee.jpg), Jon-Isac Lindberg | CC0 |
| `cheesecake-400.webp`, `cheesecake-800.webp` | Menu → Cheesecake; `web/src/media.tsx` | WebP | 400×250; 800×500 | 9,696; 23,376 | [File:New York cheesecake 3.jpg](https://commons.wikimedia.org/wiki/File:New_York_cheesecake_3.jpg), Muago | CC0 |
| `brownie-400.webp`, `brownie-800.webp` | Menu → Brownie; `web/src/media.tsx` | WebP | 400×250; 800×500 | 5,994; 20,102 | [File:Brownie (1).jpg](https://commons.wikimedia.org/wiki/File:Brownie_(1).jpg), Renee Comet (Photographer) | Public domain |
| `cafe-logo.svg` | Unused; removed from header and favicon at user request | SVG | viewBox 64×64 | 368 | Created in this task; no third-party graphic | CC0 1.0, explicitly recorded in `OWN_ASSET_LICENSE.txt` |
| `cart-icon.svg` | Decorative icon in View Cart button; `MenuPage.tsx` | SVG | viewBox 24×24; displayed 20×20 | 276 | Created in this task; no third-party graphic | CC0 1.0; `OWN_ASSET_LICENSE.txt` |
| `фотки/cheeseburger_hero (1).jpg` | Supplied material; not loaded by the app | JPG | 740×740 | 111,351 | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |
| `фотки/cheeseburger_hero (1).png` | Source for cheeseburger WebP variants | PNG | 740×740 | 328,756 | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |
| `фотки/cheeseburger_hero (1).webp` | Supplied material; not loaded by the app | WEBP | 740×740 | 70,744 | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |
| `фотки/order_alert.mp3` | Supplied material; not loaded by the app | MP3 | Not applicable (audio; not used) | 29,254 | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |
| `фотки/order_alert.wav` | Supplied material; not loaded by the app | WAV | Not applicable (audio; not used) | 399,284 | Supplied by the user | Author and external licence not provided; no ownership or free-licence claim |
| `added-feedback` | Text notification after Add to cart; `MenuPage.tsx`, `styles.css` | CSS keyframes | 240 ms; 4 px vertical movement | Included in CSS bundle | Original CSS written in this task | No third-party asset; supplied as project code, no separate pre-existing licence |
| `chrome_0S2jMh3xdw.png` (existing) | Root folder only; not referenced or served by the app | PNG | 1920×945 | 119,240 | Not documented in project | Not documented; not reused |

Sources and licences of the seven Commons photographs were read from the individual file pages and their imageinfo metadata. The cheeseburger was replaced with the PNG supplied by the user in `фотки`; no author or external licence was supplied, so none is claimed. JPG and WebP alternatives and two notification sound files were also supplied; the sounds are not connected to playback. “Public domain” is a copyright status, not a newly assigned licence. Exact usage terms, original dimensions, download URLs or local source paths, source hashes and output bytes are in `web/public/media/provenance.json`. Original Commons metadata and downloaded originals are in `comparison/media-originals/`; the earlier Commons cheeseburger remains archived but is no longer used. No source or licence was inferred from the food name or from a search thumbnail.

At the user's request, the MY CAFÉ header and browser favicon were restored to the original version. The added cup logo is unused. A small original SVG cart icon is used beside the View Cart button text instead. Its CC0 dedication is explicitly recorded in `web/public/media/OWN_ASSET_LICENSE.txt`. Source and licence links are available in `web/public/media/credits.html`.

### Media optimisation

- Photos: centre crop to 8:5, resize with Lanczos, WebP quality 76, method 6, no EXIF metadata. The downloaded originals are not in the production public folder.
- Every image has a 400×250 version. Large versions are 800×500 for seven stock photos and 740×462 for the supplied cheeseburger, preserving its source width without upscaling. Images use `srcSet`, `sizes`, fixed intrinsic dimensions, `decoding="async"`, and lazy loading except for the first card in the current results.
- The eight active source images (seven JPEGs and the supplied PNG) total **20,686,962 bytes**. The eight 400w files total **70,826 bytes**; the eight large variants total **185,660 bytes**; all 16 active WebP files total **256,486 bytes**. These are actual filesystem sizes, not browser transfer measurements. A browser normally chooses one variant per photo.
- Actual file validation is saved in `comparison/media-checks.json`: 16 WebP files match their recorded dimensions, bytes and source hashes; none is upscaled and none contains EXIF. Side-by-side visual review used `comparison/quality-source-vs-webp-1.png` and `comparison/quality-source-vs-webp-2.png`, plus the 360 px UI screenshots. At the intended card size (276 CSS px wide in a 360 px viewport), no obvious quality loss was seen. This is a visual assessment, not a numerical quality score or a speed measurement.
- SVG stays sharp at different screen densities. The CSS animation is a single 240 ms text entrance after an explicit button press; it uses no audio, GIF or video download. Reduced-motion users get static feedback.

Recreate the photo outputs with `python tools/prepare_media.py` (Python with Pillow 12.2.0). Existing archived sources are reused. `python tools/write_report.py` refreshes credits and this report from the saved manifest and test results.

## B2 — Before / After performance evidence

### Network measurements — reported After result; Before is still pending

The user reported this optimized production measurement: **6 requests, 147 KB transferred, Finish 768 ms, Load 479 ms**. These values were supplied by the user, not measured or independently verified by the assistant. The screenshot, capture date, exact URL/build, viewport, and cache/throttling settings for that run were not supplied. Preserve the displayed units; do not convert the report into an unsupported claim about this exact build.

**The original version has not yet been measured.** Its measurement cells are intentionally empty. Repeat both linked versions with identical settings below to obtain a controlled Before/After comparison. Build output, disk bytes and UI screenshots are not substitutions for Network measurements. No percentage improvement or completed comparative conclusion is claimed while Before is missing. The original page had no photos, so it may transfer fewer bytes or finish sooner than the media page; this comparison is not an isolated test of image compression alone.

| Evidence from Chrome Network | Before: port 4173 | After: port 4174 |
|---|---|---|
| Screenshot file |  | Not supplied for the reported run |
| Transferred |  | 147 KB |
| Requests |  | 6 |
| Finish |  | 768 ms |
| Load |  | 479 ms |
| DOMContentLoaded (optional) |  |  |
| Chrome version / machine |  |  |
| Viewport / DPR | Target for the new run: 360×800 / 1 | Not supplied for the reported run; repeat at 360×800 / 1 |
| Cache / throttling | Target: Disable cache / Fast 4G | Not confirmed for the reported run; repeat with Disable cache / Fast 4G |

### Production build preparation and launch

The original snapshot exists at `comparison/before/`. All **32** recorded original source/configuration files were checked against `comparison/before-source-manifest.json`; none differed. The original and current frontend lockfiles also match. Existing builds are in `comparison/before/web/dist/` and `web/dist/`.

Both preview servers are already running. A read-only HTTP check returned status 200 for both links and verified that the served HTML and referenced JS/CSS exactly match the files in the respective saved `dist` directories. A fresh isolated browser check showed the demo-mode message in both versions and no Vite development-client script. The baseline menu has no product images; the current Burgers menu has three.

**No application source, dependency, production-build file or baseline file was modified or deleted during this B2 preparation. Only this report was updated.** Use the existing builds for the requested comparison; rebuilding is unnecessary.

If the servers have been stopped, run these commands from `C:\cafebuisness` in two separate PowerShell terminals:

```powershell
# Terminal 1: original production build
node tools/serve-comparison.mjs before

# Terminal 2: media production build
node tools/serve-comparison.mjs after
```

Before: <http://127.0.0.1:4173>. After: <http://127.0.0.1:4174>.
Use `127.0.0.1` consistently for both, without switching one version to `localhost`.
The build script sets `VITE_API_URL` to the empty string at process level, overriding Vite env files. Both builds use the original seeded demo API and browser storage; PostgreSQL is not required. This avoids comparing API latency with demo latency. The source files `api.ts` and `store.tsx` have not been edited. The earlier development server at port 5173 is unsuitable for this production comparison.

The existing `tools/build-comparison.mjs` documents how the two production/demo builds were prepared previously. It was not run for this B2 step because it would rewrite build files. Do not install dependencies, run a build, or edit assets between the two measurements.

### Steps for two genuine screenshots

1. Open a fresh Chrome Incognito window, with extensions disabled. This gives clean storage without clearing the normal browser's orders. Use the same window and computer for both ports. Do not log in, add products or change the data before measuring.
2. Open DevTools and the Network panel. Select **All**, remove text filters, enable **Disable cache**, select **Fast 4G**, and disable **Preserve log**. Disable cache works while DevTools is open.
3. In device emulation, set a responsive viewport of **360×800 CSS px** and **DPR 1**. Use the same browser zoom and DevTools layout for both. Keep the menu at the top with the default **Burgers** category and no search text.
4. Visit `http://127.0.0.1:4173`. Clear the Network log, then reload with DevTools open. Do not scroll or interact. Wait until the initial requests have completed; capture the request list and bottom summary showing Requests, Transferred, Finish and Load. Include the cache and throttle controls in the screenshot when possible. Record the displayed units exactly.
5. Repeat the same procedure at `http://127.0.0.1:4174`. Lazy loading makes viewport and scrolling relevant, so keep them identical. Save the two real screenshots in `comparison/` and fill in the table. If this new After result differs from the user-reported run, retain the old values as a separately labelled run and use the new matched-settings result for the comparison.
6. If all summary timings are not visible in one screenshot, widen DevTools or capture an extra view. Do not replace missing values with estimates. Compare the results honestly, even if the media version is larger or slower. An optional second test can scroll through all categories, but that must be reported separately from initial page load.

### Actual disk evidence, separate from Network results

The following HTML/JS/CSS file sizes were read from the production builds on disk. Public media and credits are accounted for separately above. Compression, HTTP headers, cache and browser requests affect Network transfer totals.

| Build | Actual output file sizes |
|---|---|
| Before | `assets/index-CIdEqrVD.css`: 4,233 B + `assets/index-CM_UxHwV.js`: 158,638 B + `index.html`: 368 B |
| After | `assets/index-BHJpzhrD.css`: 5,171 B + `assets/index-piOU8Pge.js`: 160,439 B + `index.html`: 368 B |

## B3 — Accessibility implementation and evidence

The focused B3 audit is documented in `B3_ACCESSIBILITY.md`, with PASS / FAIL / NOT APPLICABLE decisions, exact file/line references, and evidence from all audited screens. It also records the contrast fixes for inactive product cards and the cart summary.

### Meaningful photos, decorative cart icon and accessible controls

`web/src/media.tsx` contains descriptive `alt` text for each photo. For example:

```tsx
  americano: { slug: 'americano', alt: 'Example black coffee in a white cup' },
```

The actual image markup is:

```tsx
      <img
        src={`/media/${photo.slug}-${width}.webp`}
        srcSet={`/media/${photo.slug}-400.webp 400w, /media/${photo.slug}-${width}.webp ${width}w`}
        sizes="(max-width: 400px) calc(100vw - 84px), (max-width: 520px) calc(100vw - 92px), 428px"
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        alt={photo.alt}
      />
```

`web/src/pages/MenuPage.tsx` uses a decorative cart icon inside the visibly named View Cart button. `App.tsx` has the original text-only MY CAFÉ header:

```tsx
<img className="cart-icon" src="/media/cart-icon.svg" width={20} height={20} alt="" />
```

The empty `alt` keeps the decorative cart icon silent. Native buttons retain visible text. `MenuPage.tsx` keeps ``aria-label={`Add ${p.name} to cart`}``; `CartPage.tsx` keeps `aria-label="Decrease quantity"` and `aria-label="Increase quantity"` on its − and + controls. These are accessible names for the symbol buttons. No unnamed interactive SVG icon was added. The page has a `main` landmark and visible keyboard focus styles.

### Visual feedback, motion and sound

`web/src/pages/MenuPage.tsx` keeps a persistent live region:

```tsx
<p className="added-message" role="status" aria-live="polite" aria-atomic="true"><span key={notice.sequence}>{notice.text}</span></p>
```

After adding a product it displays and announces “[product name] added to cart.” The cart count and total also update. It does not rely on sound or colour alone. Two audio files were supplied in the local materials folder but are not loaded or played by the app. There are no audio/video elements, speech playback, Web Audio calls or autoplay attributes in either version. Subtitles and transcripts are therefore not applicable. No sound is played automatically or on a timer.

The actual CSS from `web/src/styles.css` is:

```css
.added-message span{display:inline-block;animation:added-feedback 240ms ease-out both}
@keyframes added-feedback{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@media(prefers-reduced-motion:reduce){.added-message span{animation:none}}
```

### 360 px layout

Images use `display:block; width:100%; height:auto; aspect-ratio:8/5`. The viewport meta tag is present in `web/index.html`. Navigation wraps to additional rows; narrow-screen rows can wrap; cards allow long text to break. Buttons retain their original minimum heights of 44–48 px. The menu, cart, customer orders and staff views were checked at 360 px; see actual check results below. No data model or persistence change was needed for these layout changes.

### Contrast

No interface text is placed over photographs. Captions, product names, prices and buttons sit on opaque CSS surfaces. There is therefore no variable image background behind the readable UI text. Text visible inside a source photograph (for example a bottle label) is not used to provide essential menu information. The menu provides that information separately as text.

The muted text colour was darkened from `#667487` to `#526174`. Ratios below are calculated from the actual CSS sRGB hex values using the WCAG relative-luminance formula `(Llighter + 0.05) / (Ldarker + 0.05)`. These are calculations, not invented performance measurements. All listed text pairs exceed **4.5:1**.

| Text / surface | Foreground | Background | Calculated contrast |
|---|---|---|---:|
| Normal text / card | `#17202b` | `#ffffff` | 16.43:1 |
| Secondary text and photo captions / card | `#526174` | `#ffffff` | 6.32:1 |
| Secondary text / panel | `#526174` | `#e8eff6` | 5.45:1 |
| Secondary text / page | `#526174` | `#eef3f8` | 5.66:1 |
| White button text / brand | `#ffffff` | `#14466e` | 9.85:1 |
| Category Burgers | `#ffffff` | `#a8452a` | 5.92:1 |
| Category Drinks | `#ffffff` | `#1f6f6b` | 5.92:1 |
| Category Desserts | `#ffffff` | `#7a4b8a` | 6.56:1 |
| Feedback text / panel | `#14466e` | `#e8eff6` | 8.50:1 |

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

Actual automated run: Chrome 155.0.8059.86; production demo builds; isolated browser contexts; 360×800 CSS px, DPR 1, plus a DPR 2 image-selection check.

- Baseline production menu opens in demo mode without image assets.
- Burgers: no document overflow at 360 px.
- axe WCAG A/AA scan: Burgers, zero detected violations.
- Drinks: no document overflow at 360 px.
- axe WCAG A/AA scan: Drinks, zero detected violations.
- Desserts: no document overflow at 360 px.
- axe WCAG A/AA scan: Desserts, zero detected violations.
- Eight WebP photos decode; correct 400w selection at 360 px / DPR 1; descriptive alt; original text brand restored; no audio/video.
- Cart: no document overflow at 360 px.
- axe WCAG A/AA scan: Cart, zero detected violations.
- Search, empty search, repeated add, quantities, remove, totals, checkout, cart clearing, and order persistence after reload.
- Customer orders: no document overflow at 360 px.
- axe WCAG A/AA scan: Customer orders, zero detected violations.
- Staff orders: no document overflow at 360 px.
- axe WCAG A/AA scan: Staff orders, zero detected violations.
- Staff demo login and New → Preparing → Ready → Completed; customer sees updated status.
- Manage menu: no document overflow at 360 px.
- axe WCAG A/AA scan: Manage menu, zero detected violations.
- Menu edit, disable/enable, custom product fallback, and checkout for a newly created product.
- CSS feedback animation exists and is disabled by reduced-motion preference.
- 740w user photo selection at DPR 2 without upscaling and keyboard Tab/Enter navigation.
- API, storage, product/order types, checkout, and staff/order page source files are byte-identical to baseline.
- No uncaught page errors or HTTP responses >= 400 during the checked flows.
- Image credits: no document overflow at 360 px.
- axe WCAG A/AA scan: Image credits, zero detected violations.
- Local credits page opens, lists all eight photo sources, and fits 360 px.

Detailed results: `comparison/verification.json`. UI screenshots: `comparison/qa-before-360.png`, `comparison/qa-after-360.png`. These are layout screenshots, not DevTools Network evidence. Automated scans do not prove full accessibility compliance.

### Remaining student actions

- Capture the two matched-settings Chrome DevTools Network screenshots and fill B2 with the displayed values. Keep the user-reported After run clearly attributed. Do not claim a comparative improvement until the real Before result is available.
- Review the 360 px UI yourself, including keyboard focus and a screen-reader spot check. Automated scans cover only part of accessibility.
- If actual café photography is required by the marking rubric, replace the clearly labelled example photos with photographs you own or have permission to use, then rerun the build, checks and measurements.
