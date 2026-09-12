import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const HEIGHT = 130;

export type TemaDestaqueProps = ViewProps & {
  categoria: string;
  titulo: string;
  cta?: string;
};

export function CardTemaDestaque({
  categoria,
  titulo,
  cta = 'VER CONTEÚDO  →',
  style,
  ...rest
}: TemaDestaqueProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.accent }, style]} {...rest}>
      <Text variant="cardLabel" color="textOnAccent">
        {categoria.toUpperCase()}
      </Text>
      <Text variant="cardTitle" color="textOnAccent">
        {titulo.toUpperCase()}
      </Text>
      <Text variant="cardLabel" color="textOnAccent">
        {cta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
});
