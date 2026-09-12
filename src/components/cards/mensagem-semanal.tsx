import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { CitacaoAutoria } from '@/components/citacao-autoria';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

const MIN_HEIGHT = 173;
const PORTRAIT_WIDTH = 215;
const PORTRAIT_HEIGHT = 155;
const PORTRAIT_OVERFLOW = -40;

export type MensagemSemanalProps = ViewProps & {
  citacao: string;
  autor: string;
  obra: string;
  retrato?: ImageSource | number;
};

export function CardMensagemSemanal({
  citacao,
  autor,
  obra,
  retrato,
  style,
  ...rest
}: MensagemSemanalProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.accent }, style]} {...rest}>
      {retrato ? (
        <Image source={retrato} style={styles.retrato} contentFit="contain" />
      ) : null}

      <Text variant="cardQuote" color="textOnAccent" style={styles.citacao}>
        {citacao}
      </Text>

      <CitacaoAutoria autor={autor} obra={obra} alinhamento="esquerda" cor="gold" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_HEIGHT,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  retrato: {
    position: 'absolute',
    right: PORTRAIT_OVERFLOW,
    top: spacing.xl,
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT,
  },
  citacao: {
    maxWidth: '80%',
  },
});
