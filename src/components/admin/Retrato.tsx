import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { inicialDoNome } from '@/lib/admin/tipos';
import { retratoDoAcervo } from '@/lib/retratos';
import { radius } from '@/theme';

/**
 * Quadrado do retrato do filósofo (`643:1255`).
 *
 * Com retrato escolhido do acervo, mostra a ilustração e leva junto o texto
 * alternativo que veio dela — imagem que carrega informação não pode ser
 * decorativa. Sem retrato, mostra a inicial do nome, que é o que o contrato
 * manda, e aí sim o bloco é decorativo: o nome já está escrito ao lado.
 */
export function Retrato({
  nome,
  retratoId = null,
  tamanho = 80,
}: {
  nome: string;
  retratoId?: string | null;
  tamanho?: number;
}) {
  const { colors } = useTheme();

  const retrato = retratoDoAcervo(retratoId);
  const moldura = [
    styles.retrato,
    { width: tamanho, height: tamanho, backgroundColor: colors.selected },
  ];

  if (retrato) {
    return (
      <View style={moldura}>
        <Image
          source={retrato.arquivo}
          style={styles.imagem}
          contentFit="contain"
          accessibilityLabel={retrato.textoAlternativo}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={moldura}>
      <Text variant="headingLarge">{inicialDoNome(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  retrato: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
});
