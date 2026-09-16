import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { imagemDoAvatar, inicialDoNome } from '@/lib/avatares';
import { radius } from '@/theme';

/**
 * Avatar da conta: pixel art do acervo ou a inicial do nome (item 07).
 *
 * Decorativo para o leitor de tela — o nome sempre aparece escrito ao lado,
 * e anunciar "imagem de Sêneca" antes do nome da pessoa só atrapalharia.
 */
export function Avatar({
  nome,
  avatarId,
  tamanho = 64,
}: {
  nome: string;
  avatarId: string | null;
  tamanho?: number;
}) {
  const { colors } = useTheme();
  const imagem = imagemDoAvatar(avatarId);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.moldura,
        { width: tamanho, height: tamanho, backgroundColor: colors.selected },
      ]}>
      {imagem ? (
        <Image source={imagem} style={styles.imagem} contentFit="cover" transition={0} />
      ) : (
        <Text variant="headingLarge">{inicialDoNome(nome)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: {
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
