/**
 * WCAG contrast utilities.
 * Used to calculate relative luminance and contrast ratios so that
 * high-contrast and dark theme colors are chosen for proper accessibility
 * (target >= 7:1 for high-contrast mode text, >= 4.5:1 for standard).
 *
 * The calculation follows WCAG 2.1: sRGB linearization + weighted luminance.
 */

function parseHex(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const bigint = parseInt(h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function srgbToLinear(channel) {
  const cs = channel / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hexColor) {
  const [r, g, b] = parseHex(hexColor);
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
