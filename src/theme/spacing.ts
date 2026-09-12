/**
 * PAUSA — Espaçamento e raio
 *
 * O Figma não expõe estes valores como variáveis; a escala abaixo foi
 * derivada das medidas recorrentes nos frames do design system (múltiplos
 * de 4). Ao criar telas novas, prefira um degrau existente a um valor solto.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  /** Checkbox, indicadores pequenos. */
  sm: 4,
  /** Inputs e chips. */
  md: 8,
  /** Cards e botões. */
  lg: 12,
  /** Cards de destaque. */
  xl: 16,
  /** Switch e pílulas. */
  full: 999,
} as const;

/** Altura mínima de alvo de toque — acessibilidade (WCAG 2.5.5). */
export const minTouchTarget = 44;
