import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/estados';
import { BotaoVoltar } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { nomeDoFilosofo, nomesDosTemas } from '@/lib/admin/acervo';
import { observarConteudo, publicarConteudo } from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  NIVEIS,
  pendenciasParaPublicar,
  ROTULO_NIVEL,
  type Conteudo,
  type Nivel,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { radius, spacing } from '@/theme';

/** Largura do template de prévia no Figma (`599:107`) — a tela do app. */
const LARGURA_PREVIA = 390;

type Publicacao =
  | { estado: 'ocioso' }
  | { estado: 'publicando' }
  | { estado: 'erro'; mensagem: string };

export default function AdminRevisarScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nivel, setNivel] = useState<Nivel>('leigo');
  const [publicacao, setPublicacao] = useState<Publicacao>({ estado: 'ocioso' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      observarConteudo(
        id,
        (encontrado) => {
          setCarregando(false);

          if (!encontrado) {
            setErro('Este conteúdo não existe mais.');
            return;
          }

          setConteudo(encontrado);
        },
        (falha) => {
          setCarregando(false);
          setErro(falha.message);
        },
      ),
    [id, tentativa],
  );

  async function publicar() {
    if (!conteudo || !user || publicacao.estado === 'publicando') return;

    setPublicacao({ estado: 'publicando' });

    try {
      await publicarConteudo(conteudo.id, conteudo.versao, user.uid);
      // Sucesso: volta à lista, onde o status já aparece como Publicado.
      router.replace('/admin');
    } catch (falha) {
      // O rascunho continua intacto — nada é apagado numa falha de publicação.
      setPublicacao({
        estado: 'erro',
        mensagem: falha instanceof Error ? falha.message : 'Não foi possível publicar.',
      });
    }
  }

  const topo = (
    <BotaoVoltar
      rotulo="← EDITOR"
      aoVoltar={() => router.replace(`/admin/conteudo/${id}`)}
    />
  );

  if (carregando) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <Carregando rotulo="Carregando a prévia…" />
      </PaginaAdmin>
    );
  }

  if (erro || !conteudo) {
    return (
      <PaginaAdmin titulo="REVISAR E PUBLICAR" topo={topo}>
        <ErroRecuperavel
          mensagem={erro ?? 'Conteúdo indisponível.'}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  const pendencias = pendenciasParaPublicar(conteudo);

  return (
    <PaginaAdmin
      titulo="REVISAR E PUBLICAR"
      apoio={`Exemplo visual · ${ROTULO_NIVEL[nivel]} • Conferir as quatro versões antes de publicar.`}
      topo={topo}
      nota="Após publicar, o conteúdo volta à lista com status Publicado. Numa falha, o rascunho é preservado e a tentativa pode ser repetida.">
      <Linha>
        {NIVEIS.map((cada) => (
          <Button
            key={cada}
            label={ROTULO_NIVEL[cada].toLocaleUpperCase('pt-BR')}
            size="medium"
            type={cada === nivel ? 'primary' : 'secondary'}
            onPress={() => setNivel(cada)}
            style={styles.pilulaNivel}
            accessibilityState={{ selected: cada === nivel }}
          />
        ))}
      </Linha>

      <Linha>
        <Previa conteudo={conteudo} nivel={nivel} />

        <View style={styles.checklist}>
          <CaixaSecao titulo="CHECKLIST DE PUBLICAÇÃO">
            <Item
              ok={!!conteudo.autorId && conteudo.temaIds.length > 0 && !!conteudo.fonte.trim()}
              rotulo="Autor, temas e fonte"
            />

            {NIVEIS.map((cada) => (
              <Item
                key={cada}
                ok={conteudo.textos[cada].trim().length > 0}
                rotulo={ROTULO_NIVEL[cada]}
              />
            ))}

            <Item
              ok={aplicacaoVinculada(conteudo.aplicacao)}
              rotulo="Aplicação cotidiana vinculada"
            />

            <Text variant="supportSemibold">
              Ao publicar, o conteúdo fica disponível em Explorar e na página do filósofo. A
              aplicação prática aparece também em Filosofia no Cotidiano, sem cópias.
            </Text>

            {publicacao.estado === 'erro' ? (
              <Aviso mensagem={publicacao.mensagem} tom="erro" />
            ) : null}

            {pendencias.length > 0 ? (
              <Aviso mensagem={`Bloqueado: ${pendencias.join(' ')}`} tom="erro" />
            ) : null}

            <Button
              label={publicacao.estado === 'publicando' ? 'Publicando…' : 'PUBLICAR CONTEÚDO'}
              size="medium"
              disabled={publicacao.estado === 'publicando' || pendencias.length > 0}
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

/** Como o conteúdo vai aparecer no app, no nível escolhido. */
function Previa({ conteudo, nivel }: { conteudo: Conteudo; nivel: Nivel }) {
  const texto = conteudo.textos[nivel].trim();
  const aplicacao = conteudo.aplicacao.textos[nivel].trim();

  return (
    <View style={styles.previa}>
      <CaixaSecao espacamento="lg">
        <Text variant="labelMetadata" color="textSecondary">
          {nomeDoFilosofo(conteudo.autorId).toLocaleUpperCase('pt-BR')} ·{' '}
          {nomesDosTemas(conteudo.temaIds)}
        </Text>

        <Text variant="headingMedium">{conteudo.titulo || 'Sem título'}</Text>

        <Text color={texto ? 'text' : 'textSecondary'}>
          {texto || `Sem texto para ${ROTULO_NIVEL[nivel]} ainda.`}
        </Text>

        <View style={styles.divisor} />

        <Text variant="labelMetadata" color="textSecondary">
          FILOSOFIA NO COTIDIANO
        </Text>

        <Text variant="cardHeading">
          {conteudo.aplicacao.titulo || 'Aplicação sem título'}
        </Text>

        <Text color={aplicacao ? 'text' : 'textSecondary'}>
          {aplicacao || `Sem aplicação para ${ROTULO_NIVEL[nivel]} ainda.`}
        </Text>

        <Text variant="citationSource" color="textSecondary">
          {conteudo.fonte || 'Sem fonte informada.'}
        </Text>
      </CaixaSecao>
    </View>
  );
}

const styles = StyleSheet.create({
  pilulaNivel: {
    flexGrow: 1,
    flexBasis: 160,
  },
  previa: {
    width: LARGURA_PREVIA,
    flexGrow: 0,
  },
  checklist: {
    flexGrow: 1,
    flexBasis: 420,
  },
  publicar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['3xl'],
  },
  divisor: {
    height: 1,
    opacity: 0.2,
    backgroundColor: '#000',
    borderRadius: radius.sm,
  },
});
