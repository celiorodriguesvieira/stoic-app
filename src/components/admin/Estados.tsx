import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

/**
 * Estados obrigatórios do nó `600:76`: carregando, vazio, sem resultados e erro
 * recuperável. Ficam num arquivo só para que nenhuma tela invente o seu.
 */

export function Carregando({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.bloco} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.accent} />
      <Text variant="supportSemibold">{rotulo}</Text>
    </View>
  );
}

export function Vazio({ titulo, apoio }: { titulo: string; apoio?: string }) {
  return (
    <View style={styles.bloco}>
      <Text variant="supportSemibold">{titulo}</Text>
      {apoio ? <Text color="textSecondary">{apoio}</Text> : null}
    </View>
  );
}

/** Erro recuperável: sempre com caminho de volta, nunca um beco sem saída. */
export function ErroRecuperavel({
  mensagem,
  aoTentarDeNovo,
}: {
  mensagem: string;
  aoTentarDeNovo?: () => void;
}) {
  return (
    <View style={styles.bloco} accessibilityLiveRegion="assertive">
      <Text variant="supportSemibold" color="error">
        {mensagem}
      </Text>

      {aoTentarDeNovo ? (
        <Button
          label="TENTAR DE NOVO"
          type="secondary"
          size="medium"
          onPress={aoTentarDeNovo}
          style={styles.botao}
        />
      ) : null}
    </View>
  );
}

/** Confirmação discreta de gravação — o "salvo" do nó `600:76`. */
export function Aviso({ mensagem, tom = 'neutro' }: { mensagem: string; tom?: 'neutro' | 'erro' }) {
  return (
    <Text
      variant="supportSemibold"
      color={tom === 'erro' ? 'error' : 'textAccent'}
      accessibilityLiveRegion="polite">
      {mensagem}
    </Text>
  );
}

const styles = StyleSheet.create({
  bloco: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    alignItems: 'flex-start',
  },
  botao: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2xl'],
  },
});
