# 🔍 Font Inspector

A lightweight, zero-dependency bookmarklet to inspect typography and layout properties on any webpage.

Hover over any element to see its font, color, layout, box-model, and text count details in a floating tooltip. Click to copy ready-to-paste CSS declarations, select text to get counts, and press `Esc` to exit quickly.

Source lives in `src/font-inspector.js`. The distributable files `bookmarklet.min.js`, `font-inspector.runtime.js`, and `bookmarklet.loader.js` are generated automatically.

---

## Features

| Feature                   | Details                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Typography**            | `font-size` (px + rem), `line-height` (px + unitless ratio), `font-weight`, `font-family`     |
| **Color**                 | Hex value (falls back to `rgba` when alpha < 1) with muted `color:` label                     |
| **Layout**                | Display type (flex/grid), column count, gap                                                   |
| **Box Model**             | Margin, padding (CSS shorthand), element dimensions (w×h)                                     |
| **Text Count**            | Characters, characters without spaces, and word count for hovered elements or selected text   |
| **Click to Copy**         | Copies clean CSS declarations ready to paste                                                  |
| **Selection Count**       | Mouse selection opens a dedicated count tooltip with excerpt preview                          |
| **Quick Exit**            | Press `Esc` or click the bookmarklet again to deactivate                                      |
| **Stretched Link Bypass** | Detects and neutralizes `::after`/`::before` stretched links and `position:absolute` overlays |
| **Toggle On/Off**         | Click the bookmarklet again to deactivate                                                     |

---

## Tooltip Color Legend

| Color          | Property                         |
| -------------- | -------------------------------- |
| 🔴 `#e94560`   | primary numeric values           |
| 🔵 `#53d8fb`   | rem conversion                   |
| 🟢 `#0ead69`   | line-height ratio                |
| 🟠 `#ffbd69`   | color value                      |
| 🟣 `#c0a0ff`   | margin, padding, dimensions      |
| ⚫ muted grays | secondary labels and helper text |

---

## Installation

### Method 1 — Drag & Drop

1. Show your browser's bookmarks bar (`Ctrl+Shift+B` / `Cmd+Shift+B`).
2. Open [`bookmarklet.min.js`](bookmarklet.min.js) in this repository and copy the full single-line content.
3. Right-click your bookmarks bar → **Add page** / **Add bookmark**.
4. Set the **Name** to `Font Inspector` (or anything you like).
5. Paste the copied code as the **URL**.
6. Save.

### Method 2 — Manual

1. Open [`bookmarklet.min.js`](bookmarklet.min.js).
2. In your browser, create a new bookmark (right-click bookmarks bar → _Add bookmark_).
3. Set the **Name** to `Font Inspector`.
4. Paste the file content as the **URL**.
5. Save.

### Method 3 — Safari-Safe Loader

Use this if Safari truncates or refuses the full bookmarklet URL.

1. Open [`bookmarklet.loader.js`](bookmarklet.loader.js).
2. Create a new bookmark in Safari.
3. Set the **Name** to `Font Inspector`.
4. Paste the loader content as the **URL**.
5. Save.

The loader is very short and fetches [`font-inspector.runtime.js`](font-inspector.runtime.js) from jsDelivr, using this public GitHub repo as the source.

---

## Development

1. Install dependencies with `pnpm install`.
2. Run `pnpm build` to generate [`bookmarklet.min.js`](bookmarklet.min.js), [`font-inspector.runtime.js`](font-inspector.runtime.js), and [`bookmarklet.loader.js`](bookmarklet.loader.js).
3. Run `pnpm dev` to rebuild automatically whenever [`src/font-inspector.js`](src/font-inspector.js) is saved.

The build pipeline wraps the source as a bookmarklet and minifies it with `terser`, so you only need to edit the readable source file.

Scripts available:

- `pnpm build` / `npm run build` — one-off build
- `pnpm dev` / `npm run dev` — rebuild on save

---

## Usage

1. Navigate to any webpage.
2. Click the **Font Inspector** bookmark to activate.
3. Hover over any element — a tooltip appears showing its typography, layout, box-model, and text count details.
4. Click the element to copy its CSS declarations to the clipboard.
5. Select text to see a dedicated character / word count tooltip.
6. Press `Esc` or click the **Font Inspector** bookmark again to deactivate.

---

## What Gets Copied

Clicking an element copies clean, paste-ready CSS:

```css
font-size: 3.563rem;
line-height: 1;
font-weight: 700;
font-family: 'Instrument Sans Condensed';
letter-spacing: -1.14px;
color: #e94560;
```

### Tooltip Output Example

```
57px (3.563rem) / 57px (1) · 700 · Instrument Sans Condensed
letter-spacing: -.02em (-1.14px) · color: #e94560
────────────────────────────────────────────────────────────────
flex · gap: 24px
────────────────────────────────────────────────────────────────
margin: 0 16px · padding: 8px 12px · 912×57
────────────────────────────────────────────────────────────────
124 caratteri · 103 senza spazi · 21 parole
────────────────────────────────────────────────────────────────
Click per copiare le regole CSS · Seleziona il testo per il conteggio battute
```

---

## How It Works

### Tooltip

On activation the bookmarklet injects a `<style>` tag (`#fi-style`) and a `<div>` (`#fi-tooltip`) into the page. On every `mouseover` event it calls `getComputedStyle()` on the target element, formats the values into an editorial-style tooltip, and positions it near the cursor.

### Text Count

For hovered elements, the tooltip also shows character count, character count without spaces, and word count based on the element's visible text. On `mouseup`, any active text selection is counted separately and shown in its own tooltip with a short excerpt preview.

### Stretched Link Detection

On activation `bypassStretched()` scans every `<a>` element and looks for two patterns:

1. A `::after` or `::before` pseudo-element with `position:absolute` and non-empty `content` (classic Bootstrap stretched-link pattern).
2. The anchor itself having `position:absolute` and bounding-box dimensions within 5 px of its parent (full-cover overlay pattern).

Matching anchors receive the class `fi-bypass`, which applies `pointer-events:none` so they no longer intercept hover events.

### Rem Calculation

The root `<html>` font-size is read once on activation with `getComputedStyle(document.documentElement).fontSize`. Every `font-size` value is divided by this root size. Trailing zeros are stripped so `1.000` → `1` and `1.250` → `1.25`.

### Line-Height Ratio

`line-height (px) ÷ font-size (px)` produces the unitless CSS value (e.g. `57px ÷ 57px = 1`).

### Color Conversion

`rgb(r, g, b)` values are converted to hex. When alpha is present and less than 1 the original `rgba()` string is preserved.

### Letter-Spacing Display

The tooltip first tries to recover the declared `letter-spacing` value from inline styles or accessible stylesheets. When it can, it shows that source value and adds the computed pixel value in parentheses, for example `-.02em (-1.14px)`.

If the declared value cannot be recovered, the tooltip falls back to the computed value reported by the browser, which is usually in `px`.

### CSS Shorthand

Four-value box arrays are collapsed using standard CSS shorthand rules:

| Input               | Output              |
| ------------------- | ------------------- |
| `8px 8px 8px 8px`   | `8px`               |
| `8px 16px 8px 16px` | `8px 16px`          |
| `8px 16px 4px 16px` | `8px 16px 4px`      |
| `8px 16px 4px 12px` | `8px 16px 4px 12px` |

---

## Compatibility

- ✅ Chrome, Edge, Firefox, Safari (modern)
- ✅ SPAs (React, Vue, etc.)
- ✅ CSS-in-JS, Tailwind, Bootstrap
- ⚠️ Limited on aggressive stacking contexts (e.g. YouTube)
- ⚠️ Cannot inspect Shadow DOM
- ⚠️ `navigator.clipboard` requires HTTPS or localhost

---

## Known Limitations

- **YouTube-like web apps** with extreme z-index layering may block the tooltip.
- **Shadow DOM** elements are unreachable by `getComputedStyle` from the main document context.
- **Clipboard API** requires a secure context (HTTPS). On plain HTTP pages the copy action will silently fail.
- **Dynamic content**: stretched link detection runs once on activation and will not catch elements injected after that point.
- **Keyboard shortcut scope**: `Esc` is listened to while the bookmarklet is active, so pressing it will always close the inspector first.
- **Cross-origin stylesheets**: some external CSS rules cannot be inspected by the browser, so `letter-spacing` may fall back to the computed `px` value.
- **Safari bookmarklet length**: Safari may truncate very long bookmarklet URLs. In that case, use [`bookmarklet.loader.js`](bookmarklet.loader.js) instead of the full [`bookmarklet.min.js`](bookmarklet.min.js).

---

## License

MIT — Use it, modify it, share it.
