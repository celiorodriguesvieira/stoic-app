import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoMultiSelecao, CampoSelecao, CampoTexto } from '@/components/admin/campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/estados';
import { BotaoVoltar } from '@/components/admin/navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/pagina';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TEMAS } from '@/lib/admin/acervo';
import {
  criarConteudo,
  ErroDeConflito,
  observarConteudo,
  salvarRascunho,
} from '@/lib/admin/repositorio';
import {
  conteudoVazio,
  FORMATOS,
  NIVEIS,
  paraRascunho,
  pendenciasParaPublicar,
  ROTULO_FORMATO,
  ROTULO_NIVEL,
  ROTULO_STATUS,
  type Nivel,
  type RascunhoConteudo,
  type StatusConteudo,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

const OPCOES_FORMATO = FORMATOS.map((formato) => ({
  id: formato,
  nome: ROTULO_FORMATO[formato],
}));

type Gravacao =
  | { estado: 'ocioso' }
  | { estado: 'salvando' }
  | { estado: 'salvo'; em: number }
  | { estado: 'erro'; mensagem: string };

export default function AdminEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { opcoes: opcoesDeFilosofo } = useFilosofos();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoConteudo>(conteudoVazio);
  const [nivel, setNivel] = useState<Nivel>('leigo');
  const [status, setStatus] = useState<StatusConteudo>('rascunho');
  const [carregando, setCarregando] = useState(!criando);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [conflito, setConflito] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  /** Versão do documento que este formulário carregou. Guia a trava de conflito. */
  const versaoCarregada = useRef(0);
  const hidratado = useRef(false);
  const [idAtual, setIdAtual] = useState(criando ? null : id);

  useEffect(() => {
    if (!idAtual) return;

    return observarConteudo(
      idAtual,
      (conteudo) => {
        setCarregando(false);

        if (!conteudo) {
          setErroDeCarga('Este conteúdo não existe mais.');
          return;
        }

        // Só a primeira leitura preenche o formulário. Depois disso, uma versão
        // nova vinda do servidor vira aviso de conflito — nunca sobrescreve o
        // que a pessoa está digitando.
        if (!hidratado.current) {
          hidratado.current = true;
          versaoCarregada.current = conteudo.versao;
          setRascunho(paraRascunho(conteudo));
          setStatus(conteudo.status);
          return;
        }

        if (conteudo.versao !== versaoCarregada.current) {
          setConflito(true);
        }
      },
      (falha) => {
        setCarregando(false);
        setErroDeCarga(falha.message);
      },
    );
  }, [idAtual, tentativa]);

  const alterar = useCallback(
    <C extends keyof RascunhoConteudo>(campo: C, valor: RascunhoConteudo[C]) => {
      setRascunho((atual) => ({ ...atual, [campo]: valor }));
      setGravacao({ estado: 'ocioso' });
    },
    [],
  );

  function alterarTexto(valor: string) {
    setRascunho((atual) => ({ ...atual, textos: { ...atual.textos, [nivel]: valor } }));
    setGravacao({ estado: 'ocioso' });
  }

  function alterarAplicacao(valor: string) {
    setRascunho((atual) => ({
      ...atual,
      aplicacao: { ...atual.aplicacao, textos: { ...atual.aplicacao.textos, [nivel]: valor } },
    }));
    setGravacao({ estado: 'ocioso' });
  }

  /** Grava e devolve o id — necessário porque pré-visualizar exige documento salvo. */
  async function gravar(): Promise<string | null> {
    if (gravacao.estado === 'salvando') return null;
    if (!user) {
      setGravacao({ estado: 'erro', mensagem: 'Sessão expirada. Entre de novo.' });
      return null;
    }

    setGravacao({ estado: 'salvando' });

    try {
      if (!idAtual) {
        const novoId = await criarConteudo(rascunho, user.uid);
        versaoCarregada.current = 1;
        hidratado.current = true;
        setIdAtual(novoId);

        // O endereço passa a ser o do documento recém-criado.
        //
        // Sem isto a URL continuava `/novo` depois de gravar: recarregar a
        // página abria um formulário em branco, o rascunho ficava no banco sem
        // ninguém saber o id, e o próximo salvamento criava **outro**
        // documento. `replace` e não `push` para o botão voltar do navegador
        // não devolver ao formulário vazio.
        router.replace(`/admin/conteudo/${novoId}`);

        setGravacao({ estado: 'salvo', em: Date.now() });
        return novoId;
      }

      const proxima = await salvarRascunho(idAtual, rascunho, versaoCarregada.current, user.uid);
      versaoCarregada.current = proxima;
      setConflito(false);
      setGravacao({ estado: 'salvo', em: Date.now() });
      return idAtual;
    } catch (falha) {
      // Falha NÃO limpa o formulário: o rascunho continua na tela para nova tentativa.
      setGravacao({
        estado: 'erro',
        mensagem:
          falha instanceof ErroDeConflito
            ? falha.message
            : falha instanceof Error
              ? falha.message
              : 'Não foi possível salvar.',
      });
      return null;
    }
  }

  async function irParaRevisao() {
    const salvo = await gravar();
    if (salvo) router.push(`/admin/revisar/${salvo}`);
  }

  const pendencias = pendenciasParaPublicar(rascunho);

  if (carregando) {
    return (
      <PaginaAdmin titulo="EDITAR CONTEÚDO" topo={<BotaoVoltar rotulo="← CONTEÚDOS" aoVoltar={() => router.replace('/admin')} />}>
        <Carregando rotulo="Carregando o conteúdo…" />
      </PaginaAdmin>
    );
  }

  if (erroDeCarga) {
    return (
      <PaginaAdmin titulo="EDITAR CONTEÚDO" topo={<BotaoVoltar rotulo="← CONTEÚDOS" aoVoltar={() => router.replace('/admin')} />}>
        <ErroRecuperavel
          mensagem={erroDeCarga}
          aoTentarDeNovo={() => {
            setErroDeCarga(null);
            setTentativa((n) => n + 1);
          }}
        />
      </PaginaAdmin>
    );
  }

  return (
    <PaginaAdmin
      titulo="CADASTRAR CONTEÚDO / EXPLORAR"
      apoio={rascunho.titulo || ROTULO_STATUS[status]}
      topo={<BotaoVoltar rotulo="← CONTEÚDOS" aoVoltar={() => router.replace('/admin')} />}>
      {conflito ? (
        <ErroRecuperavel
          mensagem="Este conteúdo mudou em outro lugar desde que você abriu. Recarregue antes de salvar, ou você vai gravar por cima do trabalho de outra pessoa."
          aoTentarDeNovo={() => {
            hidratado.current = false;
            setConflito(false);
            setErroDeCarga(null);
            setTentativa((n) => n + 1);
          }}
        />
      ) : null}

      <CaixaSecao titulo="INFORMAÇÕES GERAIS" espacamento="sm">
        <CampoTexto
          rotulo="Título"
          placeholder="O tempo que é seu"
          value={rascunho.titulo}
          onChangeText={(valor) => alterar('titulo', valor)}
        />

        <Linha>
          <View style={styles.metade}>
            <CampoSelecao
              rotulo="Filósofo"
              opcoes={opcoesDeFilosofo}
              valor={rascunho.autorId}
              aoEscolher={(valor) => alterar('autorId', valor)}
              vazio="Escolher filósofo"
            />
          </View>

          <View style={styles.metade}>
            <CampoSelecao
              rotulo="Formato"
              opcoes={OPCOES_FORMATO}
              valor={rascunho.formato}
              aoEscolher={(valor) => alterar('formato', valor as RascunhoConteudo['formato'])}
            />
          </View>
        </Linha>

        <CampoMultiSelecao
          rotulo="Temas"
          opcoes={TEMAS}
          valores={rascunho.temaIds}
          aoAlternar={(temaId) =>
            alterar(
              'temaIds',
              rascunho.temaIds.includes(temaId)
                ? rascunho.temaIds.filter((atual) => atual !== temaId)
                : [...rascunho.temaIds, temaId],
            )
          }
        />

        <CampoTexto
          rotulo="Fonte e referência"
          placeholder="Sobre a brevidade da vida, capítulos 1 e 3"
          value={rascunho.fonte}
          onChangeText={(valor) => alterar('fonte', valor)}
        />
      </CaixaSecao>

      <View style={styles.secaoNiveis}>
        <Text variant="supportSemibold">
          TEXTO POR NÍVEL
        </Text>

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
      </View>

      <CampoTexto
        rotulo={`Texto do nível ${ROTULO_NIVEL[nivel]}`}
        placeholder="Escreva a versão deste nível…"
        value={rascunho.textos[nivel]}
        onChangeText={alterarTexto}
        linhas={5}
      />

      <CaixaSecao
        titulo="FILOSOFIA NO COTIDIANO"
        apoio="Aplicação vinculada a este conteúdo, exibida em dois caminhos sem cópia.">
        <CampoTexto
          rotulo="Título da aplicação"
          placeholder="Seu dia passa e o que importa fica para depois?"
          value={rascunho.aplicacao.titulo}
          onChangeText={(valor) =>
            alterar('aplicacao', { ...rascunho.aplicacao, titulo: valor })
          }
        />

        <CampoTexto
          rotulo={`Aplicação prática do nível ${ROTULO_NIVEL[nivel]}`}
          placeholder="Que pequeno passo cabe no dia de hoje?"
          value={rascunho.aplicacao.textos[nivel]}
          onChangeText={alterarAplicacao}
          linhas={4}
        />

        <Text variant="supportSemibold">
          Publicada junto do conteúdo e listada também em Filosofia no Cotidiano. As versões
          acompanham os quatro níveis.
        </Text>
      </CaixaSecao>

      {gravacao.estado === 'erro' ? <Aviso mensagem={gravacao.mensagem} tom="erro" /> : null}
      {gravacao.estado === 'salvo' ? <Aviso mensagem="Rascunho salvo." /> : null}
      {pendencias.length > 0 ? (
        <Aviso mensagem={`Falta para publicar: ${pendencias.join(' ')}`} />
      ) : null}

      <Linha>
        <Button
          label={gravacao.estado === 'salvando' ? 'Salvando…' : 'SALVAR RASCUNHO'}
          type="secondary"
          size="medium"
          disabled={gravacao.estado === 'salvando'}
          onPress={gravar}
          style={styles.acao}
        />

        <Button
          label="PRÉ-VISUALIZAR"
          type="secondary"
          size="medium"
          disabled={gravacao.estado === 'salvando'}
          onPress={irParaRevisao}
          style={styles.acao}
        />

        <Button
          label="REVISAR PUBLICAÇÃO"
          size="medium"
          // A publicação em si acontece na revisão; aqui só bloqueia o caminho
          // quando falta versão obrigatória (nó `600:76`).
          disabled={gravacao.estado === 'salvando' || pendencias.length > 0}
          onPress={irParaRevisao}
          style={styles.acao}
        />
      </Linha>
    </PaginaAdmin>
  );
}

const styles = StyleSheet.create({
  metade: {
    flexGrow: 1,
    flexBasis: 320,
  },
  secaoNiveis: {
    gap: spacing.sm,
  },
  pilulaNivel: {
    flexGrow: 1,
    flexBasis: 180,
  },
  acao: {
    flexGrow: 1,
    flexBasis: 240,
  },
});
