import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ConclusaoAtividade,
  InteracaoAtividade,
  ordemConfere,
  RESPOSTA_VAZIA,
  type RespostaAtividade,
} from '@/components/atividades/TelaAtividade';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { observarAtividade } from '@/lib/admin/repositorio';
import type { Atividade } from '@/lib/admin/tipos';
import { spacing } from '@/theme';

/**
 * Atividade no app (`66:6` a `263:131`): interação e depois conclusão.
 *
 * Tela de detalhe, com Voltar e sem o menu da conta (item 14 do `649:987`).
 * Atividade arquivada deixa de ser legível pelas regras e chega aqui como
 * erro: mostra indisponível e oferece voltar, como o detalhe da Biblioteca.
 *
 * Concluir ainda não registra a tentativa ("concluir registra tentativa",
 * `668:142`): não existe coleção de tentativas. Por enquanto volta à lista.
 */
export default function AtividadeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [atividade, setAtividade] = useState<Atividade | null | undefined>(undefined);
  const [resposta, setResposta] = useState<RespostaAtividade>(RESPOSTA_VAZIA);
  const [tentou, setTentou] = useState(false);
  const [concluida, setConcluida] = useState(false);

  useEffect(
    () =>
      observarAtividade(
        id,
        (lida) => setAtividade(lida && lida.status === 'publicado' ? lida : null),
        () => setAtividade(null),
      ),
    [id],
  );

  // Link direto sem histórico volta à área principal correspondente (`654:1760`).
  const sair = () => (router.canGoBack() ? router.back() : router.replace('/atividades'));

  function conferir() {
    if (!atividade) return;

    if (atividade.tipo === 'ordenacao' && !ordemConfere(atividade, resposta)) {
      setTentou(true);
      return;
    }

    setConcluida(true);
  }

  /** "Revisar mantém contexto" (`668:142`): refazer volta à interação do zero. */
  function refazer() {
    setResposta(RESPOSTA_VAZIA);
    setTentou(false);
    setConcluida(false);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.area, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {atividade === undefined ? (
          <ActivityIndicator color={colors.accent} style={styles.espera} />
        ) : atividade === null ? (
          <View style={styles.indisponivel} accessibilityLiveRegion="polite">
            <Text variant="headingMedium">Atividade indisponível.</Text>
            <Button label="VOLTAR ÀS ATIVIDADES" onPress={sair} />
          </View>
        ) : concluida ? (
          <ConclusaoAtividade
            atividade={atividade}
            resposta={resposta}
            aoVoltar={() => setConcluida(false)}
            aoRefazer={refazer}
            aoConcluir={sair}
          />
        ) : (
          <InteracaoAtividade
            atividade={atividade}
            resposta={resposta}
            tentou={tentou}
            aoResponder={(nova) => {
              setResposta(nova);
              setTentou(false);
            }}
            aoConferir={conferir}
            aoVoltar={sair}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  espera: {
    marginTop: spacing['3xl'],
  },
  indisponivel: {
    gap: spacing['2xl'],
    marginTop: spacing['3xl'],
  },
});
