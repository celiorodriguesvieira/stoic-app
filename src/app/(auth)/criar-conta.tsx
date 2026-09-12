import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

/**
 * Tela de cadastro.
 *
 * TODO: implementar o visual a partir do Figma quando a tela estiver
 * desenhada, e ligar o envio a `createUserWithEmailAndPassword`.
 */
export default function CriarContaScreen() {
  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text variant="headingLarge">Criar conta</Text>
        <Text variant="bodySmall" color="textSecondary">
          Seu progresso fica salvo e acompanha você.
        </Text>
      </View>

      <Link href="/entrar">
        <Text variant="bodySmall" color="gold">
          Já tenho conta
        </Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: spacing['2xl'],
  },
  header: {
    gap: spacing.xs,
  },
});
