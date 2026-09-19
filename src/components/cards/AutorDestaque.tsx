import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const HEIGHT = 134;

export type AutorDestaqueProps = ViewProps & {
  nome: string;
  apoio: string;
};

export function CardAutorDestaque({ nome, apoio, style, ...rest }: AutorDestaqueProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.emphasis }, style]} {...rest}>
      <Text variant="cardTitle" color="textOnAccent">
        {nome.toUpperCase()}
      </Text>
      <Text variant="cardSupport" color="textOnEmphasisMuted">
        {apoio.toUpperCase()}
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
