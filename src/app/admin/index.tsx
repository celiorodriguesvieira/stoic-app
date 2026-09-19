import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/Estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { nomesDosTemas } from '@/lib/admin/acervo';
import {
  arquivarConteudo,
  ErroPedeConfirmacao,
  observarConteudos,
  mensagemDeErro,
  restaurarConteudo,
  traduzirErro,
} from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  NIVEIS,
  niveisCompletos,
  niveisPreenchidos,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type Conteudo,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/**
 * Casa uma busca livre com título, filósofo e temas do conteúdo (nó `596:21`).
 *
 * O nome do autor chega pronto: desde que os filósofos saíram do código, ele
 * depende de uma leitura do Firestore e não dá mais para resolver aqui dentro.
 */
function combina(conteudo: Conteudo, termo: string, nomeDoAutor: string): boolean {
  if (!termo) return true;

  const alvo = [
    conteudo.titulo,
    nomeDoAutor,
    nomesDosTemas(conteudo.temaIds),
  ]
    .join(' ')
    .toLocaleLowerCase('pt-BR');

  return alvo.includes(termo.toLocaleLowerCase('pt-BR').trim());
}

export default function AdminConteudosScreen() {
  const router = useRouter();
  const { nomeDoFilosofo } = useFilosofos();

  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  useEffect(
    () => observarConteudos(setConteudos, (falha) => setErro(falha.message)),
    [tentativa],
  );

  const arquivados = useMemo(
    () => (conteudos ?? []).filter((conteudo) => conteudo.status === 'arquivado').length,
    [conteudos],
  );

  // Arquivado fica fora do catálogo por padrão: é o que "excluir" significa aqui.
  const filtrados = useMemo(
    () =>
      (conteudos ?? []).filter(
        (conteudo) =>
          combina(conteudo, busca, nomeDoFilosofo(conteudo.autorId)) &&
          (mostrarArquivados || conteudo.status !== 'arquivado'),
      ),
    [conteudos, busca, mostrarArquivados, nomeDoFilosofo],
  );

  return (
    <PaginaAdmin
      titulo="ACERVO EDITORIAL"
      apoio="Um cadastro. Todos os caminhos do PAUSA."
      topo={<EtiquetaAdmin />}
      nota="O card só aparece na Home após publicação pelo admin e início da semana escolhida. Rascunhos não aparecem no app.">
      <NavegacaoAdmin atual="conteudos" />

      <Linha>
        <View style={styles.busca}>
          <CampoTexto
            rotulo="Buscar"
            placeholder="Buscar por título, filósofo ou tema…"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Button
          label="NOVO CONTEÚDO DA SEMANA"
          size="medium"
          onPress={() => router.push('/admin/aula/novo')}
          style={styles.novo}
        />

        <Button
          label="NOVO CONTEÚDO / EXPLORAR"
          type="secondary"
          size="medium"
          onPress={() => router.push('/admin/conteudo/novo')}
          style={styles.novo}
        />

        {/* `672:1245`. Abre o vídeo, que é o primeiro dos dois formulários; o
            próprio formulário troca para livro. */}
        <Button
          label="NOVO RECURSO / BIBLIOTECA"
          type="secondary"
          size="medium"
          onPress={() => router.push('/admin/biblioteca/novo?tipo=video')}
          style={styles.novo}
        />
      </Linha>

      {arquivados > 0 ? (
        <Button
          label={
            mostrarArquivados
              ? 'OCULTAR ARQUIVADOS'
              : `MOSTRAR ARQUIVADOS (${arquivados})`
          }
          type="secondary"
          size="medium"
          onPress={() => setMostrarArquivados((visivel) => !visivel)}
          style={styles.alternador}
        />
      ) : null}

      <CaixaSecao>
        <View style={styles.linhaCabecalho}>
          <Text variant="supportSemibold" style={styles.colTitulo}>
            TÍTULO / AUTOR
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            TIPO
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            NÍVEIS
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            COTIDIANO
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            STATUS
          </Text>
          <View style={styles.colAcao} />
        </View>

        {erro ? (
          <ErroRecuperavel mensagem={erro} aoTentarDeNovo={() => {
              setErro(null);
              setTentativa((n) => n + 1);
            }} />
        ) : conteudos === null ? (
          <Carregando rotulo="Carregando o catálogo…" />
        ) : conteudos.length === 0 ? (
          <Vazio
            titulo="Nenhum conteúdo cadastrado ainda."
            apoio="Comece por “Novo conteúdo da semana”."
          />
        ) : filtrados.length === 0 ? (
          <Vazio
            titulo={
              busca
                ? 'Nenhum conteúdo corresponde à busca.'
                : 'Nenhum conteúdo ativo no catálogo.'
            }
            apoio={busca ? `Termo: “${busca}”` : 'Os arquivados estão ocultos.'}
          />
        ) : (
          filtrados.map((conteudo) => (
            <LinhaConteudo
              key={conteudo.id}
              conteudo={conteudo}
              autor={nomeDoFilosofo(conteudo.autorId)}
              aoEditar={() =>
                router.push(
                  conteudo.tipo === 'aula'
                    ? `/admin/aula/${conteudo.id}`
                    : `/admin/conteudo/${conteudo.id}`,
                )
              }
            />
          ))
        )}
      </CaixaSecao>
    </PaginaAdmin>
  );
}

/** Etapas da linha. `perguntando` é a confirmação de arquivamento (nó `600:76`). */
type Etapa = 'ocioso' | 'perguntando' | 'trabalhando';

function LinhaConteudo({
  conteudo,
  autor,
  aoEditar,
}: {
  conteudo: Conteudo;
  autor: string;
  aoEditar: () => void;
}) {
  const { user } = useAuth();

  const [etapa, setEtapa] = useState<Etapa>('ocioso');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  // Sobe para verdadeiro quando o repositório pergunta sobre destaques agendados.
  const [desmarcarDestaques, setDesmarcarDestaques] = useState(false);

  const nome = conteudo.titulo || 'conteúdo sem título';
  const arquivado = conteudo.status === 'arquivado';

  // "Pronto" quer dizer coisas diferentes: no artigo é o texto daquele nível
  // escrito; na aula são as quatro etapas do nível completas.
  const prontos =
    conteudo.tipo === 'aula'
      ? niveisCompletos(conteudo.aula.etapas).length
      : niveisPreenchidos(conteudo.textos).length;

  function perguntar() {
    setEtapa('perguntando');
    setFalhou(false);
    setDesmarcarDestaques(false);
    setMensagem('Some do catálogo e do app. Dá para restaurar depois.');
  }

  function desistir() {
    setEtapa('ocioso');
    setMensagem(null);
    setFalhou(false);
    setDesmarcarDestaques(false);
  }

  async function arquivar() {
    if (!user) return;

    setEtapa('trabalhando');
    setFalhou(false);

    try {
      await arquivarConteudo(conteudo.id, conteudo.versao, user.uid, desmarcarDestaques);
      // A lista vem de `onSnapshot`: a linha some sozinha, sem aviso de sucesso.
      setEtapa('ocioso');
      setMensagem(null);
    } catch (falha) {
      const erro = traduzirErro(falha instanceof Error ? falha : new Error('Não foi possível arquivar.'));

      setEtapa('perguntando');
      setMensagem(erro.message);
      setFalhou(!(erro instanceof ErroPedeConfirmacao));
      // Segunda tentativa já vai autorizada a desmarcar as datas.
      setDesmarcarDestaques(erro instanceof ErroPedeConfirmacao);
    }
  }

  async function restaurar() {
    if (!user) return;

    setEtapa('trabalhando');
    setFalhou(false);

    try {
      const destino = await restaurarConteudo(conteudo.id, conteudo.versao, user.uid);
      setEtapa('ocioso');
      setMensagem(`Restaurado como ${ROTULO_STATUS[destino].toLocaleLowerCase('pt-BR')}.`);
    } catch (falha) {
      setEtapa('ocioso');
      setMensagem(mensagemDeErro(falha, 'Não foi possível restaurar.'));
      setFalhou(true);
    }
  }

  return (
    <View style={styles.bloco}>
      <View style={styles.linhaConteudo}>
        <Text style={styles.colTitulo}>
          {conteudo.titulo || 'Sem título'}
          {'\n'}
          {autor}
        </Text>

        <Text style={styles.colCurta}>{ROTULO_TIPO[conteudo.tipo]}</Text>

        <Text style={styles.colCurta}>
          {prontos} de {NIVEIS.length}
        </Text>

        <Text style={styles.colCurta}>
          {conteudo.tipo === 'aula'
            ? 'Não se aplica'
            : aplicacaoVinculada(conteudo.aplicacao)
              ? 'Vinculado'
              : 'Não vinculado'}
        </Text>

        <Text style={styles.colCurta}>{ROTULO_STATUS[conteudo.status]}</Text>

        <View style={styles.colAcao}>
          <Button
            label="EDITAR"
            type="secondary"
            size="medium"
            onPress={aoEditar}
            disabled={etapa === 'trabalhando'}
            style={styles.botao}
            accessibilityLabel={`Editar ${nome}`}
          />

          {arquivado ? (
            <Button
              label="RESTAURAR"
              type="secondary"
              size="medium"
              onPress={restaurar}
              disabled={etapa === 'trabalhando'}
              style={styles.botao}
              accessibilityLabel={`Restaurar ${nome}`}
            />
          ) : (
            <Button
              label="ARQUIVAR"
              type="secondary"
              size="medium"
              onPress={perguntar}
              disabled={etapa !== 'ocioso'}
              style={styles.botao}
              accessibilityLabel={`Arquivar ${nome}`}
            />
          )}
        </View>
      </View>

      {mensagem ? <Aviso mensagem={mensagem} tom={falhou ? 'erro' : 'neutro'} /> : null}

      {etapa === 'perguntando' || etapa === 'trabalhando' ? (
        <Linha>
          <Button
            label={desmarcarDestaques ? 'ARQUIVAR E DESMARCAR' : 'CONFIRMAR ARQUIVAMENTO'}
            size="medium"
            onPress={arquivar}
            disabled={etapa === 'trabalhando'}
            style={styles.confirmacao}
            accessibilityLabel={`Confirmar arquivamento de ${nome}`}
          />

          <Button
            label="CANCELAR"
            type="secondary"
            size="medium"
            onPress={desistir}
            disabled={etapa === 'trabalhando'}
            style={styles.confirmacao}
          />
        </Linha>
      ) : null}
    </View>
  );
}

// Larguras proporcionais: a tabela do Figma é alinhada por espaços num texto só,
// o que não sobrevive a fonte variável — aqui vira colunas de verdade.
const styles = StyleSheet.create({
  busca: {
    flexGrow: 1,
    flexBasis: 420,
  },
  novo: {
    paddingHorizontal: spacing['3xl'],
    marginTop: spacing['2xl'],
  },
  alternador: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2xl'],
  },
  linhaCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  bloco: {
    gap: spacing.sm,
  },
  linhaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 48,
  },
  colTitulo: {
    flex: 3,
  },
  colCurta: {
    flex: 1,
  },
  colAcao: {
    width: 300,
    flexDirection: 'row',
    gap: spacing.md,
  },
  botao: {
    flex: 1,
  },
  confirmacao: {
    paddingHorizontal: spacing['2xl'],
  },
});
