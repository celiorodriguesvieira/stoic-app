import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { CabecalhoApp } from '@/components/ui/cabecalho-app';
import { spacing } from '@/theme';

export default function BibliotecaScreen() {
  return (
    <Screen>
      <View style={{ paddingTop: spacing['3xl'] }}>
        <CabecalhoApp titulo="Biblioteca" apoio="Suas citações salvas." />
      </View>
    </Screen>
  );
}
