/**
 * Texto do PAUSA.
 *
 * Sempre use este componente em vez do `Text` do react-native: ele garante
 * que todo texto saia em um degrau da escala tipográfica do design system e
 * com uma cor do tema, em vez de valores soltos espalhados pelas telas.
 */

import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { typography, type ThemeColor, type TypographyVariant } from '@/theme';

export type PausaTextProps = TextProps & {
  /** Degrau da escala tipográfica. Ver `src/theme/typography.ts`. */
  variant?: TypographyVariant;
  /** Cor semântica do tema. Ver `src/theme/tokens.ts`. */
  color?: ThemeColor;
};

export function Text({
  variant = 'bodyMedium',
  color = 'text',
  style,
  ...rest
}: PausaTextProps) {
  const { colors } = useTheme();

  return <RNText style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
