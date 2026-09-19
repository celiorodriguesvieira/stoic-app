import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CampoSelecao, CampoTexto } from '@/components/admin/Campos';
import { Aviso, Carregando, ErroRecuperavel } from '@/components/admin/Estados';
import { BotaoVoltar } from '@/components/admin/Navegacao';
import { CaixaSecao, Linha, PaginaAdmin } from '@/components/admin/Pagina';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TEMAS } from '@/lib/admin/acervo';
import {
  criarAtividade,
  mensagemDeErro,
  observarAtividade,
  observarConteudos,
  salvarAtividade,
} from '@/lib/admin/repositorio';
import {
  atividadeVazia,
  DEVOLUTIVAS_LIVRES,
  errosDaAtividade,
  MAX_ALTERNATIVAS,
  MAX_BLOCOS,
  mensagemSimuladaVazia,
  MIN_ALTERNATIVAS,
  MIN_BLOCOS,
  MODOS_RESPOSTA,
  novaAlternativa,
  novoBloco,
  paraRascunhoDeAtividade,
  ROTULO_DEVOLUTIVA_LIVRE,
  ROTULO_MODO_RESPOSTA,
  ROTULO_STATUS,
  ROTULO_TIPO_ATIVIDADE,
  TIPOS_ATIVIDADE,
  type AlternativaAtividade,
  type BlocoOrdenacao,
  type Conteudo,
  type DevolutivaLivre,
  type DinamicaEscolha,
  type DinamicaOrdenacao,
  type MensagemSimulada,
  type ModoResposta,
  type RascunhoAtividade,
  type StatusConteudo,
  type TipoAtividade,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

const OPCOES_TIPO = TIPOS_ATIVIDADE.map((tipo) => ({ id: tipo, nome: ROTULO_TIPO_ATIVIDADE[tipo] }));
const OPCOES_MODO = MODOS_RESPOSTA.map((modo) => ({ id: modo, nome: ROTULO_MODO_RESPOSTA[modo] }));
const OPCOES_DEVOLUTIVA = DEVOLUTIVAS_LIVRES.map((cada) => ({
  id: cada,
  nome: ROTULO_DEVOLUTIVA_LIVRE[cada],
}));

/** Vínculos opcionais: vazio é uma escolha, não um campo esquecido. */
const NENHUM = { id: '', nome: 'Nenhum' };

/** Blocos são identificados por letra, como no `644:104` ("A. Minha próxima atitude"). */
function letra(indice: number): string {
  return String.fromCharCode(65 + indice);
}

type Gravacao =
  | { estado: 'ocioso' }
  | { estado: 'salvando' }
  | { estado: 'salvo' }
  | { estado: 'erro'; mensagem: string };

/**
 * Cadastro de atividade (`643:1271`, `644:104`, `644:1271`).
 *
 * Um formulário só para os três tipos: as informações gerais e a conclusão
 * são comuns, e o bloco 02 troca de campos conforme o tipo. A trava de
 * conflito e a gravação seguem o editor da Biblioteca.
 */
export default function AdminAtividadeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { opcoes: filosofos } = useFilosofos();

  const criando = id === 'novo';

  const [rascunho, setRascunho] = useState<RascunhoAtividade>(() => atividadeVazia());
  const [status, setStatus] = useState<StatusConteudo>('rascunho');
  const [carregando, setCarregando] = useState(!criando);
  const [erroDeCarga, setErroDeCarga] = useState<string | null>(null);
  const [gravacao, setGravacao] = useState<Gravacao>({ estado: 'ocioso' });
  const [conflito, setConflito] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  /** Os erros por campo só aparecem depois de pedir a prévia, não enquanto se digita. */
  const [mostrarErros, setMostrarErros] = useState(false);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);

  const versaoCarregada = useRef(0);
  const hidratado = useRef(false);
  const [idAtual, setIdAtual] = useState(criando ? null : id);

  // Vínculo opcional: se o catálogo não carregar, o seletor fica só com
  // "Nenhum" e o resto do formulário segue funcionando.
  useEffect(() => observarConteudos(setConteudos, () => {}), []);

  useEffect(() => {
    if (!idAtual) return;

    return observarAtividade(
      idAtual,
      (atividade) => {
        setCarregando(false);

        if (!atividade) {
          setErroDeCarga('Esta atividade não existe mais.');
          return;
        }

        setStatus(atividade.status);

        // Só a primeira leitura preenche o formulário; depois, versão nova do
        // servidor vira aviso de conflito em vez de apagar o que se digita.
        if (!hidratado.current) {
          hidratado.current = true;
          versaoCarregada.current = atividade.versao;
          setRascunho(paraRascunhoDeAtividade(atividade));
          return;
        }

        if (atividade.versao !== versaoCarregada.current) {
          setConflito(true);
        }
      },
      (falha) => {
        setCarregando(false);
        setErroDeCarga(falha.message);
      },
    );
  }, [idAtual, tentativa]);

  const opcoesDeConteudo = useMemo(
    () => [
      NENHUM,
      ...conteudos
        .filter((conteudo) => conteudo.status === 'publicado')
        .map((conteudo) => ({ id: conteudo.id, nome: conteudo.titulo || 'Sem título' })),
    ],
    [conteudos],
  );

  function alterar<C extends keyof RascunhoAtividade>(campo: C, valor: RascunhoAtividade[C]) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setGravacao({ estado: 'ocioso' });
  }

  function alterarOrdenacao(parcial: Partial<DinamicaOrdenacao>) {
    setRascunho((atual) => ({ ...atual, ordenacao: { ...atual.ordenacao, ...parcial } }));
    setGravacao({ estado: 'ocioso' });
  }

  function alterarEscolha(parcial: Partial<DinamicaEscolha>) {
    setRascunho((atual) => ({ ...atual, escolha: { ...atual.escolha, ...parcial } }));
    setGravacao({ estado: 'ocioso' });
  }

  async function gravar(): Promise<string | null> {
    if (gravacao.estado === 'salvando') return null;
    if (!user) {
      setGravacao({ estado: 'erro', mensagem: 'Sessão expirada.' });
      return null;
    }

    setGravacao({ estado: 'salvando' });

    try {
      if (!idAtual) {
        const novoId = await criarAtividade(rascunho, user.uid);
        versaoCarregada.current = 1;
        hidratado.current = true;
        setIdAtual(novoId);
        // Sem isto, recarregar a página abriria outro formulário em branco e o
        // próximo salvamento criaria um segundo documento.
        router.replace(`/admin/atividades/${novoId}`);
        setGravacao({ estado: 'salvo' });
        return novoId;
      }

      versaoCarregada.current = await salvarAtividade(
        idAtual,
        rascunho,
        versaoCarregada.current,
        user.uid,
      );
      setConflito(false);
      setGravacao({ estado: 'salvo' });
      return idAtual;
    } catch (falha) {
      // Falha não limpa o formulário: o rascunho fica na tela para nova tentativa.
      setGravacao({ estado: 'erro', mensagem: mensagemDeErro(falha, 'Não foi possível salvar.') });
      return null;
    }
  }

  /**
   * A prévia abre mesmo com pendências: é nela que se confere a interação, e a
   * trava fica no botão de publicar, não no caminho até ele.
   */
  async function previsualizar() {
    setMostrarErros(true);

    const salvo = await gravar();
    if (salvo) router.push(`/admin/atividades/revisar/${salvo}`);
  }

  const erros = mostrarErros ? errosDaAtividade(rascunho) : {};
  const titulo = 'CADASTRAR / EDITAR ATIVIDADE';
  const ordenacao = rascunho.tipo === 'ordenacao';

  const voltar = (
    <BotaoVoltar rotulo="← ATIVIDADES" aoVoltar={() => router.replace('/admin/atividades')} />
  );

  if (carregando) {
    return (
      <PaginaAdmin titulo={titulo} topo={voltar}>
        <Carregando rotulo="Carregando a atividade…" />
      </PaginaAdmin>
    );
  }

  if (erroDeCarga) {
    return (
      <PaginaAdmin titulo={titulo} topo={voltar}>
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

  // "Rascunho • Exemplo: O que está sob seu controle?" (`643:1271`): status e título.
  const apoio = [ROTULO_STATUS[status], rascunho.titulo.trim()].filter(Boolean).join(' • ');

  return (
    <PaginaAdmin
      titulo={titulo}
      apoio={apoio}
      topo={voltar}
      nota="Salve o rascunho para continuar depois ou confira a prévia antes de publicar.">
      {conflito ? (
        <ErroRecuperavel
          mensagem="Esta atividade mudou em outro lugar desde que você abriu. Recarregue antes de salvar, ou você vai gravar por cima do trabalho de outra pessoa."
          aoTentarDeNovo={() => {
            hidratado.current = false;
            setConflito(false);
            setTentativa((n) => n + 1);
          }}
        />
      ) : null}

      <CaixaSecao espacamento="sm">
        <CampoTexto
          rotulo="Título *"
          placeholder="O que está sob seu controle?"
          value={rascunho.titulo}
          onChangeText={(valor) => alterar('titulo', valor)}
          erro={erros.titulo}
        />

        <CampoSelecao
          rotulo="Tipo *"
          opcoes={OPCOES_TIPO}
          valor={rascunho.tipo}
          aoEscolher={(valor) => alterar('tipo', valor as TipoAtividade)}
        />

        <CampoTexto
          rotulo="Duração estimada (minutos) *"
          placeholder="3"
          value={rascunho.duracaoMinutos > 0 ? String(rascunho.duracaoMinutos) : ''}
          onChangeText={(valor) => {
            const digitos = valor.replace(/\D/g, '').slice(0, 3);
            alterar('duracaoMinutos', digitos ? Number(digitos) : 0);
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          erro={erros.duracao}
        />

        <Linha>
          <View style={styles.terco}>
            <CampoSelecao
              rotulo="Filósofo (opcional)"
              opcoes={[NENHUM, ...filosofos]}
              valor={rascunho.filosofoId}
              aoEscolher={(valor) => alterar('filosofoId', valor)}
            />
          </View>

          <View style={styles.terco}>
            <CampoSelecao
              rotulo="Tema (opcional)"
              opcoes={[NENHUM, ...TEMAS]}
              valor={rascunho.temaIds[0] ?? ''}
              aoEscolher={(valor) => alterar('temaIds', valor ? [valor] : [])}
            />
          </View>

          <View style={styles.terco}>
            <CampoSelecao
              rotulo="Conteúdo relacionado (opcional)"
              opcoes={opcoesDeConteudo}
              valor={rascunho.conteudoId}
              aoEscolher={(valor) => alterar('conteudoId', valor)}
            />
          </View>
        </Linha>

        <CampoTexto
          rotulo="Instrução *"
          placeholder="Leia a situação e escolha o que realmente depende de você."
          value={rascunho.instrucao}
          onChangeText={(valor) => alterar('instrucao', valor)}
          erro={erros.instrucao}
          linhas={2}
        />
      </CaixaSecao>

      <CaixaSecao espacamento="sm">
        {ordenacao ? (
          <CamposOrdenacao
            dinamica={rascunho.ordenacao}
            aoMudar={alterarOrdenacao}
            erros={erros}
          />
        ) : (
          <CamposEscolha
            dinamica={rascunho.escolha}
            situacao={rascunho.tipo === 'situacao'}
            aoMudar={alterarEscolha}
            erros={erros}
          />
        )}
      </CaixaSecao>

      <View style={styles.conclusao}>
        <Text variant="supportSemibold">Conclusão / aprendizado *</Text>

        <CampoTexto
          rotulo="Título da conclusão"
          placeholder="ONDE SUA AÇÃO COMEÇA"
          value={rascunho.conclusao.titulo}
          onChangeText={(valor) => alterar('conclusao', { ...rascunho.conclusao, titulo: valor })}
        />

        <CampoTexto
          rotulo="Aprendizado"
          placeholder="Perceber essa diferença reduz o impulso de controlar aquilo que não está em suas mãos."
          value={rascunho.conclusao.texto}
          onChangeText={(valor) => alterar('conclusao', { ...rascunho.conclusao, texto: valor })}
          erro={erros.conclusao}
          linhas={3}
        />
      </View>

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
          label="PRÉ-VISUALIZAR"
          size="medium"
          disabled={gravacao.estado === 'salvando'}
          onPress={previsualizar}
          style={styles.acao}
        />
      </Linha>
    </PaginaAdmin>
  );
}

type Erros = ReturnType<typeof errosDaAtividade>;

/** Bloco 02 da ordenação (`644:104`). */
function CamposOrdenacao({
  dinamica,
  aoMudar,
  erros,
}: {
  dinamica: DinamicaOrdenacao;
  aoMudar: (parcial: Partial<DinamicaOrdenacao>) => void;
  erros: Erros;
}) {
  const { blocos } = dinamica;

  function mudarBloco(id: string, parcial: Partial<BlocoOrdenacao>) {
    aoMudar({ blocos: blocos.map((bloco) => (bloco.id === id ? { ...bloco, ...parcial } : bloco)) });
  }

  function mover(indice: number, passo: -1 | 1) {
    const destino = indice + passo;
    if (destino < 0 || destino >= blocos.length) return;

    const nova = [...blocos];
    [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
    aoMudar({ blocos: nova });
  }

  const sequencia = blocos
    .map((bloco, indice) => ({ bloco, indice }))
    .filter(({ bloco }) => !bloco.distrator)
    .map(({ bloco, indice }) => `${letra(indice)} • ${bloco.texto.trim() || '…'}`);

  return (
    <>
      <CampoTexto
        rotulo="Frase-base (opcional)"
        placeholder="Eu não controlo tudo, mas posso escolher…"
        value={dinamica.fraseBase}
        onChangeText={(valor) => aoMudar({ fraseBase: valor })}
      />

      <Text variant="supportSemibold">Blocos * (um por item)</Text>

      {blocos.map((bloco, indice) => (
        <Linha key={bloco.id}>
          <View style={styles.item}>
            <CampoTexto
              rotulo={`${letra(indice)}${bloco.distrator ? ' (distrator)' : ''}`}
              placeholder={bloco.distrator ? 'O que os outros pensam' : 'Minha próxima atitude'}
              value={bloco.texto}
              onChangeText={(valor) => mudarBloco(bloco.id, { texto: valor })}
            />
          </View>

          <View style={styles.controles}>
            <Button
              label="DISTRATOR"
              type={bloco.distrator ? 'primary' : 'secondary'}
              size="medium"
              onPress={() => mudarBloco(bloco.id, { distrator: !bloco.distrator })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: bloco.distrator }}
              accessibilityLabel={`Bloco ${letra(indice)} é distrator`}
              style={styles.controle}
            />
            <Button
              label="↑"
              type="secondary"
              size="medium"
              disabled={indice === 0}
              onPress={() => mover(indice, -1)}
              accessibilityLabel={`Subir o bloco ${letra(indice)}`}
              style={styles.seta}
            />
            <Button
              label="↓"
              type="secondary"
              size="medium"
              disabled={indice === blocos.length - 1}
              onPress={() => mover(indice, 1)}
              accessibilityLabel={`Descer o bloco ${letra(indice)}`}
              style={styles.seta}
            />
            <Button
              label="REMOVER"
              type="secondary"
              size="medium"
              disabled={blocos.length <= MIN_BLOCOS}
              onPress={() => aoMudar({ blocos: blocos.filter((atual) => atual.id !== bloco.id) })}
              accessibilityLabel={`Remover o bloco ${letra(indice)}`}
              style={styles.controle}
            />
          </View>
        </Linha>
      ))}

      {erros.itens ? (
        <Text variant="bodySmall" color="error">
          {erros.itens}
        </Text>
      ) : null}

      <Button
        label="ADICIONAR BLOCO"
        type="secondary"
        size="medium"
        disabled={blocos.length >= MAX_BLOCOS}
        onPress={() => aoMudar({ blocos: [...blocos, novoBloco()] })}
        style={styles.adicionar}
      />

      <Text variant="supportSemibold">Sequência correta *</Text>
      <Text>{sequencia.length > 0 ? sequencia.join('  →  ') : '—'}</Text>

      <CampoTexto
        rotulo="Mensagem de nova tentativa *"
        placeholder="Ainda não. Releia a frase e tente outra ordem."
        value={dinamica.mensagemTentativa}
        onChangeText={(valor) => aoMudar({ mensagemTentativa: valor })}
        erro={erros.tentativa}
        linhas={2}
      />

      <CampoTexto
        rotulo="Explicação após conferir *"
        placeholder="A liberdade começa quando distinguimos o acontecimento da resposta que escolhemos dar."
        value={dinamica.explicacao}
        onChangeText={(valor) => aoMudar({ explicacao: valor })}
        erro={erros.explicacao}
        linhas={3}
      />
    </>
  );
}

/** Bloco 02 de reflexão e situação (`643:1271`, `644:1271`). */
function CamposEscolha({
  dinamica,
  situacao,
  aoMudar,
  erros,
}: {
  dinamica: DinamicaEscolha;
  situacao: boolean;
  aoMudar: (parcial: Partial<DinamicaEscolha>) => void;
  erros: Erros;
}) {
  const { alternativas, modo } = dinamica;
  const porAlternativa = modo === 'orientado' || dinamica.devolutivaLivre === 'porEscolha';

  function mudarAlternativa(id: string, parcial: Partial<AlternativaAtividade>) {
    aoMudar({
      alternativas: alternativas.map((alternativa) =>
        alternativa.id === id ? { ...alternativa, ...parcial } : alternativa,
      ),
    });
  }

  function mudarMensagem(parcial: Partial<MensagemSimulada>) {
    aoMudar({ mensagem: { ...(dinamica.mensagem ?? mensagemSimuladaVazia()), ...parcial } });
  }

  const opcoesDeResposta = alternativas.map((alternativa, indice) => ({
    id: alternativa.id,
    nome: `Alternativa ${indice + 1} • ${alternativa.texto.trim() || '…'}`,
  }));

  return (
    <>
      <CampoTexto
        rotulo="Situação *"
        placeholder={
          situacao
            ? 'Você pensa em publicar algo apenas para causar uma boa impressão.'
            : 'Uma pessoa não respondeu à sua mensagem.'
        }
        value={dinamica.situacao}
        onChangeText={(valor) => aoMudar({ situacao: valor })}
        linhas={2}
      />

      <CampoTexto
        rotulo="Pergunta *"
        placeholder={situacao ? 'O que você faria?' : 'O que depende de você?'}
        value={dinamica.pergunta}
        onChangeText={(valor) => aoMudar({ pergunta: valor })}
        erro={erros.cenario}
      />

      <Text variant="supportSemibold">Alternativas * (uma por item)</Text>

      {alternativas.map((alternativa, indice) => (
        <Linha key={alternativa.id}>
          <View style={styles.item}>
            <CampoTexto
              rotulo={`${indice + 1}.`}
              placeholder={situacao ? 'Pararia para entender minha intenção' : 'Como você responde'}
              value={alternativa.texto}
              onChangeText={(valor) => mudarAlternativa(alternativa.id, { texto: valor })}
            />
          </View>

          <Button
            label="REMOVER"
            type="secondary"
            size="medium"
            disabled={alternativas.length <= MIN_ALTERNATIVAS}
            onPress={() =>
              aoMudar({
                alternativas: alternativas.filter((atual) => atual.id !== alternativa.id),
                // A resposta indicada não pode apontar para uma alternativa que saiu.
                respostaId: dinamica.respostaId === alternativa.id ? '' : dinamica.respostaId,
              })
            }
            accessibilityLabel={`Remover a alternativa ${indice + 1}`}
            style={[styles.controle, styles.remover]}
          />
        </Linha>
      ))}

      {erros.itens ? (
        <Text variant="bodySmall" color="error">
          {erros.itens}
        </Text>
      ) : null}

      <Button
        label="ADICIONAR ALTERNATIVA"
        type="secondary"
        size="medium"
        disabled={alternativas.length >= MAX_ALTERNATIVAS}
        onPress={() => aoMudar({ alternativas: [...alternativas, novaAlternativa()] })}
        style={styles.adicionar}
      />

      <CampoSelecao
        rotulo="Modo de resposta *"
        opcoes={OPCOES_MODO}
        valor={modo}
        aoEscolher={(valor) => aoMudar({ modo: valor as ModoResposta })}
      />

      {modo === 'orientado' ? (
        <CampoSelecao
          rotulo="Resposta orientadora *"
          opcoes={opcoesDeResposta}
          valor={dinamica.respostaId}
          aoEscolher={(valor) => aoMudar({ respostaId: valor })}
          erro={erros.resposta}
        />
      ) : (
        <CampoSelecao
          rotulo="Devolutiva *"
          opcoes={OPCOES_DEVOLUTIVA}
          valor={dinamica.devolutivaLivre}
          aoEscolher={(valor) => aoMudar({ devolutivaLivre: valor as DevolutivaLivre })}
        />
      )}

      {porAlternativa ? (
        <>
          <Text variant="supportSemibold">Devolutiva por alternativa *</Text>

          {alternativas.map((alternativa, indice) => (
            <CampoTexto
              key={alternativa.id}
              rotulo={`${indice + 1}. ${alternativa.texto.trim() || '…'}${
                modo === 'orientado' && alternativa.id === dinamica.respostaId ? ' (orientadora)' : ''
              }`}
              placeholder="Você escolhe suas palavras e sua atitude."
              value={alternativa.devolutiva}
              onChangeText={(valor) => mudarAlternativa(alternativa.id, { devolutiva: valor })}
              linhas={2}
            />
          ))}

          {erros.devolutiva ? (
            <Text variant="bodySmall" color="error">
              {erros.devolutiva}
            </Text>
          ) : null}
        </>
      ) : (
        <CampoTexto
          rotulo="Devolutiva comum a todas as escolhas *"
          placeholder="Isso expressa quem sou ou apenas a imagem que quero sustentar?"
          value={dinamica.devolutivaComum}
          onChangeText={(valor) => aoMudar({ devolutivaComum: valor })}
          erro={erros.devolutiva}
          linhas={2}
        />
      )}

      {situacao ? (
        <>
          <Text variant="supportSemibold">MENSAGEM SIMULADA · SOMENTE QUANDO APLICÁVEL</Text>

          <Button
            label={dinamica.mensagem ? 'REMOVER MENSAGEM SIMULADA' : 'INCLUIR MENSAGEM SIMULADA'}
            type="secondary"
            size="medium"
            onPress={() =>
              aoMudar({ mensagem: dinamica.mensagem ? null : mensagemSimuladaVazia() })
            }
            style={styles.adicionar}
          />

          {dinamica.mensagem ? (
            <>
              <Linha>
                <View style={styles.terco}>
                  <CampoTexto
                    rotulo="Remetente *"
                    placeholder="Nome exibido"
                    value={dinamica.mensagem.remetente}
                    onChangeText={(valor) => mudarMensagem({ remetente: valor })}
                  />
                </View>
                <View style={styles.terco}>
                  <CampoTexto
                    rotulo="Identificador"
                    placeholder="Telefone mascarado"
                    value={dinamica.mensagem.identificador}
                    onChangeText={(valor) => mudarMensagem({ identificador: valor })}
                  />
                </View>
              </Linha>

              <CampoTexto
                rotulo="Corpo *"
                placeholder="Texto da mensagem fictícia"
                value={dinamica.mensagem.corpo}
                onChangeText={(valor) => mudarMensagem({ corpo: valor })}
                linhas={3}
              />

              <CampoTexto
                rotulo="Endereço exibido"
                placeholder="Endereço apresentado como texto, sem link clicável"
                value={dinamica.mensagem.endereco}
                onChangeText={(valor) => mudarMensagem({ endereco: valor })}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <CampoTexto
                rotulo="Observação *"
                placeholder="Orientação para analisar a mensagem"
                value={dinamica.mensagem.observacao}
                onChangeText={(valor) => mudarMensagem({ observacao: valor })}
                erro={erros.mensagem}
                linhas={2}
              />
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

// Larguras do Figma: 250 para as duas ações do rodapé.
const styles = StyleSheet.create({
  terco: {
    flexGrow: 1,
    flexBasis: 240,
  },
  conclusao: {
    gap: spacing.sm,
  },
  item: {
    flexGrow: 1,
    flexBasis: 360,
  },
  controles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  controle: {
    paddingHorizontal: spacing.xl,
  },
  seta: {
    width: 48,
  },
  remover: {
    alignSelf: 'flex-end',
  },
  adicionar: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing['2xl'],
  },
  acao: {
    width: 250,
    maxWidth: '100%',
  },
});
