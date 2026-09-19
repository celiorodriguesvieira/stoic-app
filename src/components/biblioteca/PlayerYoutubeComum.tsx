import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily } from '@/theme';

/** Altura do player no detalhe (`780:52`). */
export const ALTURA_PLAYER = 200;

/** A representação do Figma (`780:52`), usada quando não há como incorporar. */
export function PlayerIndisponivel({
  aoAbrir,
  invalido = false,
}: {
  aoAbrir: () => void;
  invalido?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Reproduzir vídeo no YouTube"
      disabled={invalido}
      onPress={aoAbrir}
      style={[styles.player, { backgroundColor: colors.accent }]}>
      <Text color="textOnAccent" style={styles.texto}>
        {invalido ? 'Link de vídeo inválido' : '▶\nReproduzir vídeo'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  player: {
    height: ALTURA_PLAYER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
});
