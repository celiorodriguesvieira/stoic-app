/**
 * PAUSA — Escala tipográfica
 *
 * Espelho da seção "02 / Tipografia" do Figma.
 * Pixelify Sans carrega a identidade (marca, títulos, ações).
 * Inter carrega a leitura (conteúdo, descrições, metadados).
 */

import { Platform, type TextStyle } from 'react-native';

/** Nomes registrados por `useFonts` em `src/app/_layout.tsx`. */
export const fontFamily = {
  /** Pixelify Sans SemiBold — marca, títulos curtos, botões. */
  display: 'PixelifySans_600SemiBold',
  /** Pixelify Sans Bold — usado na tela de boas-vindas. */
  displayBold: 'PixelifySans_700Bold',
  /** Inter Regular — corpo de texto. */
  body: 'Inter_400Regular',
  /** Inter SemiBold — metadados e rótulos. */
  bodyStrong: 'Inter_600SemiBold',
} as const;

/**
 * Android renderiza `fontWeight` por cima da fonte carregada e acaba
 * sintetizando um negrito falso. Como cada peso já é um arquivo próprio,
 * fixamos `normal` e deixamos o peso por conta da família.
 */
const weight: Pick<TextStyle, 'fontWeight'> = Platform.select({
  android: { fontWeight: 'normal' },
  default: {},
})!;

export const typography = {
  /** Display / Brand — 40/44. Só para a marca "PAUSA". */
  displayBrand: {
    fontFamily: fontFamily.display,
    fontSize: 40,
    lineHeight: 44,
    ...weight,
  },
  /** Heading / Large — 28/34. Título de tela. */
  headingLarge: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    ...weight,
  },
  /** Heading / Medium — 22/28. Título de seção e card. */
  headingMedium: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 28,
    ...weight,
  },
  /** Label / Button — 16/20. Rótulo de botão, sempre em caixa alta. */
  labelButton: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    lineHeight: 20,
    ...weight,
  },
  /** Body / Large — 18/28. Texto introdutório e destaque editorial. */
  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 28,
    ...weight,
  },
  /** Body / Medium — 16/24. Leitura principal. */
  bodyMedium: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    ...weight,
  },
  /** Body / Small — 14/20. Descrições e apoio. */
  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    ...weight,
  },
  /** Label / Metadata — 12/16. "5 MIN • ESTOICISMO". */
  labelMetadata: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 12,
    lineHeight: 16,
    ...weight,
  },
  /**
   * ------------------------------------------------------------------
   * Degraus introduzidos pela tela de boas-vindas (nó 99:5 do Figma).
   *
   * ATENÇÃO: estes valores NÃO constam na página "02 / Tipografia" do
   * design system. Foram extraídos da tela como desenhada. Reconciliar:
   * ou a escala ganha estes degraus, ou a tela passa a usar os existentes.
   * ------------------------------------------------------------------
   */

  /** "PARE. PENSE." / "ESCOLHA." — Pixelify Bold 32. */
  splashHeading: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    lineHeight: 40,
    ...weight,
  },
  /** "BOAS-VINDAS!" — Pixelify SemiBold 20. */
  splashKicker: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    ...weight,
  },
  /** Corpo da citação em destaque editorial — Inter 13/19. */
  quote: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    ...weight,
  },
  /** Obra citada ("Encheirídion, 9") — Inter 11/15. */
  citationSource: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    ...weight,
  },
  /** Rótulo do botão na tela de boas-vindas — Pixelify SemiBold 14. */
  labelButtonCompact: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    lineHeight: 20,
    ...weight,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
