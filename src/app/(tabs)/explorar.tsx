import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

export default function ExplorarScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: spacing['3xl'], gap: spacing.xs }}>
        <Text variant="headingLarge">Explorar</Text>
        <Text variant="bodySmall" color="textSecondary">
          Filósofos, temas e trilhas.
        </Text>
      </View>
    </Screen>
  );
}
