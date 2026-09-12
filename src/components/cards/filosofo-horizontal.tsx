import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const WIDTH = 280;
const HEIGHT = 110;
const IMAGE_WIDTH = 106;

export type FilosofoHorizontalProps = ViewProps & {
  rotulo: string;
  titulo: string;
  descricao: string;
  imagem?: ImageSource | number;
};

export function CardFilosofoHorizontal({
  rotulo,
  titulo,
  descricao,
  imagem,
  style,
  ...rest
}: FilosofoHorizontalProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      {...rest}>
      <View style={styles.texto}>
        <Text variant="cardLabel" color="textAccent">
          {rotulo.toUpperCase()}
        </Text>
        <Text variant="cardHeading">{titulo}</Text>
        <Text variant="cardBody" color="textSecondary">
          {descricao}
        </Text>
      </View>

      <View style={[styles.imagem, { backgroundColor: colors.border }]}>
        {imagem ? <Image source={imagem} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  texto: {
    flex: 1,
    padding: spacing.lg - 1,
    justifyContent: 'space-between',
  },
  imagem: {
    width: IMAGE_WIDTH,
  },
});
