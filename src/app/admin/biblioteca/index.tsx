import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/Estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  arquivarRecurso,
  mensagemDeErro,
  observarRecursos,
  restaurarRecurso,
} from '@/lib/admin/repositorio';
import {
  ROTULO_STATUS,
  ROTULO_TIPO_RECURSO,
  type RecursoBiblioteca,
  type TipoRecurso,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/** Os mesmos filtros da Biblioteca do app: Todos, Vídeos, Livros (`668:156`). */
const FILTROS: { id: TipoRecurso | 'todos'; rotulo: string }[] = [
  { id: 'todos', rotulo: 'TODOS' },
  { id: 'video', rotulo: 'VÍDEOS' },
  { id: 'livro', rotulo: 'LIVROS' },
];

/**
 * Catálogo da Biblioteca no painel.
 *
 * O Figma desenha os dois formulários (`668:203`, `779:143`), mas não uma
 * lista — e sem ela não há como reabrir um recurso para corrigir, publicar ou
 * arquivar. Esta tela segue a do acervo de conteúdos, e os textos que o Figma
 * não escreve estão listados em `TEXTOS_SEM_FONTE`.
 */
export default function AdminBibliotecaScreen() {
  const router = useRouter();

  const [recursos, setRecursos] = useState<RecursoBiblioteca[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [filtro, setFiltro] = useState<TipoRecurso | 'todos'>('todos');
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  useEffect(
    () => observarRecursos(setRecursos, (falha) => setErro(falha.message)),
    [tentativa],
  );

  const arquivados = useMemo(
    () => (recursos ?? []).filter((recurso) => recurso.status === 'arquivado').length,
    [recursos],
  );

  const filtrados = useMemo(
    () =>
      (recursos ?? []).filter(
        (recurso) =>
          (filtro === 'todos' || recurso.tipo === filtro) &&
          (mostrarArquivados || recurso.status !== 'arquivado'),
      ),
    [recursos, filtro, mostrarArquivados],
  );

  return (
    <PaginaAdmin
      titulo="BIBLIOTECA"
      apoio="Vídeos do YouTube e livros recomendados."
      topo={<EtiquetaAdmin />}>
      <NavegacaoAdmin atual="biblioteca" />

      <Linha>
        <Button
          label="CADASTRAR VÍDEO"
          size="medium"
          onPress={() => router.push('/admin/biblioteca/novo?tipo=video')}
          style={styles.novo}
        />

        <Button
          label="CADASTRAR LIVRO"
          type="secondary"
          size="medium"
          onPress={() => router.push('/admin/biblioteca/novo?tipo=livro')}
          style={styles.novo}
        />
      </Linha>

      <Linha>
        {FILTROS.map((cada) => (
          <Button
            key={cada.id}
            label={cada.rotulo}
            size="medium"
            type={cada.id === filtro ? 'primary' : 'secondary'}
            onPress={() => setFiltro(cada.id)}
            style={styles.filtro}
            accessibilityState={{ selected: cada.id === filtro }}
          />
        ))}

        {arquivados > 0 ? (
          <Button
            label={mostrarArquivados ? 'OCULTAR ARQUIVADOS' : `MOSTRAR ARQUIVADOS (${arquivados})`}
            type="secondary"
            size="medium"
            onPress={() => setMostrarArquivados((visivel) => !visivel)}
            style={styles.filtro}
          />
        ) : null}
      </Linha>

      <CaixaSecao>
        <View style={styles.linha}>
          <Text variant="supportSemibold" style={styles.colTitulo}>
            TÍTULO / CRIADOR
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            TIPO
          </Text>
          <Text variant="supportSemibold" style={styles.colCurta}>
            STATUS
          </Text>
          <View style={styles.colAcao} />
        </View>

        {erro ? (
          <ErroRecuperavel
            mensagem={erro}
            aoTentarDeNovo={() => {
              setErro(null);
              setTentativa((n) => n + 1);
            }}
          />
        ) : recursos === null ? (
          <Carregando rotulo="Carregando a Biblioteca…" />
        ) : filtrados.length === 0 ? (
          <Vazio titulo="Nenhum recurso nesta lista." />
        ) : (
          filtrados.map((recurso) => (
            <LinhaRecurso
              key={recurso.id}
              recurso={recurso}
              aoEditar={() => router.push(`/admin/biblioteca/${recurso.id}`)}
            />
          ))
        )}
      </CaixaSecao>
    </PaginaAdmin>
  );
}

type Etapa = 'ocioso' | 'perguntando' | 'trabalhando';

/** Linha com editar, arquivar (com confirmação) e restaurar — como no acervo. */
function LinhaRecurso({
  recurso,
  aoEditar,
}: {
  recurso: RecursoBiblioteca;
  aoEditar: () => void;
}) {
  const { user } = useAuth();

  const [etapa, setEtapa] = useState<Etapa>('ocioso');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  const nome = recurso.titulo || 'recurso sem título';
  const arquivado = recurso.status === 'arquivado';

  function perguntar() {
    setEtapa('perguntando');
    setFalhou(false);
    setMensagem('Some do catálogo e do app. Dá para restaurar depois.');
  }

  function desistir() {
    setEtapa('ocioso');
    setMensagem(null);
    setFalhou(false);
  }

  async function arquivar() {
    if (!user) return;

    setEtapa('trabalhando');

    try {
      await arquivarRecurso(recurso.id, recurso.versao, user.uid);
      // A lista vem de `onSnapshot`: a linha some sozinha.
      setEtapa('ocioso');
      setMensagem(null);
    } catch (falha) {
      setEtapa('perguntando');
      setMensagem(mensagemDeErro(falha, 'Não foi possível arquivar.'));
      setFalhou(true);
    }
  }

  async function restaurar() {
    if (!user) return;

    setEtapa('trabalhando');
    setFalhou(false);

    try {
      const destino = await restaurarRecurso(recurso.id, recurso.versao, user.uid);
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
      <View style={styles.linha}>
        <Text style={styles.colTitulo}>
          {recurso.titulo || 'Sem título'}
          {'\n'}
          {recurso.criador}
        </Text>

        <Text style={styles.colCurta}>{ROTULO_TIPO_RECURSO[recurso.tipo]}</Text>

        <Text style={styles.colCurta}>{ROTULO_STATUS[recurso.status]}</Text>

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

      {etapa !== 'ocioso' && !arquivado ? (
        <Linha>
          <Button
            label="CONFIRMAR ARQUIVAMENTO"
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

const styles = StyleSheet.create({
  novo: {
    paddingHorizontal: spacing['3xl'],
  },
  filtro: {
    paddingHorizontal: spacing['2xl'],
  },
  bloco: {
    gap: spacing.sm,
  },
  linha: {
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
