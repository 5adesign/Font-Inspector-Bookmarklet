# 🔍 Font Inspector

A lightweight, zero-dependency bookmarklet to inspect typography and layout properties on any webpage.

Hover over any element to see its font, color, layout, and box-model details in a floating tooltip. Click to copy ready-to-paste CSS declarations. Click the bookmarklet again to deactivate.

---

## Features

| Feature | Details |
|---|---|
| **Typography** | `font-size` (px + rem), `line-height` (px + unitless ratio), `font-weight`, `font-family` |
| **Color** | Hex value (falls back to `rgba` when alpha < 1) |
| **Layout** | Display type (flex/grid), column count, gap |
| **Box Model** | Margin, padding (CSS shorthand), element dimensions (w×h) |
| **Click to Copy** | Copies clean CSS declarations ready to paste |
| **Stretched Link Bypass** | Detects and neutralizes `::after`/`::before` stretched links and `position:absolute` overlays |
| **Toggle On/Off** | Click the bookmarklet again to deactivate |

---

## Tooltip Color Legend

| Color | Property |
|---|---|
| 🔴 `#e94560` | `font-size`, `font-weight` |
| 🔵 `#53d8fb` | rem conversion |
| 🟢 `#0ead69` | line-height ratio |
| 🟠 `#ffbd69` | text color |
| 🟣 `#c0a0ff` | margin, padding, dimensions |
| ⚫ `#888` | secondary labels |
| ⚫ `#555` | hint text |

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

1. Copy the minified code below.
2. In your browser, create a new bookmark (right-click bookmarks bar → *Add bookmark*).
3. Set the **Name** to `Font Inspector`.
4. Paste the code as the **URL**.
5. Save.

```
javascript:void(function(){if(document.getElementById('fi-style')){document.getElementById('fi-style').remove();document.getElementById('fi-tooltip').remove();document.removeEventListener('mouseover',window._fiOver);document.removeEventListener('mouseout',window._fiOut);document.removeEventListener('click',window._fiClick,true);delete window._fiOver;delete window._fiOut;delete window._fiClick;delete window._fiEl;return}function n(v,d){return parseFloat(v).toFixed(d).replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'')}function hex(c){var m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);if(!m)return c;if(m[4]!==undefined&&parseFloat(m[4])<1)return c;return'#'+((1<<24)+(+m[1]<<16)+(+m[2]<<8)+ +m[3]).toString(16).slice(1)}function sh(v){var a=v.map(function(x){return parseFloat(x)===0?'0':x});if(a[0]===a[1]&&a[1]===a[2]&&a[2]===a[3])return a[0];if(a[0]===a[2]&&a[1]===a[3])return a[0]+' '+a[1];if(a[1]===a[3])return a[0]+' '+a[1]+' '+a[2];return a.join(' ')}function layout(cs){var d=cs.display;if(d.indexOf('flex')<0&&d.indexOf('grid')<0)return'';var p=[d];if(d.indexOf('grid')>=0){var c=cs.gridTemplateColumns;if(c&&c!=='none'){var cols=c.trim().split(/\s+/).length;p.push(cols+' cols')}}var g=cs.gap;if(g&&g!=='normal'&&g!=='0px'){p.push('gap: '+g)}return'<div class="sub">'+p.join(' \u00b7 ')+'</div>'}function boxline(cs,el){var m=[cs.marginTop,cs.marginRight,cs.marginBottom,cs.marginLeft];var p=[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft];var hasM=m.some(function(v){return parseFloat(v)!==0});var hasP=p.some(function(v){return parseFloat(v)!==0});var r=el.getBoundingClientRect();var parts=[];if(hasM)parts.push('margin: <b>'+sh(m)+'</b>');if(hasP)parts.push('padding: <b>'+sh(p)+'</b>');parts.push('<b>'+Math.round(r.width)+'\u00d7'+Math.round(r.height)+'</b>');return'<div class="sub">'+parts.join(' \u00b7 ')+'</div>'}function bypassStretched(){document.querySelectorAll('a').forEach(function(a){var ps=['::after','::before'];ps.forEach(function(pseudo){var s=getComputedStyle(a,pseudo);if(s.position==='absolute'&&s.content&&s.content!=='none'&&s.content!=='normal'){a.classList.add('fi-bypass')}});var cs=getComputedStyle(a);if(cs.position==='absolute'){var r=a.getBoundingClientRect();var pr=a.parentElement.getBoundingClientRect();if(Math.abs(r.width-pr.width)<5&&Math.abs(r.height-pr.height)<5){a.classList.add('fi-bypass')}}})}var s=document.createElement('style');s.id='fi-style';s.textContent='#fi-tooltip{position:fixed;z-index:999999;background:#1a1a2e;color:#fff;font:13px/1.4 monospace;padding:8px 12px;border-radius:4px;pointer-events:none;display:none;max-width:520px;box-shadow:0 2px 8px rgba(0,0,0,.3)}#fi-tooltip b{color:#e94560}#fi-tooltip span.rem{color:#53d8fb}#fi-tooltip span.ratio{color:#0ead69}#fi-tooltip span.hex{color:#ffbd69}#fi-tooltip .sub{margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,.12);font-size:11px;color:#888;line-height:1.3}#fi-tooltip .sub b{color:#c0a0ff;font-weight:400}#fi-tooltip .sub+.sub{border-top:none;margin-top:1px;padding-top:0}#fi-tooltip .hint{margin-top:4px;font-size:11px;color:#555;font-style:italic}.fi-outline{outline:2px solid #e94560!important;outline-offset:-1px}.fi-bypass{pointer-events:none!important}';document.head.appendChild(s);bypassStretched();var t=document.createElement('div');t.id='fi-tooltip';document.body.appendChild(t);window._fiEl=null;var root=parseFloat(getComputedStyle(document.documentElement).fontSize);window._fiOver=function(e){var el=e.target;if(el.id==='fi-tooltip'||el.closest('#fi-tooltip'))return;if(window._fiEl)window._fiEl.classList.remove('fi-outline');el.classList.add('fi-outline');window._fiEl=el;var cs=getComputedStyle(el);var fs=parseFloat(cs.fontSize);var lh=cs.lineHeight;var fw=cs.fontWeight;var ff=cs.fontFamily.split(',')[0].replace(/['"]/g,'');var ls=cs.letterSpacing;var col=hex(cs.color);var rem=n(fs/root,3);var lhInfo='normal';if(lh!=='normal'){var ratio=n(parseFloat(lh)/fs,3);lhInfo=lh+' <span class="ratio">('+ratio+')</span>'}t.innerHTML='<b>'+cs.fontSize+'</b> <span class="rem">('+rem+'rem)</span> / '+lhInfo+' \u00b7 <b>'+fw+'</b> \u00b7 '+ff+(ls!=='normal'?' \u00b7 ls:'+ls:'')+' \u00b7 <span class="hex">'+col+'</span>'+layout(cs)+boxline(cs,el)+'<div class="hint">click per copiare</div>';t.style.display='block';t.style.left=Math.min(e.clientX+12,innerWidth-t.offsetWidth-8)+'px';t.style.top=(e.clientY>innerHeight-80?e.clientY-t.offsetHeight-8:e.clientY+16)+'px'};window._fiOut=function(e){if(e.relatedTarget&&e.relatedTarget.id==='fi-tooltip')return;if(window._fiEl)window._fiEl.classList.remove('fi-outline');t.style.display='none';window._fiEl=null};window._fiClick=function(e){if(!window._fiEl)return;e.preventDefault();e.stopPropagation();var cs=getComputedStyle(window._fiEl);var fs=parseFloat(cs.fontSize);var lh=cs.lineHeight;var lines=[];lines.push('font-size: '+n(fs/root,3)+'rem;');if(lh!=='normal')lines.push('line-height: '+n(parseFloat(lh)/fs,3)+';');lines.push('font-weight: '+cs.fontWeight+';');lines.push('font-family: "'+cs.fontFamily.split(',')[0].replace(/['"]/g,'')+'";');if(cs.letterSpacing!=='normal')lines.push('letter-spacing: '+cs.letterSpacing+';');lines.push('color: '+hex(cs.color)+';');navigator.clipboard.writeText(lines.join('\n')).then(function(){t.innerHTML='<b style="color:#0ead69">\u2713 Copiato!</b>';setTimeout(function(){t.style.display='none'},800)})};document.addEventListener('mouseover',window._fiOver);document.addEventListener('mouseout',window._fiOut);document.addEventListener('click',window._fiClick,true)}())
```

---

## Usage

1. Navigate to any webpage.
2. Click the **Font Inspector** bookmark to activate.
3. Hover over any element — a tooltip appears showing its typography and layout details.
4. Click the element to copy its CSS declarations to the clipboard.
5. Click the **Font Inspector** bookmark again to deactivate.

---

## What Gets Copied

Clicking an element copies clean, paste-ready CSS:

```css
font-size: 3.563rem;
line-height: 1;
font-weight: 700;
font-family: "Instrument Sans Condensed";
letter-spacing: -1.14px;
color: #e94560;
```

### Tooltip Output Example

```
57px (3.563rem) / 57px (1) · 700 · Instrument Sans Condensed · ls:-1.14px · #e94560
────────────────────────────────────────────────────────────────
flex · gap: 24px
────────────────────────────────────────────────────────────────
margin: 0 16px · padding: 8px 12px · 912×57
────────────────────────────────────────────────────────────────
click per copiare
```

---

## How It Works

### Tooltip

On activation the bookmarklet injects a `<style>` tag (`#fi-style`) and a `<div>` (`#fi-tooltip`) into the page. On every `mouseover` event it calls `getComputedStyle()` on the target element, formats the values, and renders them as HTML inside the tooltip, which is positioned near the cursor.

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

### CSS Shorthand

Four-value box arrays are collapsed using standard CSS shorthand rules:

| Input | Output |
|---|---|
| `8px 8px 8px 8px` | `8px` |
| `8px 16px 8px 16px` | `8px 16px` |
| `8px 16px 4px 16px` | `8px 16px 4px` |
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

---

## License

MIT — Use it, modify it, share it.
