/**
 * PAUSA — Design tokens
 *
 * Espelho fiel da página "00. Design System" do Figma.
 * Fonte da verdade: as variáveis `--pausa-color-*` do arquivo Figma.
 * Ao alterar um valor aqui, altere também no Figma (e vice-versa).
 */

/** Paleta crua, por modo. Não use direto nas telas — use `useTheme()`. */
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
    'brand/gold': '#d69a26',
    'border/default': '#d8cec2',
  },
  dark: {
    'bg/canvas': '#171515',
    'bg/surface': '#211e1c',
    'bg/accent': '#d8c2b2',
    'bg/emphasis': '#473933',
    'text/primary': '#f2ece3',
    'text/secondary': '#b8aea4',
    // NOTA: o Figma não define `text/on-accent` no modo dark. Como `bg/accent`
    // inverte para bege claro (#d8c2b2), o texto sobre ele precisa ser escuro.
    // Valor derivado de `bg/surface` dark. Confirmar com o designer.
    'text/on-accent': '#211e1c',
    // NOTA: o Figma só define `text/accent` no modo light (#a96e10 — um
    // dourado escuro, legível sobre fundo claro). Sobre fundo escuro ele
    // ficaria ilegível, então usamos o dourado do modo dark. Confirmar.
    'text/accent': '#e5b454',
    'brand/gold': '#e5b454',
    'border/default': '#4a423d',
  },
} as const;

/** Nomes semânticos usados no código, mapeados a partir da paleta. */
function semantic(mode: keyof typeof palette) {
  const p = palette[mode];
  return {
    /** Fundo da tela. */
    canvas: p['bg/canvas'],
    /** Fundo de cards e superfícies elevadas. */
    surface: p['bg/surface'],
    /** Fundo de ação primária (botão primário, item ativo). */
    accent: p['bg/accent'],
    /** Fundo de destaque editorial (citação, banner). */
    emphasis: p['bg/emphasis'],
    /** Texto de leitura principal. */
    text: p['text/primary'],
    /** Texto de apoio, legendas e metadados. */
    textSecondary: p['text/secondary'],
    /** Texto sobre `accent` e `emphasis`. */
    textOnAccent: p['text/on-accent'],
    /** Dourado de texto — palavra em destaque, autoria de citação. */
    textAccent: p['text/accent'],
    /** Dourado da marca — indicadores, streak, realce. */
    gold: p['brand/gold'],
    /** Borda padrão de cards, inputs e divisores. */
    border: p['border/default'],
  } as const;
}

export const Colors = {
  light: semantic('light'),
  dark: semantic('dark'),
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = keyof typeof Colors;
