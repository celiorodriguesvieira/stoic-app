import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View, type DimensionValue, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const BASE_HEIGHT = 106;
const CARD_HEIGHT = 138;

export type RetratoFilosofoProps = ViewProps & {
  nome: string;
  contexto: string;
  periodo: string;
  imagem: ImageSource | number;

  // Área do personagem, que ultrapassa o topo do card.
  largura: number;
  altura: number;

  // Enquadramento da imagem dentro da área, copiado do Figma.
  recorte: { width: DimensionValue; height: DimensionValue; left: DimensionValue; top: DimensionValue };
};

export function CardRetratoFilosofo({
  nome,
  contexto,
  periodo,
  imagem,
  largura,
  altura,
  recorte,
  style,
  ...rest
}: RetratoFilosofoProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, style]} {...rest}>
      <View style={[styles.base, { backgroundColor: colors.portrait, borderColor: colors.wine }]}>
        <Text variant="portraitName" color="textAccent">
          {nome.toUpperCase()}
        </Text>
        <Text variant="portraitMeta" color="textSecondary">
          {contexto.toUpperCase()}
        </Text>
        <Text variant="portraitMeta" color="textSecondary" style={styles.periodo}>
          {periodo.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.personagem, { width: largura, height: altura }]}>
        <Image
          source={imagem}
          style={[styles.imagem, recorte]}
          contentFit="fill"
          accessible={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  base: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: BASE_HEIGHT,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingTop: spacing.lg - 1,
    paddingLeft: spacing.lg - 1,
    paddingRight: '45%',
    gap: 2,
  },
  periodo: {
    opacity: 0.78,
  },
  personagem: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    overflow: 'hidden',
    borderBottomRightRadius: 7,
  },
  imagem: {
    position: 'absolute',
  },
});
