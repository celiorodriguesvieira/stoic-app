import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget, radius } from '@/theme';

const HEIGHT = { large: 56, medium: 48 } as const;
const DISABLED_OPACITY = 0.45;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  type?: 'primary' | 'secondary';

  size?: keyof typeof HEIGHT;

  shape?: 'pill' | 'rounded';

  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  type = 'primary',
  size = 'large',
  shape = 'pill',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = type === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size], borderRadius: shape === 'pill' ? radius.full : radius.md },
        isPrimary
          ? { backgroundColor: colors.accent }
          : { borderWidth: 1, borderColor: colors.accent },
        disabled && { opacity: DISABLED_OPACITY },
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...rest}>
      <Text
        variant={size === 'large' ? 'labelButtonCompact' : 'labelButton'}
        color={isPrimary ? 'textOnAccent' : 'accent'}
        style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pressed: { opacity: 0.85 },
  label: { textAlign: 'center' },
});
