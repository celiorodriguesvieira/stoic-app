import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/campos';
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
  MAX_FRASE_DESTAQUE,
  MAX_OPCOES_REFLEXAO,
  MIN_FRASE_DESTAQUE,
  MIN_OPCOES_REFLEXAO,
  MODOS_FONTE,
  NIVEIS,
  ITENS_DO_NIVEL,
  itensPreenchidos,
  novaOpcaoReflexao,
  paraRascunho,
  ROTULO_MODO_FONTE,
  ROTULO_NIVEL,
  type DadosDaAula,
  type EtapasDaAula,
  type EtapasPorNivel,
  type Nivel,
  type RascunhoConteudo,
} from '@/lib/admin/tipos';
import { useTheme } from '@/hooks/use-theme';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { radius, spacing } from '@/theme';

const OPCOES_MODO_FONTE = MODOS_FONTE.map((modo) => ({
  id: modo,
  nome: ROTULO_MODO_FONTE[modo],
}));

/**
 * Em que nível reabrir uma aula já começada.
 *
 * Abrir sempre no Leigo fazia um rascunho escrito em outro nível parecer
 * vazio: os campos das etapas são por nível, e a tela mostrava os do Leigo.
 * Abre no primeiro que tenha algo escrito e ainda não esteja completo, que é
 * onde o trabalho parou; sem nada escrito, no Leigo mesmo.
 */
function nivelParaAbrir(etapas: EtapasPorNivel): Nivel {
  const comecado = NIVEIS.find((cada) => {
    const feitos = itensPreenchidos(etapas[cada]);

    return feitos > 0 && feitos < ITENS_DO_NIVEL;
  });

  return comecado ?? NIVEIS.find((cada) => itensPreenchidos(etapas[cada]) === 0) ?? 'leigo';
}

type Gravacao =
  | { estado: 'ocioso' }
  | { estado: 'salvando' }
  | { estado: 'salvo'; em: number }
  | { estado: 'erro'; mensagem: string };

/**
 * Editor da aula — o Conhecimento da semana (`668:202`).
 *
 * Tem tela própria, e não uma aba dentro do editor de artigo, porque são dois
 * registros diferentes: o artigo tem um texto por nível; a aula tem quatro
 * etapas em cada um dos quatro níveis. Enfiar as duas coisas no mesmo
 * formulário deixaria metade dos campos sem sentido em cada modo.
 *
 * O que o Figma desenha e aqui não existe: "Atividade relacionada (opcional)"
 * (`670:1295`) — não há coleção de atividades no código, e um seletor vazio
 * seria pior do que a ausência. Está registrado em `docs/progresso.md`.
 */
export default function AdminEditorDeAulaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { opcoes: opcoesDeFilosofo } = useFilosofos();
  const { colors } = useTheme();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoConteudo>(() => conteudoVazio('aula'));
  const [nivel, setNivel] = useState<Nivel>('leigo');
  const [carregando, setCarregando] = useState(!criando);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [conflito, setConflito] = useState(false);
  const [tentativa, setTentativa] = useState(0);

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
          setErroDeCarga('Esta aula não existe mais.');
          return;
        }

        // Um artigo aberto por este endereço abriria com todos os campos
        // vazios e, ao salvar, gravaria por cima do texto dele. Manda para o
        // editor certo em vez de apagar trabalho alheio.
        if (conteudo.tipo !== 'aula') {
          router.replace(`/admin/conteudo/${conteudo.id}`);
          return;
        }

        // Só a primeira leitura preenche o formulário; depois disso, versão
        // nova do servidor vira aviso de conflito.
        if (!hidratado.current) {
          hidratado.current = true;
          versaoCarregada.current = conteudo.versao;
          setRascunho(paraRascunho(conteudo));
          setNivel(nivelParaAbrir(conteudo.aula.etapas));
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
  }, [idAtual, router, tentativa]);

  const alterar = useCallback(
    <C extends keyof RascunhoConteudo>(campo: C, valor: RascunhoConteudo[C]) => {
      setRascunho((atual) => ({ ...atual, [campo]: valor }));
      setGravacao({ estado: 'ocioso' });
    },
    [],
  );

  const alterarAula = useCallback(<C extends keyof DadosDaAula>(campo: C, valor: DadosDaAula[C]) => {
    setRascunho((atual) => ({ ...atual, aula: { ...atual.aula, [campo]: valor } }));
    setGravacao({ estado: 'ocioso' });
  }, []);

  /** Altera um campo das etapas do nível em edição — nunca dos outros três. */
  const alterarEtapa = useCallback(
    <C extends keyof EtapasDaAula>(campo: C, valor: EtapasDaAula[C]) => {
      setRascunho((atual) => ({
        ...atual,
        aula: {
          ...atual.aula,
          etapas: {
            ...atual.aula.etapas,
            [nivel]: { ...atual.aula.etapas[nivel], [campo]: valor },
          },
        },
      }));
      setGravacao({ estado: 'ocioso' });
    },
    [nivel],
  );

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
        router.replace(`/admin/aula/${novoId}`);

        setGravacao({ estado: 'salvo', em: Date.now() });
        return novoId;
      }

      const proxima = await salvarRascunho(idAtual, rascunho, versaoCarregada.current, user.uid);
      versaoCarregada.current = proxima;
      setConflito(false);
      setGravacao({ estado: 'salvo', em: Date.now() });
      return idAtual;
    } catch (falha) {
      // Falha NÃO limpa o formulário: o rascunho continua na tela.
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

  const etapas = rascunho.aula.etapas[nivel];


  const voltar = <BotaoVoltar rotulo="← CONTEÚDOS" aoVoltar={() => router.replace('/admin')} />;

  if (carregando) {
    return (
      <PaginaAdmin titulo="CADASTRAR CONTEÚDO DA SEMANA" topo={voltar}>
        <Carregando rotulo="Carregando a aula…" />
      </PaginaAdmin>
    );
  }

  if (erroDeCarga) {
    return (
      <PaginaAdmin titulo="CADASTRAR CONTEÚDO DA SEMANA" topo={voltar}>
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
      titulo="CADASTRAR CONTEÚDO DA SEMANA"
      apoio="Escolha o filósofo, prepare a leitura e vincule a atividade. Depois, confira a prévia e escolha a semana."
      topo={voltar}
      nota="Salvar rascunho não exibe conteúdo na Home. Após revisão sem pendências, escolha a semana e publique conteúdo + atividade. O app lê somente a publicação ativa do admin.">
      {conflito ? (
        <ErroRecuperavel
          mensagem="Esta aula mudou em outro lugar desde que você abriu. Recarregue antes de salvar, ou você vai gravar por cima do trabalho de outra pessoa."
          aoTentarDeNovo={() => {
            hidratado.current = false;
            setConflito(false);
            setErroDeCarga(null);
            setTentativa((n) => n + 1);
          }}
        />
      ) : null}

      <CaixaSecao titulo="IDENTIFICAÇÃO" espacamento="sm">
        <CampoTexto
          rotulo="Título *"
          placeholder="O que está sob seu controle?"
          value={rascunho.titulo}
          onChangeText={(valor) => alterar('titulo', valor)}
        />

        <CampoTexto
          rotulo="Frase do card *"
          placeholder="Uma pausa para escolher como agir."
          value={rascunho.aula.fraseDestaque}
          onChangeText={(valor) => alterarAula('fraseDestaque', valor)}
          maxLength={MAX_FRASE_DESTAQUE}
        />

        <CampoSelecao
          rotulo="Filósofo *"
          opcoes={opcoesDeFilosofo}
          valor={rascunho.autorId}
          aoEscolher={(valor) => alterar('autorId', valor)}
          vazio="Selecione um filósofo da biblioteca"
        />

        <Text variant="supportSemibold">
          A biblioteca de filósofos já vem cadastrada. Alguns nomes já têm retrato. Ao selecionar,
          o card usa o nome e a imagem disponíveis; sem imagem, exibe a inicial. Não há upload de
          fotos.
        </Text>

        <Linha>
          <View style={styles.metade}>
            {/* A tela pede um tema só; o modelo continua guardando lista. */}
            <CampoSelecao
              rotulo="Tema *"
              opcoes={TEMAS}
              valor={rascunho.temaIds[0] ?? ''}
              aoEscolher={(valor) => alterar('temaIds', valor ? [valor] : [])}
              vazio="Selecione um tema"
            />
          </View>

          <View style={styles.metade}>
            <CampoTexto
              rotulo="Duração estimada (minutos) *"
              placeholder="3"
              keyboardType="number-pad"
              // Zero significa "em branco": assim o campo pode ser apagado sem
              // mostrar um "0" que ninguém digitou, e a pendência acusa a falta.
              value={rascunho.aula.duracaoMinutos > 0 ? String(rascunho.aula.duracaoMinutos) : ''}
              onChangeText={(valor) =>
                alterarAula('duracaoMinutos', Number(valor.replace(/\D/g, '')) || 0)
              }
            />
          </View>
        </Linha>

        <Text variant="supportSemibold">
          Escreva uma frase de {MIN_FRASE_DESTAQUE} a {MAX_FRASE_DESTAQUE} caracteres. Ela aparece
          no card da Home, junto com o filósofo e a duração. O fundo é sempre o mesmo.
        </Text>
      </CaixaSecao>

      <CaixaSecao titulo="NÍVEL DE LEITURA" espacamento="sm">
        <Text variant="supportSemibold">Versão em edição *</Text>

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

        <Text variant="supportSemibold">Situação das versões</Text>

        {/*
          Quatro blocos lado a lado, e não quatro linhas empilhadas: são textos
          curtos, e o painel tem largura de sobra. Assim a situação das quatro
          versões se lê de uma vez.

          A contagem substitui o "pendente" do desenho, que tratava igual o
          nível intocado e aquele a que falta um campo. O vermelho da paleta
          marca o que ainda bloqueia a publicação.
        */}
        <View style={styles.situacao}>
          {NIVEIS.map((cada) => {
            const feitos = itensPreenchidos(rascunho.aula.etapas[cada]);
            const completa = feitos === ITENS_DO_NIVEL;

            return (
              <View
                key={cada}
                style={[
                  styles.blocoNivel,
                  {
                    borderColor: cada === nivel ? colors.accent : colors.border,
                    backgroundColor: cada === nivel ? colors.selected : 'transparent',
                  },
                ]}>
                <Text variant="labelMetadata" color="textSecondary">
                  {ROTULO_NIVEL[cada].toLocaleUpperCase('pt-BR')}
                </Text>

                <Text
                  variant="bodyMedium"
                  color={completa ? 'textAccent' : 'error'}
                  accessibilityLabel={
                    completa
                      ? `${ROTULO_NIVEL[cada]}, versão completa`
                      : `${ROTULO_NIVEL[cada]}, ${feitos} de ${ITENS_DO_NIVEL} itens preenchidos`
                  }>
                  {completa ? 'Completa' : `${feitos} de ${ITENS_DO_NIVEL}`}
                </Text>
              </View>
            );
          })}
        </View>

      </CaixaSecao>

      <CaixaSecao titulo="CONTEÚDO" apoio="Etapa 1 de 4" espacamento="sm">
        <CampoTexto
          rotulo="Introdução e ideia central *"
          placeholder="Explique a ideia em linguagem adequada ao nível selecionado."
          value={etapas.introducao}
          onChangeText={(valor) => alterarEtapa('introducao', valor)}
          linhas={4}
        />

        <CampoSelecao
          rotulo="Tipo de texto *"
          opcoes={OPCOES_MODO_FONTE}
          valor={etapas.modoFonte}
          aoEscolher={(valor) => alterarEtapa('modoFonte', valor as EtapasDaAula['modoFonte'])}
        />

        <CampoTexto
          rotulo="Explicação da ideia *"
          placeholder="Desenvolva a ideia central e sua relação com a vida cotidiana."
          value={etapas.explicacao}
          onChangeText={(valor) => alterarEtapa('explicacao', valor)}
          linhas={5}
        />

        <CampoTexto
          rotulo="Referência da fonte *"
          placeholder="Obra, edição e localização da passagem"
          value={etapas.fonte}
          onChangeText={(valor) => alterarEtapa('fonte', valor)}
        />
      </CaixaSecao>

      <CaixaSecao titulo="REFLEXÃO" apoio="Etapa 2 de 4" espacamento="sm">
        <CampoTexto
          rotulo="Pergunta *"
          placeholder="O que depende de você nessa situação?"
          value={etapas.pergunta}
          onChangeText={(valor) => alterarEtapa('pergunta', valor)}
        />

        <Opcoes
          opcoes={etapas.opcoes}
          aoMudar={(opcoes) => alterarEtapa('opcoes', opcoes)}
        />

        <Text variant="supportSemibold">
          A reflexão não atribui nota. No aplicativo, a pessoa escolhe uma alternativa.
        </Text>

        {/*
          O campo de orientação saiu do desenho em 16/09 e por isso saiu da
          tela. `EtapasDaAula.orientacao` continua no modelo, gravando o que já
          foi escrito, para que a remoção visual não apague dado de ninguém.
        */}
      </CaixaSecao>

      <CaixaSecao titulo="APLICAÇÃO" apoio="Etapa 3 de 4" espacamento="sm">
        <CampoTexto
          rotulo="Prática e compromisso *"
          placeholder="Antes de responder a uma mensagem difícil, pare e escolha suas palavras."
          value={etapas.pratica}
          onChangeText={(valor) => alterarEtapa('pratica', valor)}
          linhas={4}
        />

        {/*
          O campo é do desenho e o contrato o torna obrigatório, mas não existe
          coleção de atividades para alimentá-lo. Fica desabilitado, com o texto
          do próprio Figma: o estado diz o que precisa ser dito, sem explicação
          escrita por fora. Vira obrigatório na validação quando a coleção
          existir.
        */}
        <CampoSelecao
          rotulo="Atividade da semana *"
          opcoes={[]}
          valor=""
          aoEscolher={() => {}}
          vazio="Selecione uma atividade publicada"
        />

        <Text variant="supportSemibold">
          Esta atividade acompanha o conteúdo da semana. O botão “Atividade da semana” abre o
          exercício vinculado. Golpes digitais é um exemplo desse formato.
        </Text>
      </CaixaSecao>

      <CaixaSecao titulo="CONCLUSÃO" apoio="Etapa 4 de 4" espacamento="sm">
        <CampoTexto
          rotulo="Síntese da experiência *"
          placeholder="Explique o que a pessoa acabou de praticar."
          value={etapas.sintese}
          onChangeText={(valor) => alterarEtapa('sintese', valor)}
          linhas={3}
        />

        <CampoTexto
          rotulo="Leve com você *"
          placeholder="Eu não controlo tudo. Mas posso escolher minha próxima atitude."
          value={etapas.leveComVoce}
          onChangeText={(valor) => alterarEtapa('leveComVoce', valor)}
          linhas={2}
        />
      </CaixaSecao>

      {gravacao.estado === 'erro' ? <Aviso mensagem={gravacao.mensagem} tom="erro" /> : null}
      {gravacao.estado === 'salvo' ? <Aviso mensagem="Rascunho salvo." /> : null}

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
          label="REVISAR PUBLICAÇÃO"
          size="medium"
          // Sempre disponível: quem lista as pendências e bloqueia o botão de
          // publicar é a tela de revisão (`673:1249`, "Publicação bloqueada").
          // Travar o caminho aqui deixava a pessoa sem ver o que falta.
          disabled={gravacao.estado === 'salvando'}
          onPress={irParaRevisao}
          style={styles.acao}
        />
      </Linha>
    </PaginaAdmin>
  );
}

/**
 * As alternativas da reflexão, de 2 a 6 (`670:1287`).
 *
 * Remover mexe na lista pelo `id`, nunca pelo índice: é o id que a resposta da
 * pessoa guarda, e apagar por posição trocaria o texto de quem ficou.
 */
/** Exemplos do `670:1287`, para cada opção sugerir uma coisa diferente. */
const EXEMPLOS_DE_OPCAO = [
  'Minha atitude',
  'A resposta de outra pessoa',
  'O resultado final',
];

function Opcoes({
  opcoes,
  aoMudar,
}: {
  opcoes: readonly { id: string; texto: string }[];
  aoMudar: (opcoes: { id: string; texto: string }[]) => void;
}) {
  return (
    <View style={styles.opcoes}>
      {opcoes.map((opcao, indice) => (
        <Linha key={opcao.id}>
          <View style={styles.campoOpcao}>
            <CampoTexto
              rotulo={`Alternativa ${indice + 1}${indice < MIN_OPCOES_REFLEXAO ? ' *' : ''}`}
              placeholder={EXEMPLOS_DE_OPCAO[indice % EXEMPLOS_DE_OPCAO.length]}
              value={opcao.texto}
              onChangeText={(valor) =>
                aoMudar(opcoes.map((atual) => (atual.id === opcao.id ? { ...atual, texto: valor } : atual)))
              }
            />
          </View>

          <Button
            label="REMOVER"
            type="secondary"
            size="medium"
            accessibilityLabel={`Remover a alternativa ${indice + 1}`}
            disabled={opcoes.length <= MIN_OPCOES_REFLEXAO}
            onPress={() => aoMudar(opcoes.filter((atual) => atual.id !== opcao.id))}
            style={styles.remover}
          />
        </Linha>
      ))}

      <Button
        label="ADICIONAR ALTERNATIVA"
        type="secondary"
        size="medium"
        disabled={opcoes.length >= MAX_OPCOES_REFLEXAO}
        onPress={() => aoMudar([...opcoes, novaOpcaoReflexao()])}
        style={styles.adicionar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  metade: {
    flexGrow: 1,
    flexBasis: 320,
  },
  situacao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  blocoNivel: {
    flexGrow: 1,
    flexBasis: 160,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  pilulaNivel: {
    flexGrow: 1,
    flexBasis: 180,
  },
  opcoes: {
    gap: spacing.sm,
  },
  campoOpcao: {
    flexGrow: 1,
    flexBasis: 420,
  },
  remover: {
    alignSelf: 'flex-end',
  },
  adicionar: {
    alignSelf: 'flex-start',
  },
  acao: {
    flexGrow: 1,
    flexBasis: 240,
  },
});
