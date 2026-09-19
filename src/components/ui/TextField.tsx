import type { Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, spacing } from '@/theme';

const HEIGHT = 48;

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;

  error?: string;
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, ref, ...rest }: TextFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text variant="supportSemibold">{label}</Text>

      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
        ]}
        {...rest}
      />

      {error ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  input: {
    height: HEIGHT,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
});
