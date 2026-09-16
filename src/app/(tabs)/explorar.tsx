import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { CabecalhoApp } from '@/components/ui/cabecalho-app';
import { spacing } from '@/theme';

export default function ExplorarScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: spacing['3xl'] }}>
        <CabecalhoApp titulo="Explorar" apoio="Filósofos, temas e trilhas." />
      </View>
    </Screen>
  );
}
