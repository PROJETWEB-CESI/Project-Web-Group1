/**
 * WCAG contrast utilities.
 * Used to calculate relative luminance and contrast ratios so that
 * high-contrast and dark theme colors are chosen for proper accessibility
 * (target >= 7:1 for high-contrast mode text, >= 4.5:1 for standard).
 *
 * Supports hex and OKLCH (tokens now use OKLCH for consistent perceived brightness).
 * OKLCH values are converted to sRGB for the standard WCAG luminance formula.
 */

function parseHex(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const bigint = parseInt(h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// oklch(L C H) -> [r, g, b] 0-255 (approx, sufficient for dev contrast logging)
function oklchToRgb(L, C, h) {
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // oklab -> linear srgb
  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  l_ = Math.pow(l_, 3);
  m_ = Math.pow(m_, 3);
  s_ = Math.pow(s_, 3);

  let r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  let bb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

  // linear srgb -> srgb
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  bb = bb > 0.0031308 ? 1.055 * Math.pow(bb, 1 / 2.4) - 0.055 : 12.92 * bb;

  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(bb * 255)))
  ];
}

function parseColor(color) {
  const c = color.trim().toLowerCase();
  if (c.startsWith('#')) {
    return parseHex(c);
  }
  if (c.startsWith('oklch(')) {
    // oklch(0.37 0.12 260) or with units, but computed usually decimal
    const match = c.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
    if (match) {
      const L = parseFloat(match[1]);
      const C = parseFloat(match[2]);
      const H = parseFloat(match[3]);
      return oklchToRgb(L, C, H);
    }
  }
  // fallback
  return [0, 0, 0];
}

function srgbToLinear(channel) {
  const cs = channel / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(color) {
  const [r, g, b] = parseColor(color);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function getContrastRatio(foreground, background) {
  const L1 = getRelativeLuminance(foreground);
  const L2 = getRelativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function verifyContrastPair(fg, bg, minRatio = 4.5) {
  const ratio = getContrastRatio(fg, bg);
  return {
    ratio: Number(ratio.toFixed(2)),
    passes: ratio >= minRatio,
    minRequired: minRatio,
  };
}

// Helper for runtime theme verification (dev only)
export function logContrastVerification(theme, primary, onPrimary, text, bg) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

  try {
    const linkOnBg = verifyContrastPair(primary, bg, 4.5);
    const buttonOnPrimary = verifyContrastPair(onPrimary, primary, 4.5);
    const textOnBg = verifyContrastPair(text, bg, 4.5);

    console.log(`[contrast] theme=${theme}`, {
      'primary-on-bg': `${linkOnBg.ratio}:1 ${linkOnBg.passes ? '✓' : '✗'}`,
      'onPrimary-on-primary': `${buttonOnPrimary.ratio}:1 ${buttonOnPrimary.passes ? '✓' : '✗'}`,
      'text-on-bg': `${textOnBg.ratio}:1 ${textOnBg.passes ? '✓' : '✗'}`,
    });
  } catch (e) {
    // silent in case of bad color values
  }
}
