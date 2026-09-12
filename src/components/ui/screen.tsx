/**
 * Moldura padrão de tela: fundo do tema, área segura e respiro lateral.
 * Evita repetir SafeAreaView + backgroundColor em toda tela nova.
 */

import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

export type ScreenProps = ViewProps & {
  /**
   * Bordas que respeitam a área segura. Telas dentro das abas não precisam de
   * `bottom`, porque a própria barra de abas já ocupa esse espaço.
   */
  edges?: readonly Edge[];
  /** Remove o respiro lateral — para listas que sangram até a borda. */
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
