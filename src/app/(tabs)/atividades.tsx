import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

export default function AtividadesScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: spacing['3xl'], gap: spacing.xs }}>
        <Text variant="headingLarge">Atividades</Text>
        <Text variant="bodySmall" color="textSecondary">
          Exercícios e quizzes.
        </Text>
      </View>
    </Screen>
  );
}
