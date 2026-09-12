/**
 * Botão do design system (nó 74:11 do Figma).
 *
 * Variantes: Primary | Secondary  ×  Default | Disabled.
 * O estado desabilitado é o mesmo desenho com 45% de opacidade.
 */

import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget, radius } from '@/theme';

const HEIGHT = 56;
const DISABLED_OPACITY = 0.45;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  type?: 'primary' | 'secondary';
};

export function Button({ label, type = 'primary', disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = type === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: colors.accent }
          : { borderWidth: 1, borderColor: colors.accent },
        disabled && { opacity: DISABLED_OPACITY },
        // Feedback de toque não especificado no Figma — escurecemos levemente,
        // o mínimo para o toque não parecer sem resposta.
        pressed && !disabled && styles.pressed,
      ]}
      {...rest}>
      <Text
        variant="labelButtonCompact"
        color={isPrimary ? 'textOnAccent' : 'accent'}
        style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: HEIGHT,
    minHeight: minTouchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.85 },
  label: { textAlign: 'center' },
});
