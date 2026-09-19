import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ConclusaoAtividade,
  InteracaoAtividade,
  ordemConfere,
  RESPOSTA_VAZIA,
  type RespostaAtividade,
} from '@/components/atividades/TelaAtividade';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/Estados';
import { BotaoVoltar } from '@/components/admin/Navegacao';
import { Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { mensagemDeErro, observarAtividade, publicarAtividade } from '@/lib/admin/repositorio';
import { pendenciasDaAtividade, type Atividade } from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/** Largura da tela do app, como nas outras prévias (`599:107`). */
const LARGURA_PREVIA = 390;

type Publicacao =
  | { estado: 'ocioso' }
  | { estado: 'publicando' }
  | { estado: 'erro'; mensagem: string };

/**
 * Revisar atividade (`643:1272`): a interação e a conclusão lado a lado, com
 * os mesmos componentes da aba Atividades, e o botão de publicar.
 *
 * A interação responde ao toque: marcar outra alternativa troca a devolutiva
 * da conclusão, e é assim que se confere "resposta orientadora quando
 * aplicável" antes de publicar.
 */
export default function AdminRevisarAtividadeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [publicacao, setPublicacao] = useState<Publicacao>({ estado: 'ocioso' });
  const [tentativa, setTentativa] = useState(0);
  const [resposta, setResposta] = useState<RespostaAtividade>(RESPOSTA_VAZIA);
  const [tentou, setTentou] = useState(false);

  useEffect(
    () =>
      observarAtividade(
        id,
        (encontrada) => {
          setCarregando(false);

          if (!encontrada) {
            setErro('Esta atividade não existe mais.');
            return;
          }

          setAtividade(encontrada);
        },
        (falha) => {
          setCarregando(false);
          setErro(falha.message);
        },
      ),
    [id, tentativa],
  );

  async function publicar() {
    if (!atividade || !user || publicacao.estado === 'publicando') return;

    setPublicacao({ estado: 'publicando' });

    try {
      await publicarAtividade(atividade.id, atividade.versao, user.uid);
      router.replace('/admin/atividades');
    } catch (falha) {
      // O rascunho continua intacto: nada é apagado numa falha de publicação.
      setPublicacao({ estado: 'erro', mensagem: mensagemDeErro(falha, 'Não foi possível publicar.') });
    }
  }

  const topo = (
    <BotaoVoltar rotulo="← EDITOR" aoVoltar={() => router.replace(`/admin/atividades/${id}`)} />
  );
  const titulo = 'REVISAR ATIVIDADE';
  const apoio = 'Confira a interação e a conclusão antes de publicar.';

  if (carregando) {
    return (
      <PaginaAdmin titulo={titulo} apoio={apoio} topo={topo}>
        <Carregando rotulo="Carregando a prévia…" />
      </PaginaAdmin>
    );
  }

  if (erro || !atividade) {
    return (
      <PaginaAdmin titulo={titulo} apoio={apoio} topo={topo}>
        <ErroRecuperavel
          mensagem={erro ?? 'Atividade indisponível.'}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  const pendencias = pendenciasDaAtividade(atividade);
  const publicada = atividade.status === 'publicado';

  return (
    <PaginaAdmin titulo={titulo} apoio={apoio} topo={topo}>
      <Linha>
        <Aparelho>
          <InteracaoAtividade
            atividade={atividade}
            resposta={resposta}
            tentou={tentou}
            aoResponder={(nova) => {
              setResposta(nova);
              setTentou(false);
            }}
            aoConferir={() =>
              setTentou(atividade.tipo === 'ordenacao' && !ordemConfere(atividade, resposta))
            }
          />
        </Aparelho>

        <Aparelho>
          <ConclusaoAtividade
            atividade={atividade}
            resposta={resposta}
            aoRefazer={() => {
              setResposta(RESPOSTA_VAZIA);
              setTentou(false);
            }}
          />
        </Aparelho>
      </Linha>

      <Text variant="supportSemibold">
        Validar: título, tipo, duração, instrução, dinâmica completa e conclusão. Confirmar resposta
        orientadora quando aplicável.
      </Text>

      {pendencias.length > 0 ? (
        <Aviso mensagem={`Bloqueado: ${pendencias.join(' ')}`} tom="erro" />
      ) : null}

      {publicacao.estado === 'erro' ? <Aviso mensagem={publicacao.mensagem} tom="erro" /> : null}

      {publicada ? <Aviso mensagem="Esta atividade já está publicada." /> : null}

      <Button
        label={publicacao.estado === 'publicando' ? 'Publicando…' : 'PUBLICAR ATIVIDADE'}
        size="medium"
        disabled={publicacao.estado === 'publicando' || pendencias.length > 0 || publicada}
        onPress={publicar}
        style={styles.publicar}
      />
    </PaginaAdmin>
  );
}

/** A tela do app na largura do celular, sem moldura — como no `643:1272`. */
function Aparelho({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.aparelho, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  aparelho: {
    width: LARGURA_PREVIA,
    maxWidth: '100%',
    minHeight: 760,
    padding: spacing['2xl'],
    borderWidth: 1,
  },
  publicar: {
    alignSelf: 'flex-start',
    width: 320,
    maxWidth: '100%',
  },
});
