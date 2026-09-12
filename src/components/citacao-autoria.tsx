/**
 * Citação / Autoria (nó 116:8 do Figma).
 *
 * Regra do design system, registrada na descrição do componente:
 * autor e obra em linhas separadas — não usar ponto, barra ou traço
 * como separador entre eles.
 */

import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

export type CitacaoAutoriaProps = ViewProps & {
  autor: string;
  obra: string;
  alinhamento?: 'centro' | 'esquerda';
};

export function CitacaoAutoria({
  autor,
  obra,
  alinhamento = 'centro',
  style,
  ...rest
}: CitacaoAutoriaProps) {
  const alinhado = alinhamento === 'centro' ? 'center' : 'flex-start';
  const textAlign = alinhamento === 'centro' ? 'center' : 'left';

  return (
    <View style={[styles.container, { alignItems: alinhado }, style]} {...rest}>
      <Text variant="labelMetadata" color="textAccent" style={{ textAlign }}>
        {autor.toUpperCase()}
      </Text>
      <Text variant="citationSource" color="textAccent" style={{ textAlign }}>
        {obra}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
});
