import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import type { ThemeColor } from '@/theme';

export type CitacaoAutoriaProps = ViewProps & {
  autor: string;
  obra: string;
  alinhamento?: 'centro' | 'esquerda';
  cor?: ThemeColor;
};

export function CitacaoAutoria({
  autor,
  obra,
  alinhamento = 'centro',
  cor = 'textAccent',
  style,
  ...rest
}: CitacaoAutoriaProps) {
  const alinhado = alinhamento === 'centro' ? 'center' : 'flex-start';
  const textAlign = alinhamento === 'centro' ? 'center' : 'left';

  return (
    <View style={[styles.container, { alignItems: alinhado }, style]} {...rest}>
      <Text variant="labelMetadata" color={cor} style={{ textAlign }}>
        {autor.toUpperCase()}
      </Text>
      <Text variant="citationSource" color={cor} style={[styles.obra, { textAlign }]}>
        {obra}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  obra: { opacity: 0.78 },
});
