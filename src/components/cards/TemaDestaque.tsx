import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const HEIGHT = 130;

export type TemaDestaqueProps = ViewProps & {
  /** Opcional: os atalhos da Home (`327:519`) têm só título e chamada. */
  categoria?: string;
  titulo: string;
  cta?: string;
  /** Os dois atalhos da Home vêm em cores diferentes (`327:519`). */
  tom?: 'escuro' | 'dourado';
};

export function CardTemaDestaque({
  categoria,
  titulo,
  cta = 'VER CONTEÚDO',
  tom = 'escuro',
  style,
  ...rest
}: TemaDestaqueProps) {
  const { colors } = useTheme();

  const fundo = tom === 'dourado' ? colors.gold : colors.accent;

  return (
    <View style={[styles.card, { backgroundColor: fundo }, style]} {...rest}>
      {categoria ? (
        <Text variant="cardLabel" color="textOnAccent">
          {categoria.toUpperCase()}
        </Text>
      ) : null}
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
