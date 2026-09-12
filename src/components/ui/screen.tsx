import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

export type ScreenProps = ViewProps & {

  edges?: readonly Edge[];

  noPadding?: boolean;
};

export function Screen({
  edges = ['top'],
  noPadding = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <View style={[styles.content, !noPadding && styles.padded, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: spacing['2xl'] },
});
