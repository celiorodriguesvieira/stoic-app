import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

export default function BibliotecaScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: spacing['3xl'], gap: spacing.xs }}>
        <Text variant="headingLarge">Biblioteca</Text>
        <Text variant="bodySmall" color="textSecondary">
          Suas citações salvas.
        </Text>
      </View>
    </Screen>
  );
}
