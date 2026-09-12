import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { typography, type ThemeColor, type TypographyVariant } from '@/theme';

export type PausaTextProps = TextProps & {

  variant?: TypographyVariant;

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
