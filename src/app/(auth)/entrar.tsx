import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

export default function EntrarScreen() {
  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayBrand">PAUSA</Text>
        <Text variant="bodySmall" color="textSecondary">
          Pare. Pense. Escolha.
        </Text>
      </View>

      <Text variant="bodyMedium" color="textSecondary">
        Entre para continuar sua jornada.
      </Text>

      <Link href="/criar-conta">
        <Text variant="bodySmall" color="gold">
          Criar uma conta
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
