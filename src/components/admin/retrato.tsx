import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { inicialDoNome } from '@/lib/admin/tipos';
import { radius } from '@/theme';

/**
 * Quadrado da foto do filósofo (`643:1255`).
 *
 * Sem imagem, mostra a inicial do nome — é o que o contrato `643:1269` manda
 * fazer, e é o estado de todo mundo enquanto não houver upload. Decorativo:
 * o nome já está escrito ao lado, então o leitor de tela ignora este bloco.
 */
export function Retrato({ nome, tamanho = 80 }: { nome: string; tamanho?: number }) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.retrato,
        { width: tamanho, height: tamanho, backgroundColor: colors.selected },
      ]}>
      <Text variant="headingLarge">{inicialDoNome(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  retrato: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
