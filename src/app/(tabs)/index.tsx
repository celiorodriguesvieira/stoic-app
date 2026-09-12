import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

export default function HojeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text variant="displayBrand">PAUSA</Text>
        <Text variant="bodySmall" color="textSecondary">
          Pare. Pense. Escolha.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.emphasis, borderColor: colors.border },
        ]}>
        <Text variant="labelMetadata" color="gold" style={styles.metadata}>
          MENSAGEM DA SEMANA • ESTOICISMO
        </Text>
        <Text variant="bodyLarge" color="textOnAccent" style={styles.quote}>
          Não são as coisas que perturbam os homens, mas as opiniões que eles têm
          sobre as coisas.
        </Text>
        <Text variant="labelMetadata" color="textOnAccent" style={styles.author}>
          EPICTETO
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    gap: spacing['3xl'],
  },
  header: {
    paddingTop: spacing['3xl'],
    gap: spacing.xs,
  },
  card: {
    padding: spacing['2xl'],
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
  },
  metadata: {
    letterSpacing: 0.8,
  },
  quote: {
    // Citação é conteúdo editorial: Inter, não Pixelify. Ver design system.
  },
  author: {
    letterSpacing: 0.8,
    opacity: 0.8,
  },
});
