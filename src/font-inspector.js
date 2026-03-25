/**
 * Font Inspector Bookmarklet
 *
 * A lightweight, zero-dependency bookmarklet that inspects typography and
 * layout CSS properties on any webpage. Hover to inspect, click to copy
 * ready-to-use CSS declarations.
 *
 * Usage: wrap this file's content in `javascript:void(function(){ ... }())`
 * and save as a browser bookmark URL (see README.md for instructions).
 */

// =============================================================================
// Toggle Off
// =============================================================================

// If the bookmarklet is already active, remove all injected elements and
// listeners, then exit — toggling the inspector off.
if (document.getElementById('fi-style')) {
  document.getElementById('fi-style').remove();
  document.getElementById('fi-tooltip').remove();
  document.removeEventListener('mouseover', window._fiOver);
  document.removeEventListener('mouseout', window._fiOut);
  document.removeEventListener('click', window._fiClick, true);
  delete window._fiOver;
  delete window._fiOut;
  delete window._fiClick;
  delete window._fiEl;
  return;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Formats a numeric CSS value to `d` decimal places, stripping trailing zeros.
 * Examples: n(16, 3) → "16", n(14.4, 3) → "14.4", n(1.250, 3) → "1.25"
 *
 * @param {string|number} v - The value to format.
 * @param {number} d - Number of decimal places.
 * @returns {string} Formatted number string.
 */
function n(v, d) {
  return parseFloat(v)
    .toFixed(d)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
}

/**
 * Converts an rgb() or rgba() color string to a hex color code.
 * Preserves the original rgba() string when alpha is less than 1.
 *
 * @param {string} c - A CSS color value (e.g. "rgb(255, 0, 0)").
 * @returns {string} Hex color (e.g. "#ff0000") or original string if non-opaque.
 */
function hex(c) {
  var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return c;
  if (m[4] !== undefined && parseFloat(m[4]) < 1) return c;
  return '#' + ((1 << 24) + (+m[1] << 16) + (+m[2] << 8) + +m[3])
    .toString(16)
    .slice(1);
}

/**
 * Collapses an array of four CSS box values (top, right, bottom, left) into
 * CSS shorthand notation, removing redundant values.
 * Examples: ["8px","8px","8px","8px"] → "8px"
 *           ["8px","16px","8px","16px"] → "8px 16px"
 *           ["8px","16px","4px","16px"] → "8px 16px 4px"
 *           ["8px","16px","4px","12px"] → "8px 16px 4px 12px"
 *
 * @param {string[]} v - Array of four CSS length strings.
 * @returns {string} Shorthand CSS value.
 */
function sh(v) {
  var a = v.map(function (x) {
    return parseFloat(x) === 0 ? '0' : x;
  });
  if (a[0] === a[1] && a[1] === a[2] && a[2] === a[3]) return a[0];
  if (a[0] === a[2] && a[1] === a[3]) return a[0] + ' ' + a[1];
  if (a[1] === a[3]) return a[0] + ' ' + a[1] + ' ' + a[2];
  return a.join(' ');
}

/**
 * Builds an HTML sub-line showing flex/grid layout information for an element.
 * Returns an empty string if the element is not a flex or grid container.
 *
 * @param {CSSStyleDeclaration} cs - The computed style of the element.
 * @returns {string} HTML string with layout info, or "" if not flex/grid.
 */
function layout(cs) {
  var d = cs.display;
  if (d.indexOf('flex') < 0 && d.indexOf('grid') < 0) return '';

  var p = [d];

  if (d.indexOf('grid') >= 0) {
    var c = cs.gridTemplateColumns;
    if (c && c !== 'none') {
      var cols = c.trim().split(/\s+/).length;
      p.push(cols + ' cols');
    }
  }

  var g = cs.gap;
  if (g && g !== 'normal' && g !== '0px') {
    p.push('gap: ' + g);
  }

  return '<div class="sub">' + p.join(' \u00b7 ') + '</div>';
}

/**
 * Builds an HTML sub-line showing the box model (margin, padding, dimensions)
 * for an element. Margins and paddings are only shown when non-zero.
 *
 * @param {CSSStyleDeclaration} cs - The computed style of the element.
 * @param {Element} el - The DOM element (used to read getBoundingClientRect).
 * @returns {string} HTML string with box model info.
 */
function boxline(cs, el) {
  var m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft];
  var p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft];
  var hasM = m.some(function (v) { return parseFloat(v) !== 0; });
  var hasP = p.some(function (v) { return parseFloat(v) !== 0; });
  var r = el.getBoundingClientRect();
  var parts = [];
  if (hasM) parts.push('margin: <b>' + sh(m) + '</b>');
  if (hasP) parts.push('padding: <b>' + sh(p) + '</b>');
  parts.push('<b>' + Math.round(r.width) + '\u00d7' + Math.round(r.height) + '</b>');
  return '<div class="sub">' + parts.join(' \u00b7 ') + '</div>';
}

// =============================================================================
// Stretched Link Bypass
// =============================================================================

/**
 * Scans all <a> elements for stretched-link patterns that would intercept
 * mouseover events and block inspection of underlying elements.
 *
 * Two patterns are detected:
 *  1. Anchors with a ::after or ::before pseudo-element that has
 *     position:absolute and non-empty content (classic Bootstrap stretched link).
 *  2. Anchors that are themselves position:absolute and fill their parent
 *     element within a 5 px tolerance.
 *
 * Detected anchors receive the class `fi-bypass`, which sets
 * pointer-events:none so they no longer intercept hover events.
 */
function bypassStretched() {
  document.querySelectorAll('a').forEach(function (a) {
    // Check pseudo-elements for stretched-link pattern
    var ps = ['::after', '::before'];
    ps.forEach(function (pseudo) {
      var s = getComputedStyle(a, pseudo);
      if (
        s.position === 'absolute' &&
        s.content &&
        s.content !== 'none' &&
        s.content !== 'normal'
      ) {
        a.classList.add('fi-bypass');
      }
    });

    // Check if the anchor itself is an absolute overlay covering its parent
    var cs = getComputedStyle(a);
    if (cs.position === 'absolute') {
      var r = a.getBoundingClientRect();
      var pr = a.parentElement.getBoundingClientRect();
      if (
        Math.abs(r.width - pr.width) < 5 &&
        Math.abs(r.height - pr.height) < 5
      ) {
        a.classList.add('fi-bypass');
      }
    }
  });
}

// =============================================================================
// Styles
// =============================================================================

var s = document.createElement('style');
s.id = 'fi-style';
s.textContent =
  '#fi-tooltip{position:fixed;z-index:999999;background:#1a1a2e;color:#fff;font:13px/1.4 monospace;padding:8px 12px;border-radius:4px;pointer-events:none;display:none;max-width:520px;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
  '#fi-tooltip b{color:#e94560}' +
  '#fi-tooltip span.rem{color:#53d8fb}' +
  '#fi-tooltip span.ratio{color:#0ead69}' +
  '#fi-tooltip span.hex{color:#ffbd69}' +
  '#fi-tooltip .sub{margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,.12);font-size:11px;color:#888;line-height:1.3}' +
  '#fi-tooltip .sub b{color:#c0a0ff;font-weight:400}' +
  '#fi-tooltip .sub+.sub{border-top:none;margin-top:1px;padding-top:0}' +
  '#fi-tooltip .hint{margin-top:4px;font-size:11px;color:#555;font-style:italic}' +
  '.fi-outline{outline:2px solid #e94560!important;outline-offset:-1px}' +
  '.fi-bypass{pointer-events:none!important}';
document.head.appendChild(s);

bypassStretched();

// =============================================================================
// Tooltip Element
// =============================================================================

var t = document.createElement('div');
t.id = 'fi-tooltip';
document.body.appendChild(t);

/** @type {Element|null} Currently highlighted element. */
window._fiEl = null;

/** Root font-size in px, used for rem calculations. */
var root = parseFloat(getComputedStyle(document.documentElement).fontSize);

// =============================================================================
// Mouseover Handler
// =============================================================================

/**
 * Handles mouseover events. Highlights the hovered element with an outline
 * and populates the tooltip with its typography, color, layout, and box-model
 * information.
 *
 * @param {MouseEvent} e
 */
window._fiOver = function (e) {
  var el = e.target;

  // Ignore the tooltip itself
  if (el.id === 'fi-tooltip' || el.closest('#fi-tooltip')) return;

  // Move outline to the new element
  if (window._fiEl) window._fiEl.classList.remove('fi-outline');
  el.classList.add('fi-outline');
  window._fiEl = el;

  var cs = getComputedStyle(el);
  var fs = parseFloat(cs.fontSize);
  var lh = cs.lineHeight;
  var fw = cs.fontWeight;
  var ff = cs.fontFamily.split(',')[0].replace(/['"]/g, '');
  var ls = cs.letterSpacing;
  var col = hex(cs.color);
  var rem = n(fs / root, 3);

  var lhInfo = 'normal';
  if (lh !== 'normal') {
    var ratio = n(parseFloat(lh) / fs, 3);
    lhInfo = lh + ' <span class="ratio">(' + ratio + ')</span>';
  }

  t.innerHTML =
    '<b>' + cs.fontSize + '</b> <span class="rem">(' + rem + 'rem)</span> / ' +
    lhInfo + ' \u00b7 <b>' + fw + '</b> \u00b7 ' + ff +
    (ls !== 'normal' ? ' \u00b7 ls:' + ls : '') +
    ' \u00b7 <span class="hex">' + col + '</span>' +
    layout(cs) +
    boxline(cs, el) +
    '<div class="hint">click per copiare</div>';

  t.style.display = 'block';
  t.style.left = Math.min(e.clientX + 12, innerWidth - t.offsetWidth - 8) + 'px';
  t.style.top = (
    e.clientY > innerHeight - 80
      ? e.clientY - t.offsetHeight - 8
      : e.clientY + 16
  ) + 'px';
};

// =============================================================================
// Mouseout Handler
// =============================================================================

/**
 * Handles mouseout events. Removes the outline from the previously highlighted
 * element and hides the tooltip.
 *
 * @param {MouseEvent} e
 */
window._fiOut = function (e) {
  if (e.relatedTarget && e.relatedTarget.id === 'fi-tooltip') return;
  if (window._fiEl) window._fiEl.classList.remove('fi-outline');
  t.style.display = 'none';
  window._fiEl = null;
};

// =============================================================================
// Click to Copy Handler
// =============================================================================

/**
 * Handles click events (captured in the capture phase so it fires before
 * the page's own handlers). Copies clean CSS declarations for the currently
 * inspected element to the clipboard.
 *
 * Properties copied: font-size (rem), line-height (unitless ratio),
 * font-weight, font-family, letter-spacing (if set), color (hex).
 *
 * @param {MouseEvent} e
 */
window._fiClick = function (e) {
  if (!window._fiEl) return;
  e.preventDefault();
  e.stopPropagation();

  var cs = getComputedStyle(window._fiEl);
  var fs = parseFloat(cs.fontSize);
  var lh = cs.lineHeight;
  var lines = [];

  lines.push('font-size: ' + n(fs / root, 3) + 'rem;');
  if (lh !== 'normal') lines.push('line-height: ' + n(parseFloat(lh) / fs, 3) + ';');
  lines.push('font-weight: ' + cs.fontWeight + ';');
  lines.push('font-family: "' + cs.fontFamily.split(',')[0].replace(/['"]/g, '') + '";');
  if (cs.letterSpacing !== 'normal') lines.push('letter-spacing: ' + cs.letterSpacing + ';');
  lines.push('color: ' + hex(cs.color) + ';');

  navigator.clipboard.writeText(lines.join('\n')).then(function () {
    t.innerHTML = '<b style="color:#0ead69">\u2713 Copiato!</b>';
    setTimeout(function () { t.style.display = 'none'; }, 800);
  });
};

// =============================================================================
// Event Listeners
// =============================================================================

document.addEventListener('mouseover', window._fiOver);
document.addEventListener('mouseout', window._fiOut);
document.addEventListener('click', window._fiClick, true);
