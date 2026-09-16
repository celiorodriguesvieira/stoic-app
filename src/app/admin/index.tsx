import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoTexto } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { nomesDosTemas } from '@/lib/admin/acervo';
import {
  arquivarConteudo,
  ErroPedeConfirmacao,
  observarConteudos,
  restaurarConteudo,
} from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  NIVEIS,
  niveisPreenchidos,
  ROTULO_STATUS,
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
      titulo="CONTEÚDOS"
      apoio="Um cadastro. Todos os caminhos do PAUSA."
      topo={<EtiquetaAdmin />}
      nota="O mesmo formulário é usado para criar e editar. Arquivar tira do app sem apagar o registro.">
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
          label="NOVO CONTEÚDO"
          size="medium"
          onPress={() => router.push('/admin/conteudo/novo')}
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
            apoio="Comece por “Novo conteúdo”."
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
              aoEditar={() => router.push(`/admin/conteudo/${conteudo.id}`)}
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
      const erro = falha instanceof Error ? falha : new Error('Não foi possível arquivar.');

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
      setMensagem(falha instanceof Error ? falha.message : 'Não foi possível restaurar.');
      setFalhou(true);
    }
  }

  return (
    <View style={styles.bloco}>
      <View style={styles.linhaConteudo}>
        <Text style={styles.colTitulo}>
          {conteudo.titulo || 'Sem título'} · {autor}
        </Text>

        <Text style={styles.colCurta}>
          {niveisPreenchidos(conteudo.textos).length} de {NIVEIS.length}
        </Text>

        <Text style={styles.colCurta}>
          {aplicacaoVinculada(conteudo.aplicacao) ? 'Vinculado' : 'Não vinculado'}
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
