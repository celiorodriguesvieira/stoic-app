import { Platform, type TextStyle } from 'react-native';

export const fontFamily = {

  display: 'PixelifySans_600SemiBold',

  displayBold: 'PixelifySans_700Bold',
  displayRegular: 'PixelifySans_400Regular',
  displayMedium: 'PixelifySans_500Medium',

  body: 'Inter_400Regular',

  bodyStrong: 'Inter_600SemiBold',
  bodyMediumWeight: 'Inter_500Medium',
} as const;

const weight: Pick<TextStyle, 'fontWeight'> = Platform.select({
  android: { fontWeight: 'normal' },
  default: {},
})!;

export const typography = {

  displayBrand: {
    fontFamily: fontFamily.display,
    fontSize: 40,
    lineHeight: 44,
    ...weight,
  },

  headingLarge: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 32,
    ...weight,
  },

  headingMedium: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 28,
    ...weight,
  },

  labelButton: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.25,
    ...weight,
  },

  bodyLarge: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 28,
    ...weight,
  },

  bodyMedium: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
    ...weight,
  },

  bodySmall: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    ...weight,
  },

  supportSemibold: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 14,
    lineHeight: 20,
    ...weight,
  },

  onboardingKicker: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    lineHeight: 17,
    ...weight,
  },

  onboardingTitle: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    lineHeight: 43,
    ...weight,
  },

  onboardingTitleCompact: {
    fontFamily: fontFamily.display,
    fontSize: 29,
    lineHeight: 35,
    ...weight,
  },

  optionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 22,
    ...weight,
  },

  optionLabel: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 14,
    lineHeight: 17,
    ...weight,
  },

  portraitName: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    ...weight,
  },

  portraitMeta: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 14,
    ...weight,
  },

  labelMetadata: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 12,
    lineHeight: 16,
    ...weight,
  },

  splashHeading: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    lineHeight: 40,
    ...weight,
  },

  splashKicker: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    ...weight,
  },

  quote: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    ...weight,
  },

  citationSource: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    ...weight,
  },

  labelButtonCompact: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    lineHeight: 20,
    ...weight,
  },
  labelNav: {
    fontFamily: fontFamily.displayRegular,
    fontSize: 10,
    lineHeight: 16,
    ...weight,
  },
  cardQuote: {
    fontFamily: fontFamily.bodyMediumWeight,
    fontSize: 18,
    lineHeight: 26,
    ...weight,
  },
  cardTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 24,
    ...weight,
  },
  cardLabel: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    lineHeight: 16,
    ...weight,
  },
  cardHeading: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 16,
    lineHeight: 22,
    ...weight,
  },
  cardSupport: {
    fontFamily: fontFamily.bodyStrong,
    fontSize: 12,
    lineHeight: 16,
    ...weight,
  },
  cardBody: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    ...weight,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
