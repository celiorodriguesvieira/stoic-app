import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DetalheRecurso } from '@/components/biblioteca/DetalheRecurso';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/Estados';
import { BotaoVoltar } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { mensagemDeErro, observarRecurso, publicarRecurso } from '@/lib/admin/repositorio';
import {
  errosDoRecurso,
  pendenciasDoRecurso,
  type RecursoBiblioteca,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/** Largura da tela do app, como na prévia do conteúdo (`599:107`). */
const LARGURA_PREVIA = 390;

type Publicacao =
  | { estado: 'ocioso' }
  | { estado: 'publicando' }
  | { estado: 'erro'; mensagem: string };

/**
 * Revisão e publicação de um recurso da Biblioteca.
 *
 * O formulário manda "confira a reprodução incorporada na prévia antes de
 * publicar" (`668:203`), então a prévia é o próprio detalhe do app
 * (`DetalheRecurso`), com o embed oficial montado a partir do `videoId`.
 */
export default function AdminRevisarRecursoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [recurso, setRecurso] = useState<RecursoBiblioteca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [publicacao, setPublicacao] = useState<Publicacao>({ estado: 'ocioso' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      observarRecurso(
        id,
        (encontrado) => {
          setCarregando(false);

          if (!encontrado) {
            setErro('Este recurso não existe mais.');
            return;
          }

          setRecurso(encontrado);
        },
        (falha) => {
          setCarregando(false);
          setErro(falha.message);
        },
      ),
    [id, tentativa],
  );

  async function publicar() {
    if (!recurso || !user || publicacao.estado === 'publicando') return;

    setPublicacao({ estado: 'publicando' });

    try {
      await publicarRecurso(recurso.id, recurso.versao, user.uid);
      router.replace('/admin/biblioteca');
    } catch (falha) {
      // O rascunho continua intacto: nada é apagado numa falha de publicação.
      setPublicacao({ estado: 'erro', mensagem: mensagemDeErro(falha, 'Não foi possível publicar.') });
    }
  }

  const topo = (
    <BotaoVoltar
      rotulo="← EDITOR"
      aoVoltar={() => router.replace(`/admin/biblioteca/${id}`)}
    />
  );

  if (carregando) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <Carregando rotulo="Carregando a prévia…" />
      </PaginaAdmin>
    );
  }

  if (erro || !recurso) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <ErroRecuperavel
          mensagem={erro ?? 'Recurso indisponível.'}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  const video = recurso.tipo === 'video';
  const erros = errosDoRecurso(recurso);
  const pendencias = pendenciasDoRecurso(recurso);
  const publicado = recurso.status === 'publicado';

  return (
    <PaginaAdmin
      titulo="REVISAR E PUBLICAR"
      topo={topo}
      nota={
        video
          ? 'O vídeo publicado aparece em Todos e Vídeos, com player oficial do YouTube dentro do detalhe. Validar a reprodução na prévia do admin. Se não carregar, oferecer Abrir no YouTube. Sem upload ou Cloud Storage.'
          : 'Publicado aparece em Todos e Livros. Se Link de afiliado = Sim, mostrar o aviso de comissão antes do botão. Preço e disponibilidade ficam na loja.'
      }>
      <Linha>
        <Previa recurso={recurso} />

        <View style={styles.checklist}>
          <CaixaSecao titulo="CHECKLIST DE PUBLICAÇÃO">
            <Item ok={!erros.titulo} rotulo="Título" />
            <Item ok={!erros.criador} rotulo={video ? 'Canal ou criador' : 'Autor do livro'} />
            <Item ok={!erros.url} rotulo={video ? 'Link do YouTube' : 'Link da loja (HTTPS)'} />
            <Item ok={!erros.recomendacao} rotulo="Por que recomendamos" />

            {publicacao.estado === 'erro' ? (
              <Aviso mensagem={publicacao.mensagem} tom="erro" />
            ) : null}

            {pendencias.length > 0 ? (
              <Aviso mensagem={`Bloqueado: ${pendencias.join(' ')}`} tom="erro" />
            ) : null}

            {publicado ? <Aviso mensagem="Este recurso já está publicado." /> : null}

            <Button
              label={publicacao.estado === 'publicando' ? 'Publicando…' : 'PUBLICAR CONTEÚDO'}
              size="medium"
              disabled={publicacao.estado === 'publicando' || pendencias.length > 0 || publicado}
              onPress={publicar}
              style={styles.publicar}
            />
          </CaixaSecao>
        </View>
      </Linha>
    </PaginaAdmin>
  );
}

function Item({ ok, rotulo }: { ok: boolean; rotulo: string }) {
  return (
    <Text
      variant="supportSemibold"
      color={ok ? 'text' : 'textSecondary'}
      accessibilityLabel={`${rotulo}: ${ok ? 'pronto' : 'pendente'}`}>
      {ok ? '✓' : '○'} {rotulo}
    </Text>
  );
}

/** O detalhe do app, na largura da tela do celular. */
function Previa({ recurso }: { recurso: RecursoBiblioteca }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.previa, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <DetalheRecurso recurso={recurso} />
    </View>
  );
}

const styles = StyleSheet.create({
  previa: {
    width: LARGURA_PREVIA,
    maxWidth: '100%',
    padding: spacing['2xl'],
    borderWidth: 1,
  },
  checklist: {
    flexGrow: 1,
    flexBasis: 420,
  },
  publicar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3xl'],
  },
});
