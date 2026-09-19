import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel, Vazio } from '@/components/admin/Estados';
import { EtiquetaAdmin, NavegacaoAdmin } from '@/components/admin/Navegacao';
import { Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import {
  arquivarAtividade,
  mensagemDeErro,
  observarAtividades,
  restaurarAtividade,
} from '@/lib/admin/repositorio';
import {
  ROTULO_STATUS,
  ROTULO_TIPO_ATIVIDADE,
  resumoDaAtividade,
  TIPOS_ATIVIDADE,
  type Atividade,
  type StatusConteudo,
  type TipoAtividade,
} from '@/lib/admin/tipos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/** "Todos os tipos ▾ • Todos os status ▾" (`643:1270`). */
const OPCOES_TIPO = [
  { id: 'todos', nome: 'Todos os tipos' },
  ...TIPOS_ATIVIDADE.map((tipo) => ({ id: tipo, nome: ROTULO_TIPO_ATIVIDADE[tipo] })),
];

const STATUS: StatusConteudo[] = ['rascunho', 'publicado', 'arquivado'];

const OPCOES_STATUS = [
  { id: 'todos', nome: 'Todos os status' },
  ...STATUS.map((status) => ({ id: status, nome: ROTULO_STATUS[status] })),
];

function semAcento(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR');
}

/** Catálogo de atividades no painel (`643:1270`). */
export default function AdminAtividadesScreen() {
  const router = useRouter();

  const [atividades, setAtividades] = useState<Atividade[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoAtividade | 'todos'>('todos');
  const [status, setStatus] = useState<StatusConteudo | 'todos'>('todos');

  useEffect(
    () => observarAtividades(setAtividades, (falha) => setErro(falha.message)),
    [tentativa],
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());

    return (atividades ?? []).filter(
      (atividade) =>
        (tipo === 'todos' || atividade.tipo === tipo) &&
        (status === 'todos' || atividade.status === status) &&
        (!termo || semAcento(atividade.titulo).includes(termo)),
    );
  }, [atividades, busca, tipo, status]);

  return (
    <PaginaAdmin
      titulo="ATIVIDADES"
      apoio="Crie práticas curtas e revise antes de publicar no app."
      topo={<EtiquetaAdmin />}
      nota="Apenas atividades publicadas aparecem no app. Arquivar retira do catálogo e preserva o histórico.">
      <NavegacaoAdmin atual="atividades" />

      <Button
        label="NOVA ATIVIDADE"
        size="medium"
        onPress={() => router.push('/admin/atividades/novo')}
        style={styles.nova}
      />

      <Linha>
        <View style={styles.busca}>
          <CampoTexto
            rotulo="Buscar / filtrar"
            placeholder="Buscar título…"
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
          />
        </View>

        <View style={styles.filtro}>
          <CampoSelecao
            rotulo="Tipo"
            opcoes={OPCOES_TIPO}
            valor={tipo}
            aoEscolher={(valor) => setTipo(valor as TipoAtividade | 'todos')}
          />
        </View>

        <View style={styles.filtro}>
          <CampoSelecao
            rotulo="Status"
            opcoes={OPCOES_STATUS}
            valor={status}
            aoEscolher={(valor) => setStatus(valor as StatusConteudo | 'todos')}
          />
        </View>
      </Linha>

      {erro ? (
        <ErroRecuperavel
          mensagem={erro}
          aoTentarDeNovo={() => {
            setErro(null);
            setTentativa((n) => n + 1);
          }}
        />
      ) : atividades === null ? (
        <Carregando rotulo="Carregando as atividades…" />
      ) : filtradas.length === 0 ? (
        <Vazio titulo="Nenhuma atividade nesta lista." />
      ) : (
        <View style={styles.lista}>
          {filtradas.map((atividade) => (
            <LinhaAtividade
              key={atividade.id}
              atividade={atividade}
              aoEditar={() => router.push(`/admin/atividades/${atividade.id}`)}
            />
          ))}
        </View>
      )}
    </PaginaAdmin>
  );
}

type Etapa = 'ocioso' | 'perguntando' | 'trabalhando';

/**
 * Linha do `643:1270`: título, "Reflexão • 3 min • Rascunho" e EDITAR. Arquivar
 * e restaurar seguem a lista da Biblioteca, com confirmação antes de arquivar.
 */
function LinhaAtividade({ atividade, aoEditar }: { atividade: Atividade; aoEditar: () => void }) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [etapa, setEtapa] = useState<Etapa>('ocioso');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);

  const nome = atividade.titulo || 'atividade sem título';
  const arquivada = atividade.status === 'arquivado';

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
      await arquivarAtividade(atividade.id, atividade.versao, user.uid);
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
      const destino = await restaurarAtividade(atividade.id, atividade.versao, user.uid);
      setEtapa('ocioso');
      setMensagem(`Restaurada como ${ROTULO_STATUS[destino].toLocaleLowerCase('pt-BR')}.`);
    } catch (falha) {
      setEtapa('ocioso');
      setMensagem(mensagemDeErro(falha, 'Não foi possível restaurar.'));
      setFalhou(true);
    }
  }

  return (
    <View style={[styles.cartao, { backgroundColor: colors.canvas }]}>
      <View style={styles.linha}>
        <View style={styles.texto}>
          <Text>{atividade.titulo || 'Sem título'}</Text>
          <Text>
            {resumoDaAtividade(atividade)} • {ROTULO_STATUS[atividade.status]}
          </Text>
        </View>

        <View style={styles.acoes}>
          <Button
            label="EDITAR"
            type="secondary"
            size="medium"
            onPress={aoEditar}
            disabled={etapa === 'trabalhando'}
            style={styles.botao}
            accessibilityLabel={`Editar ${nome}`}
          />

          {arquivada ? (
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

      {etapa !== 'ocioso' && !arquivada ? (
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

// Larguras do Figma: 280 para NOVA ATIVIDADE e 240 para EDITAR.
const styles = StyleSheet.create({
  nova: {
    alignSelf: 'flex-start',
    width: 280,
    maxWidth: '100%',
  },
  busca: {
    flexGrow: 2,
    flexBasis: 320,
  },
  filtro: {
    flexGrow: 1,
    flexBasis: 200,
  },
  lista: {
    gap: spacing.lg,
  },
  cartao: {
    padding: spacing['2xl'],
    gap: spacing.sm,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.lg,
  },
  texto: {
    flexGrow: 1,
    flexBasis: 320,
  },
  acoes: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  botao: {
    width: 160,
  },
  confirmacao: {
    paddingHorizontal: spacing['2xl'],
  },
});
