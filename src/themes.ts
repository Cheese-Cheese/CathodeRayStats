import { ScreenPalette, TVCabinetPalette } from './types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export function parseHex(hex: string): Rgb | null {
  const cleanHex = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleanHex)) {
    return null;
  }
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) * 60;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / delta + 2) * 60;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / delta + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hNorm = (h % 360 + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm += 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

export const SCREEN_PRESETS: Record<string, ScreenPalette> = {
  white: {
    primary: '#E2E8F0',
    bright: '#FFFFFF',
    dim: '#94A3B8', // High-contrast, clear silver for labels & secondary text
    bg: '#0A0E14',
  },
  yellow: {
    primary: '#FFB000',
    bright: '#FFD54F',
    dim: '#D4A024',
    bg: '#140D02',
  },
  amber: {
    primary: '#FFB000',
    bright: '#FFD54F',
    dim: '#D4A024',
    bg: '#140D02',
  },
  green: {
    primary: '#4AF626',
    bright: '#80FF66',
    dim: '#62D946',
    bg: '#051205',
  },
  cyan: {
    primary: '#00F0FF',
    bright: '#80F8FF',
    dim: '#38BDF8',
    bg: '#03141A',
  },
  magenta: {
    primary: '#FF4D88',
    bright: '#FF85AD',
    dim: '#F472B6',
    bg: '#14030A',
  },
  pink: {
    primary: '#FF4D88',
    bright: '#FF85AD',
    dim: '#F472B6',
    bg: '#14030A',
  },
  orange: {
    primary: '#FF6B1A',
    bright: '#FF9459',
    dim: '#FB923C',
    bg: '#140702',
  },
};

export const TV_PRESETS: Record<string, TVCabinetPalette> = {
  charcoal: {
    body: '#26292E',
    bezelDark: '#15171A',
    bezelLight: '#3A3F47',
    labelColor: '#9CA3AF',
  },
  walnut: {
    body: '#6E472B',
    bezelDark: '#4A2E1B',
    bezelLight: '#8C5D3B',
    labelColor: '#D1B094',
  },
  beige: {
    body: '#D6C7B2',
    bezelDark: '#9E8F7B',
    bezelLight: '#EDE3D5',
    labelColor: '#4A4033',
  },
  mustard: {
    body: '#C98A27',
    bezelDark: '#8F5E12',
    bezelLight: '#E3A646',
    labelColor: '#3D2502',
  },
  crimson: {
    body: '#8F2424',
    bezelDark: '#5C1313',
    bezelLight: '#B33636',
    labelColor: '#F5C6C6',
  },
  navy: {
    body: '#1F344D',
    bezelDark: '#111E2E',
    bezelLight: '#2F4C70',
    labelColor: '#B0C9E6',
  },
};

export function resolveScreenPalette(input: string = 'white'): ScreenPalette {
  const normalized = input.trim().toLowerCase();
  if (SCREEN_PRESETS[normalized]) {
    return SCREEN_PRESETS[normalized];
  }

  const rgb = parseHex(input);
  if (!rgb) {
    return SCREEN_PRESETS.white;
  }

  const hsl = rgbToHsl(rgb);
  const primary = rgbToHex(rgb);
  const bright = rgbToHex(hslToRgb({
    h: hsl.h,
    s: Math.min(100, hsl.s + 10),
    l: Math.min(100, hsl.l + 18),
  }));
  const dim = rgbToHex(hslToRgb({
    h: hsl.h,
    s: Math.max(30, hsl.s * 0.75),
    l: Math.max(52, Math.min(72, hsl.l * 0.85)),
  }));
  const bg = rgbToHex(hslToRgb({
    h: hsl.h,
    s: Math.min(45, hsl.s * 0.4),
    l: Math.max(4, Math.min(10, hsl.l * 0.12)),
  }));

  return { primary, bright, dim, bg };
}

export function resolveTVPalette(input: string = 'charcoal'): TVCabinetPalette {
  const normalized = input.trim().toLowerCase();
  if (TV_PRESETS[normalized]) {
    return TV_PRESETS[normalized];
  }

  const rgb = parseHex(input);
  if (!rgb) {
    return TV_PRESETS.charcoal;
  }

  const hsl = rgbToHsl(rgb);
  const body = rgbToHex(rgb);
  const bezelDark = rgbToHex(hslToRgb({
    h: hsl.h,
    s: hsl.s,
    l: Math.max(0, hsl.l - 18),
  }));
  const bezelLight = rgbToHex(hslToRgb({
    h: hsl.h,
    s: hsl.s,
    l: Math.min(100, hsl.l + 14),
  }));
  const labelColor = hsl.l < 50
    ? rgbToHex(hslToRgb({ h: hsl.h, s: Math.min(25, hsl.s), l: 75 }))
    : rgbToHex(hslToRgb({ h: hsl.h, s: Math.min(25, hsl.s), l: 20 }));

  return { body, bezelDark, bezelLight, labelColor };
}
