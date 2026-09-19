import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { minTouchTarget } from '@/theme';

/**
 * Voltar visível, para telas sem cabeçalho nativo.
 *
 * O app roda com `headerShown: false`, então não há seta do sistema. No
 * Android o botão físico resolvia; no iPhone, não — e Cadastro, Entrar e a
 * segunda tela do onboarding ficavam sem nenhuma saída a não ser fechar o app.
 *
 * O Figma não desenhou este controle em nenhuma das três telas: está anotado
 * na lista de pendências do Figma em `docs/progresso.md`.
 */
export function Voltar({
  /** Para onde se volta, em maiúsculas — vira o rótulo e a etiqueta de acessibilidade. */
  destino,
  aoVoltar,
  style,
}: {
  destino: string;
  aoVoltar: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${destino.toLocaleLowerCase('pt-BR')}`}
      onPress={aoVoltar}
      style={[styles.area, style]}>
      <Text variant="supportSemibold" color="wine">
        ← {destino.toLocaleUpperCase('pt-BR')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  area: {
    minHeight: Math.max(48, minTouchTarget),
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
