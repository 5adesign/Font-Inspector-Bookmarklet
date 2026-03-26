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
  if (window._fiDeactivate) window._fiDeactivate()
  return
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
    .replace(/\.$/, '')
}

/**
 * Converts an rgb() or rgba() color string to a hex color code.
 * Preserves the original rgba() string when alpha is less than 1.
 *
 * @param {string} c - A CSS color value (e.g. "rgb(255, 0, 0)").
 * @returns {string} Hex color (e.g. "#ff0000") or original string if non-opaque.
 */
function hex(c) {
  var m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!m) return c
  if (m[4] !== undefined && parseFloat(m[4]) < 1) return c
  return '#' + ((1 << 24) + (+m[1] << 16) + (+m[2] << 8) + +m[3]).toString(16).slice(1)
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
    return parseFloat(x) === 0 ? '0' : x
  })
  if (a[0] === a[1] && a[1] === a[2] && a[2] === a[3]) return a[0]
  if (a[0] === a[2] && a[1] === a[3]) return a[0] + ' ' + a[1]
  if (a[1] === a[3]) return a[0] + ' ' + a[1] + ' ' + a[2]
  return a.join(' ')
}

/**
 * Builds an HTML sub-line showing flex/grid layout information for an element.
 * Returns an empty string if the element is not a flex or grid container.
 *
 * @param {CSSStyleDeclaration} cs - The computed style of the element.
 * @returns {string} HTML string with layout info, or "" if not flex/grid.
 */
function layout(cs) {
  var d = cs.display
  if (d.indexOf('flex') < 0 && d.indexOf('grid') < 0) return ''

  var p = [d]

  if (d.indexOf('grid') >= 0) {
    var c = cs.gridTemplateColumns
    if (c && c !== 'none') {
      var cols = c.trim().split(/\s+/).length
      p.push(cols + ' cols')
    }
  }

  var g = cs.gap
  if (g && g !== 'normal' && g !== '0px') {
    p.push('gap: ' + g)
  }

  return '<div class="sub">' + p.join(' \u00b7 ') + '</div>'
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
  var m = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft]
  var p = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft]
  var hasM = m.some(function (v) {
    return parseFloat(v) !== 0
  })
  var hasP = p.some(function (v) {
    return parseFloat(v) !== 0
  })
  var r = el.getBoundingClientRect()
  var parts = []
  if (hasM) parts.push('<span class="label">margin:</span> <b>' + sh(m) + '</b>')
  if (hasP) parts.push('<span class="label">padding:</span> <b>' + sh(p) + '</b>')
  parts.push('<b>' + Math.round(r.width) + '\u00d7' + Math.round(r.height) + '</b>')
  return '<div class="sub boxline">' + parts.join(' \u00b7 ') + '</div>'
}

/**
 * Escapes text for safe HTML output inside the tooltip.
 *
 * @param {string} text
 * @returns {string}
 */
function esc(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Counts characters, characters without spaces, and words for a text value.
 *
 * @param {string} text
 * @returns {{chars:number, charsNoSpaces:number, words:number, text:string}}
 */
function countText(text) {
  var value = text || ''
  var collapsed = value.replace(/\s+/g, ' ').trim()
  return {
    chars: value.length,
    charsNoSpaces: value.replace(/\s/g, '').length,
    words: collapsed ? collapsed.split(' ').length : 0,
    text: value,
  }
}

/**
 * Builds an HTML sub-line showing text count information.
 *
 * @param {{chars:number, charsNoSpaces:number, words:number}} data
 * @param {boolean} withDivider
 * @returns {string}
 */
function countline(data, withDivider) {
  return (
    '<div class="sub' +
    (withDivider ? ' countline' : '') +
    '">' +
    '<b>' +
    data.chars +
    '</b> caratteri' +
    ' \u00b7 <b>' +
    data.charsNoSpaces +
    '</b> senza spazi' +
    ' \u00b7 <b>' +
    data.words +
    '</b> parole</div>'
  )
}

/**
 * Splits a selector list on top-level commas.
 *
 * @param {string} selectorText
 * @returns {string[]}
 */
function splitSelectorList(selectorText) {
  var parts = []
  var current = ''
  var depth = 0
  var quote = ''

  for (var i = 0; i < selectorText.length; i += 1) {
    var char = selectorText[i]

    if (quote) {
      current += char
      if (char === quote && selectorText[i - 1] !== '\\') quote = ''
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }

    if (char === '(' || char === '[') depth += 1
    if ((char === ')' || char === ']') && depth > 0) depth -= 1

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

/**
 * Computes a best-effort specificity tuple for selector comparison.
 *
 * @param {string} selector
 * @returns {number[]}
 */
function specificity(selector) {
  var text = selector
    .replace(/::[\w-]+/g, '')
    .replace(/:where\(([^)]*)\)/g, ' ')
    .replace(/"[^"]*"|'[^']*'/g, ' ')

  var ids = (text.match(/#[\w-]+/g) || []).length
  var classes = (text.match(/\.[\w-]+/g) || []).length
  var attrs = (text.match(/\[[^\]]+\]/g) || []).length
  var pseudoClasses = (text.match(/:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length

  var stripped = text
    .replace(/#[\w-]+/g, ' ')
    .replace(/\.[\w-]+/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/:(?!:)[\w-]+(?:\([^)]*\))?/g, ' ')

  var elementMatches = stripped.match(/(^|[\s>+~])([a-zA-Z][\w-]*|\*)/g) || []
  var elements = elementMatches.filter(function (part) {
    return !/\*/.test(part)
  }).length

  return [ids, classes + attrs + pseudoClasses, elements]
}

/**
 * Returns true when candidate A should win over candidate B in the cascade.
 *
 * @param {{important:boolean,specificity:number[],order:number}} a
 * @param {{important:boolean,specificity:number[],order:number}|null} b
 * @returns {boolean}
 */
function beats(a, b) {
  if (!b) return true
  if (a.important !== b.important) return a.important

  for (var i = 0; i < a.specificity.length; i += 1) {
    if (a.specificity[i] !== b.specificity[i]) return a.specificity[i] > b.specificity[i]
  }

  return a.order > b.order
}

/**
 * Best-effort lookup of the declared letter-spacing value for an element.
 *
 * @param {Element} el
 * @returns {string}
 */
function declaredLetterSpacing(el) {
  var inlineValue = el.style && el.style.getPropertyValue('letter-spacing')
  if (inlineValue) return inlineValue.trim()

  var best = null
  var order = 0

  function visitRules(rules) {
    if (!rules) return

    for (var i = 0; i < rules.length; i += 1) {
      var rule = rules[i]

      if (rule.type === CSSRule.STYLE_RULE) {
        var value = rule.style.getPropertyValue('letter-spacing')
        if (!value) continue

        var selectors = splitSelectorList(rule.selectorText)
        for (var j = 0; j < selectors.length; j += 1) {
          var selector = selectors[j]

          try {
            if (!el.matches(selector)) continue
          } catch (error) {
            continue
          }

          order += 1
          var candidate = {
            value: value.trim(),
            important: rule.style.getPropertyPriority('letter-spacing') === 'important',
            specificity: specificity(selector),
            order: order,
          }

          if (beats(candidate, best)) best = candidate
        }
        continue
      }

      if (rule.type === CSSRule.MEDIA_RULE) {
        if (window.matchMedia(rule.conditionText).matches) visitRules(rule.cssRules)
        continue
      }

      if (rule.type === CSSRule.SUPPORTS_RULE) {
        if (CSS.supports(rule.conditionText)) visitRules(rule.cssRules)
        continue
      }

      if (rule.cssRules) visitRules(rule.cssRules)
    }
  }

  for (var sheetIndex = 0; sheetIndex < document.styleSheets.length; sheetIndex += 1) {
    var sheet = document.styleSheets[sheetIndex]

    try {
      visitRules(sheet.cssRules)
    } catch (error) {
      continue
    }
  }

  return best ? best.value : ''
}

/**
 * Formats letter-spacing showing the declared value when available and the
 * computed px equivalent when useful.
 *
 * @param {Element} el
 * @param {string} computedValue
 * @param {number} fontSize
 * @returns {string}
 */
function letterSpacingInfo(el, computedValue, fontSize) {
  if (!computedValue || computedValue === 'normal') return ''

  var declaredValue = declaredLetterSpacing(el)
  var shownValue = declaredValue || computedValue
  var computedPx = parseFloat(computedValue)
  var pxSuffix = ''

  if (declaredValue && declaredValue !== computedValue && !Number.isNaN(computedPx) && !/px$/i.test(declaredValue)) {
    pxSuffix = ' <span class="muted">(' + n(computedPx, 3) + 'px)</span>'
  }

  // Fallback conversion when the browser only exposes a non-px computed value.
  if (!pxSuffix && !/px$/i.test(shownValue)) {
    var numeric = parseFloat(shownValue)
    var pxValue = null

    if (!Number.isNaN(numeric)) {
      if (/em$/i.test(shownValue)) {
        pxValue = numeric * fontSize
      } else if (/rem$/i.test(shownValue)) {
        pxValue = numeric * root
      } else if (/%$/i.test(shownValue)) {
        pxValue = (numeric / 100) * fontSize
      }
    }

    if (pxValue !== null) {
      pxSuffix = ' <span class="muted">(' + n(pxValue, 3) + 'px)</span>'
    }
  }

  return '<span class="label">letter-spacing:</span> ' + shownValue + pxSuffix
}

/**
 * Builds a short quoted excerpt for selection count previews.
 *
 * @param {string} text
 * @returns {string}
 */
function excerpt(text) {
  var collapsed = (text || '').replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''
  var short = collapsed.slice(0, 140)
  return '<div class="excerpt">"' + esc(short) + (collapsed.length > 140 ? '...' : '') + '"</div>'
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
    var ps = ['::after', '::before']
    ps.forEach(function (pseudo) {
      var s = getComputedStyle(a, pseudo)
      if (s.position === 'absolute' && s.content && s.content !== 'none' && s.content !== 'normal') {
        a.classList.add('fi-bypass')
      }
    })

    // Check if the anchor itself is an absolute overlay covering its parent
    var cs = getComputedStyle(a)
    if (cs.position === 'absolute' && a.parentElement) {
      var r = a.getBoundingClientRect()
      var pr = a.parentElement.getBoundingClientRect()
      if (Math.abs(r.width - pr.width) < 5 && Math.abs(r.height - pr.height) < 5) {
        a.classList.add('fi-bypass')
      }
    }
  })
}

// =============================================================================
// Styles
// =============================================================================

var s = document.createElement('style')
s.id = 'fi-style'
s.textContent =
  '#fi-tooltip{position:fixed;z-index:999999;background:#1a1a2e;color:#fff;font:13px/1.45 monospace;padding:14px 16px;border-radius:4px;pointer-events:none;display:none;max-width:min(720px, calc(100vw - 48px));box-shadow:0 10px 28px rgba(0,0,0,.32)}' +
  '#fi-tooltip b{color:#e94560}' +
  '#fi-tooltip .title{color:#f4f1f8;font-size:15px;line-height:1.35;letter-spacing:-.01em}' +
  '#fi-tooltip .title b{font-weight:700}' +
  '#fi-tooltip .family{color:#bbb4c8}' +
  '#fi-tooltip .meta{margin-top:4px;color:#afa8bf;font-size:12px;line-height:1.35}' +
  '#fi-tooltip .label{color:#7f788f}' +
  '#fi-tooltip .muted{color:#706a7e}' +
  '#fi-tooltip span.rem{color:#53d8fb}' +
  '#fi-tooltip span.ratio{color:#0ead69}' +
  '#fi-tooltip span.hex{color:#ffbd69}' +
  '#fi-tooltip .sub{margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;color:#9e99ab;line-height:1.35}' +
  '#fi-tooltip .sub b{color:#c0a0ff;font-weight:500}' +
  '#fi-tooltip .sub+.sub{border-top:none;margin-top:4px;padding-top:0}' +
  '#fi-tooltip .boxline{margin-top:6px;padding-top:6px}' +
  '#fi-tooltip .sub.countline{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}' +
  '#fi-tooltip .excerpt{margin-top:8px;font-size:11px;color:#777087;line-height:1.4}' +
  '#fi-tooltip .hint{margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:#5f596d;font-style:italic;letter-spacing:.01em}' +
  '.fi-outline{outline:2px solid #e94560!important;outline-offset:-1px}' +
  '.fi-bypass{pointer-events:none!important}'
document.head.appendChild(s)

bypassStretched()

// =============================================================================
// Tooltip Element
// =============================================================================

var t = document.createElement('div')
t.id = 'fi-tooltip'
document.body.appendChild(t)

/** @type {Element|null} Currently highlighted element. */
window._fiEl = null

/** Root font-size in px, used for rem calculations. */
var root = parseFloat(getComputedStyle(document.documentElement).fontSize)

/**
 * Removes injected UI and event listeners, then clears bookmarklet globals.
 */
window._fiDeactivate = function () {
  var styleEl = document.getElementById('fi-style')
  var tooltipEl = document.getElementById('fi-tooltip')
  if (styleEl) styleEl.remove()
  if (tooltipEl) tooltipEl.remove()
  document.removeEventListener('mouseover', window._fiOver)
  document.removeEventListener('mouseout', window._fiOut)
  document.removeEventListener('click', window._fiClick, true)
  document.removeEventListener('mouseup', window._fiSelection, true)
  document.removeEventListener('keydown', window._fiKeydown, true)
  delete window._fiOver
  delete window._fiOut
  delete window._fiClick
  delete window._fiSelection
  delete window._fiKeydown
  delete window._fiDeactivate
  delete window._fiEl
}

/**
 * Positions the tooltip near the pointer while keeping it in the viewport.
 *
 * @param {number} x
 * @param {number} y
 */
function positionTooltip(x, y) {
  t.style.display = 'block'
  t.style.left = Math.min(x + 12, innerWidth - t.offsetWidth - 8) + 'px'
  t.style.top = (y > innerHeight - 100 ? y - t.offsetHeight - 8 : y + 16) + 'px'
}

/**
 * Renders HTML into the tooltip and positions it.
 *
 * @param {number} x
 * @param {number} y
 * @param {string} html
 */
function showTooltip(x, y, html) {
  t.innerHTML = html
  positionTooltip(x, y)
}

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
  var el = e.target

  // Ignore the tooltip itself
  if (el.id === 'fi-tooltip' || el.closest('#fi-tooltip')) return

  // Move outline to the new element
  if (window._fiEl) window._fiEl.classList.remove('fi-outline')
  el.classList.add('fi-outline')
  window._fiEl = el

  var cs = getComputedStyle(el)
  var fs = parseFloat(cs.fontSize)
  var lh = cs.lineHeight
  var fw = cs.fontWeight
  var ff = cs.fontFamily.split(',')[0].replace(/['"]/g, '')
  var ls = cs.letterSpacing
  var col = hex(cs.color)
  var rem = n(fs / root, 3)
  var textInfo = countText(el.innerText || el.textContent || '')

  var lhInfo = 'normal'
  if (lh !== 'normal') {
    var ratio = n(parseFloat(lh) / fs, 3)
    lhInfo = lh + ' <span class="ratio">(' + ratio + ')</span>'
  }

  showTooltip(
    e.clientX,
    e.clientY,
    '<div class="title"><b>' +
      cs.fontSize +
      '</b> <span class="rem">(' +
      rem +
      'rem)</span> / ' +
      lhInfo +
      ' \u00b7 <b>' +
      fw +
      '</b> \u00b7 <span class="family">' +
      ff +
      '</span></div>' +
      '<div class="meta">' +
      (ls !== 'normal' ? letterSpacingInfo(el, ls, fs) + ' \u00b7 ' : '') +
      '<span class="label">color:</span> <span class="hex">' +
      col +
      '</span></div>' +
      layout(cs) +
      boxline(cs, el) +
      countline(textInfo, true) +
      '<div class="hint">Click per copiare le regole CSS \u00b7 Seleziona il testo per il conteggio battute</div>',
  )
}

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
  if (e.relatedTarget && e.relatedTarget.id === 'fi-tooltip') return
  if (window._fiEl) window._fiEl.classList.remove('fi-outline')
  t.style.display = 'none'
  window._fiEl = null
}

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
  if (window.getSelection().toString().trim()) return
  if (!window._fiEl) return
  e.preventDefault()
  e.stopPropagation()

  var cs = getComputedStyle(window._fiEl)
  var fs = parseFloat(cs.fontSize)
  var lh = cs.lineHeight
  var lines = []

  lines.push('font-size: ' + n(fs / root, 3) + 'rem;')
  if (lh !== 'normal') lines.push('line-height: ' + n(parseFloat(lh) / fs, 3) + ';')
  lines.push('font-weight: ' + cs.fontWeight + ';')
  lines.push('font-family: "' + cs.fontFamily.split(',')[0].replace(/['"]/g, '') + '";')
  if (cs.letterSpacing !== 'normal') lines.push('letter-spacing: ' + cs.letterSpacing + ';')
  lines.push('color: ' + hex(cs.color) + ';')

  navigator.clipboard.writeText(lines.join('\n')).then(function () {
    t.innerHTML = '<b style="color:#0ead69">\u2713 Copiato!</b>'
    setTimeout(function () {
      t.style.display = 'none'
    }, 800)
  })
}

// =============================================================================
// Selected Text Count Handler
// =============================================================================

/**
 * Shows text counts for the current selection, if any.
 *
 * @param {MouseEvent} e
 */
window._fiSelection = function (e) {
  var selected = window.getSelection().toString()
  if (!selected.trim()) return

  var data = countText(selected)
  showTooltip(e.clientX || 20, e.clientY || 20, countline(data, true) + '<div class="sub">Testo selezionato</div>' + excerpt(data.text))
}

/**
 * Deactivates the bookmarklet when Escape is pressed.
 *
 * @param {KeyboardEvent} e
 */
window._fiKeydown = function (e) {
  if (e.key !== 'Escape') return
  window._fiDeactivate()
}

// =============================================================================
// Event Listeners
// =============================================================================

document.addEventListener('mouseover', window._fiOver)
document.addEventListener('mouseout', window._fiOut)
document.addEventListener('click', window._fiClick, true)
document.addEventListener('mouseup', window._fiSelection, true)
document.addEventListener('keydown', window._fiKeydown, true)
