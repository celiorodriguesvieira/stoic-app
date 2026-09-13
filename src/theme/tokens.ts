export const palette = {
  light: {
    'bg/canvas': '#e7e0d6',
    'bg/surface': '#fbf7ef',
    'bg/accent': '#2c2a2e',
    'bg/emphasis': '#4a3f3a',
    'text/primary': '#252327',
    'text/secondary': '#756e68',
    'text/on-accent': '#fbf7ef',
    'text/accent': '#a96e10',
    'bg/card': '#efe8df',
    'text/on-emphasis-muted': '#c2bab5',
    'brand/gold': '#d69a26',
    'border/default': '#d8cec2',
    'brand/wine': '#8a625a',
    'text/error': '#a8322d',
    'bg/selected': '#efe4d8',
    'bg/portrait': '#e9dcc9',
  },
  dark: {
    'bg/canvas': '#171515',
    'bg/surface': '#211e1c',
    'bg/accent': '#d8c2b2',
    'bg/emphasis': '#473933',
    'text/primary': '#f2ece3',
    'text/secondary': '#b8aea4',

    'text/on-accent': '#211e1c',

    'text/accent': '#e5b454',
    'bg/card': '#1c1a19',
    'text/on-emphasis-muted': '#c2bab5',
    'brand/gold': '#e5b454',
    'border/default': '#4a423d',
    'brand/wine': '#c29a90',
    'text/error': '#f0948a',
    'bg/selected': '#3a3128',
    'bg/portrait': '#2e2620',
  },
} as const;

function semantic(mode: keyof typeof palette) {
  const p = palette[mode];
  return {

    canvas: p['bg/canvas'],

    surface: p['bg/surface'],

    accent: p['bg/accent'],

    emphasis: p['bg/emphasis'],

    text: p['text/primary'],

    textSecondary: p['text/secondary'],

    textOnAccent: p['text/on-accent'],

    textAccent: p['text/accent'],
    card: p['bg/card'],
    textOnEmphasisMuted: p['text/on-emphasis-muted'],

    gold: p['brand/gold'],

    border: p['border/default'],

    wine: p['brand/wine'],

    error: p['text/error'],

    selected: p['bg/selected'],

    portrait: p['bg/portrait'],
  } as const;
}

export const Colors = {
  light: semantic('light'),
  dark: semantic('dark'),
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = keyof typeof Colors;
