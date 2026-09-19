import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

/**
 * Boas-vindas — porta de entrada do primeiro acesso.
 *
 * Nó `621:18` do Figma. Contrato `618:18`, item 01: "Splash automática →
 * Boas-vindas com Criar conta e Entrar." Não há entrada sem cadastro.
 *
 * O espaço flexível antes das ações é o "Arte adiada" (`622:20`) — reservado
 * para ilustração que ainda não existe.
 */
export default function BoasVindasScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="labelButton" color="wine">
          PAUSA
        </Text>

        <View style={styles.introducao}>
          <Text variant="headingLarge" accessibilityRole="header">
            PARE. PENSE. ESCOLHA.
          </Text>

          <Text variant="supportSemibold">
            Filosofia em pequenas pausas, para pensar melhor as escolhas do dia.
          </Text>
        </View>

        {/* Arte adiada (`622:20`). */}
        <View style={styles.espaco} />

        <View style={styles.acoes}>
          <Button label="CRIAR CONTA" size="medium" onPress={() => router.push('/criar-conta')} />

          <Button
            label="ENTRAR"
            type="secondary"
            size="medium"
            onPress={() => router.push('/entrar')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    gap: spacing['2xl'],
  },
  introducao: {
    gap: spacing.sm,
  },
  espaco: {
    flexGrow: 1,
  },
  acoes: {
    gap: spacing.lg,
  },
});
