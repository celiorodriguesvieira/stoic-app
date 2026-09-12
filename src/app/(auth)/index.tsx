/**
 * Tela de boas-vindas (nó 99:5 do Figma — "Splash / Epicteto").
 *
 * O Figma desenha a tela num quadro de 320×693, que é uma maquete reduzida.
 * Em vez de reproduzir as posições absolutas, o layout é uma coluna: a arte
 * do Epicteto absorve a altura extra dos aparelhos maiores e os blocos de
 * texto mantêm o ritmo de espaçamento do desenho.
 */

import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CitacaoAutoria } from '@/components/citacao-autoria';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EpictetoSequence } from '@/components/epicteto-sequence';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

export default function BoasVindasScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    // Esta tela usa `surface`, não `canvas`: é o fundo creme do desenho.
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <Text variant="splashKicker" style={styles.kicker}>
        BOAS-VINDAS!
      </Text>

      <EpictetoSequence style={styles.art} />

      <View style={styles.editorial}>
        <View>
          <Text variant="splashHeading" style={styles.heading}>
            PARE. PENSE.
          </Text>
          <Text variant="splashHeading" color="textAccent" style={styles.heading}>
            ESCOLHA.
          </Text>
        </View>

        <Text variant="quote" style={styles.quote}>
          “Mancar é um impedimento para a perna, mas não para a vontade.”
        </Text>

        <CitacaoAutoria autor="Epicteto" obra="Encheirídion, 9" />
      </View>

      <Button label="COMEÇAR JORNADA" onPress={() => router.push('/criar-conta')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  kicker: {
    textAlign: 'center',
  },
  /** A arte absorve a folga vertical das telas mais altas. */
  art: {
    flex: 1,
    minHeight: 200,
  },
  editorial: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  heading: {
    textAlign: 'center',
  },
  quote: {
    textAlign: 'center',
    maxWidth: 272,
  },
});
