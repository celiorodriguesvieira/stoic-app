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
