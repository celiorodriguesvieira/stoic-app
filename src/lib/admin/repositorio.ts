import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Transaction,
} from 'firebase/firestore';

import { db, requireDb } from '@/lib/firebase';
import { retratoDoAcervo } from '@/lib/retratos';
import { idDoNome, SEMENTE_FILOSOFOS } from '@/lib/admin/acervo';
import { PAPEL_PADRAO, type Papel, type PerfilUsuario } from '@/lib/perfil';
import {
  aplicacaoVazia,
  textoPorNivelVazio,
  type Conteudo,
  type EdicaoSemanal,
  type RascunhoRecurso,
  type RecursoBiblioteca,
  type Filosofo,
  type Formato,
  type RascunhoConteudo,
  type RascunhoFilosofo,
  type DadosDaAula,
  type EtapasDaAula,
  type ModoFonte,
  type OpcaoReflexao,
  type StatusConteudo,
  type TextoPorNivel,
  type TipoConteudo,
  aulaVazia,
  etapasVazias,
  fimDaEdicao,
  FUSO_EDITORIAL_PADRAO,
  pendenciasDaEdicao,
  periodoParaExibicao,
  pendenciasDoFilosofo,
  pendenciasParaPublicar,
  periodosSeSobrepoem,
  MODOS_FONTE,
  TIPOS_CONTEUDO,
  TIPOS_RECURSO,
  idDoVideoDoYoutube,
  pendenciasDoRecurso,
  type TipoRecurso,
  atividadeVazia,
  DEVOLUTIVAS_LIVRES,
  MODOS_RESPOSTA,
  pendenciasDaAtividade,
  sequenciaCorreta,
  TIPOS_ATIVIDADE,
  type Atividade,
  type DevolutivaLivre,
  type DinamicaEscolha,
  type DinamicaOrdenacao,
  type ModoResposta,
  type RascunhoAtividade,
  type TipoAtividade,
  type IntroducaoPorNivel,
  type Nivel,
} from '@/lib/admin/tipos';

const CONTEUDOS = 'conteudos';
const FILOSOFOS = 'filosofos';
const AGENDA = 'agenda';
const USUARIOS = 'usuarios';
const AUDITORIA = 'auditoria';
const BIBLIOTECA = 'biblioteca';
const ATIVIDADES = 'atividades';

/** Erro previsto: alguém gravou por cima enquanto esta tela estava aberta. */
export class ErroDeConflito extends Error {
  constructor(mensagem = 'Este conteúdo mudou em outra aba desde que você abriu. Recarregue para não perder o que a outra pessoa escreveu.') {
    super(mensagem);
    this.name = 'ErroDeConflito';
  }
}

/** Erro previsto: a operação é válida no formulário, mas proibida pela regra de negócio. */
export class ErroDeRegra extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroDeRegra';
  }
}

/**
 * Não é recusa: é pergunta. A operação segue se o chamador insistir de propósito.
 *
 * Tem classe própria para a tela reconhecer o caso sem ler o texto da mensagem —
 * comparar strings quebraria calado na primeira vez que a frase mudasse.
 */
export class ErroPedeConfirmacao extends ErroDeRegra {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroPedeConfirmacao';
  }
}

const SEM_FIREBASE =
  'Firebase não configurado. Preencha o .env com as credenciais do projeto (ver docs/painel-admin.md).';

/**
 * Erro do Firestore em português.
 *
 * O SDK devolve a mensagem em inglês ("Missing or insufficient permissions"),
 * que apareceu crua na tela. As classes de erro são as do contrato `668:181`
 * — 401 sessão expirada, 403 sem permissão, 503 falha temporária —, e o texto
 * segue o padrão dos que o Figma escreve por extenso (`598:77`, `650:981`):
 * curto, em português, dizendo o que houve.
 *
 * A pista de diagnóstico vai para o console, não para a tela: mandar alguém
 * rodar `firebase deploy` é instrução de desenvolvedor, e ela não pertence à
 * interface do produto. Em 16/09 essa dica estava no lugar errado.
 */
/**
 * Mensagem já traduzida, para as telas não repetirem `instanceof` em cada
 * `catch`.
 *
 * Os erros próprios (`ErroDeRegra`, `ErroDeConflito`, `ErroPedeConfirmacao`)
 * atravessam sem alteração: não têm `code` do SDK e já nascem em português.
 */
export function mensagemDeErro(falha: unknown, padrao: string): string {
  return traduzirErro(falha instanceof Error ? falha : new Error(padrao)).message;
}

export function traduzirErro(falha: unknown): Error {
  const erro = falha instanceof Error ? falha : new Error('Falha ao ler os dados.');
  const codigo = (erro as { code?: unknown }).code;

  if (codigo === 'permission-denied') {
    if (__DEV__) {
      console.warn(
        '[PAUSA] permission-denied no Firestore. Se a conta tem papel de administrador, as Security Rules publicadas podem estar mais antigas que firestore.rules. Publique com "firebase deploy --only firestore:rules".',
        erro.message,
      );
    }

    // "Acesso restrito" é a palavra do contrato (`646:107`), não redação minha.
    return new Error('Acesso restrito.');
  }

  // 503 e 401 do `668:181`. O Figma nomeia as duas situações mas não escreve o
  // texto de tela; estas frases estão em `TEXTOS_SEM_FONTE` para revisão.
  if (codigo === 'unavailable') {
    return new Error('Falha temporária. Tente novamente.');
  }

  if (codigo === 'unauthenticated') {
    return new Error('Sessão expirada.');
  }

  return erro;
}

/**
 * As funções `observar*` nunca lançam: sem Firestore, avisam pelo callback de
 * falha e devolvem um cancelamento vazio. Assim a tela trata "não configurado"
 * pelo mesmo caminho de qualquer outro erro, sem try/catch em volta do efeito.
 */
function assinar(
  aoFalhar: (erro: Error) => void,
  montar: (banco: NonNullable<typeof db>, falhar: (erro: Error) => void) => () => void,
): () => void {
  // `falhar` é o que se entrega ao `onSnapshot`: assim nenhuma tela precisa
  // lembrar de traduzir o erro, e nenhum erro do SDK escapa em inglês.
  const falhar = (erro: Error) => aoFalhar(traduzirErro(erro));

  if (!db) {
    queueMicrotask(() => aoFalhar(new Error(SEM_FIREBASE)));
    return () => {};
  }

  try {
    return montar(db, falhar);
  } catch (falha) {
    queueMicrotask(() => falhar(falha instanceof Error ? falha : new Error('Falha ao abrir a consulta.')));
    return () => {};
  }
}

function millis(valor: unknown): number {
  return valor instanceof Timestamp ? valor.toMillis() : 0;
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function textos(valor: unknown): TextoPorNivel {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const base = textoPorNivelVazio();

  return {
    leigo: texto(bruto.leigo) || base.leigo,
    curioso: texto(bruto.curioso) || base.curioso,
    estudioso: texto(bruto.estudioso) || base.estudioso,
    erudito: texto(bruto.erudito) || base.erudito,
  };
}

/** Valor de uma lista fechada, ou o padrão — documento antigo não tem o campo. */
function daLista<T extends string>(valor: unknown, lista: readonly T[], padrao: T): T {
  const lido = texto(valor);

  return (lista as readonly string[]).includes(lido) ? (lido as T) : padrao;
}

function opcoesDaReflexao(valor: unknown): OpcaoReflexao[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item) => ({ id: texto(item.id), texto: texto(item.texto) }))
    // Opção sem id não tem como ser respondida: a resposta guarda o id.
    .filter((opcao) => opcao.id);
}

function etapas(valor: unknown): EtapasDaAula {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const base = etapasVazias();
  const opcoes = opcoesDaReflexao(bruto.opcoes);

  return {
    introducao: texto(bruto.introducao),
    modoFonte: daLista<ModoFonte>(bruto.modoFonte, MODOS_FONTE, base.modoFonte),
    fonte: texto(bruto.fonte),
    explicacao: texto(bruto.explicacao),
    pergunta: texto(bruto.pergunta),
    // Sem nenhuma opção gravada, voltam as duas em branco do formulário — a
    // tela precisa de algo onde escrever, e zero opções não é um estado válido.
    opcoes: opcoes.length > 0 ? opcoes : base.opcoes,
    orientacao: texto(bruto.orientacao),
    pratica: texto(bruto.pratica),
    sintese: texto(bruto.sintese),
    leveComVoce: texto(bruto.leveComVoce),
  };
}

function paraAula(valor: unknown): DadosDaAula {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const porNivel = (bruto.etapas ?? {}) as Record<string, unknown>;
  const base = aulaVazia();

  return {
    fraseDestaque: texto(bruto.fraseDestaque),
    duracaoMinutos:
      typeof bruto.duracaoMinutos === 'number' ? bruto.duracaoMinutos : base.duracaoMinutos,
    atividadeId: texto(bruto.atividadeId),
    etapas: {
      leigo: etapas(porNivel.leigo),
      curioso: etapas(porNivel.curioso),
      estudioso: etapas(porNivel.estudioso),
      erudito: etapas(porNivel.erudito),
    },
  };
}

function paraConteudo(id: string, dados: DocumentData): Conteudo {
  const aplicacao = (dados.aplicacao ?? {}) as Record<string, unknown>;

  return {
    id,
    // Todo conteúdo gravado antes de 16/09 é artigo: o campo nem existia.
    tipo: daLista<TipoConteudo>(dados.tipo, TIPOS_CONTEUDO, 'artigo'),
    titulo: texto(dados.titulo),
    autorId: texto(dados.autorId),
    formato: (texto(dados.formato) || 'leitura') as Formato,
    temaIds: Array.isArray(dados.temaIds) ? dados.temaIds.filter((t): t is string => typeof t === 'string') : [],
    fonte: texto(dados.fonte),
    textos: textos(dados.textos),
    aplicacao: {
      ...aplicacaoVazia(),
      titulo: texto(aplicacao.titulo),
      textos: textos(aplicacao.textos),
    },
    aula: paraAula(dados.aula),
    status: (texto(dados.status) || 'rascunho') as StatusConteudo,
    atualizadoEm: millis(dados.atualizadoEm),
    versao: typeof dados.versao === 'number' ? dados.versao : 1,
  };
}

/** Lista o catálogo em tempo real, mais recente primeiro. */
export function observarConteudos(
  aoMudar: (conteudos: Conteudo[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, CONTEUDOS), orderBy('atualizadoEm', 'desc')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraConteudo(d.id, d.data()))),
      falhar,
    ),
  );
}

/**
 * O que o app mostra no Explorar: só publicados, mais recentes primeiro
 * ("Conteúdos: mais recentes", `668:204`). O filtro tem de estar na consulta —
 * ver `observarRecursosPublicados`.
 */
export function observarConteudosPublicados(
  aoMudar: (conteudos: Conteudo[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, CONTEUDOS), where('status', '==', 'publicado')),
      (instantaneo) =>
        aoMudar(
          instantaneo.docs
            .map((d) => paraConteudo(d.id, d.data()))
            .sort((a, b) => b.atualizadoEm - a.atualizadoEm || a.id.localeCompare(b.id)),
        ),
      falhar,
    ),
  );
}

export function observarConteudo(
  id: string,
  aoMudar: (conteudo: Conteudo | null) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      doc(banco, CONTEUDOS, id),
      (instantaneo) =>
        aoMudar(instantaneo.exists() ? paraConteudo(instantaneo.id, instantaneo.data()) : null),
      falhar,
    ),
  );
}

/** Cria um conteúdo novo, sempre como rascunho. */
export async function criarConteudo(rascunho: RascunhoConteudo, autorUid: string): Promise<string> {
  const referencia = await addDoc(collection(requireDb(), CONTEUDOS), {
    ...rascunho,
    status: 'rascunho' satisfies StatusConteudo,
    versao: 1,
    criadoPor: autorUid,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return referencia.id;
}

/**
 * Grava por cima de um conteúdo existente.
 *
 * `versaoEsperada` é a versão que o editor carregou. Se o documento já avançou,
 * nada é escrito e o chamador recebe `ErroDeConflito` — em vez de apagar
 * silenciosamente o trabalho de outra pessoa.
 */
export async function salvarRascunho(
  id: string,
  rascunho: RascunhoConteudo,
  versaoEsperada: number,
  autorUid: string,
): Promise<number> {
  const referencia = doc(requireDb(), CONTEUDOS, id);

  return runTransaction(requireDb(), async (transacao) => {
    const atual = await transacao.get(referencia);

    if (!atual.exists()) {
      throw new ErroDeRegra('Este conteúdo não existe mais.');
    }

    const versaoAtual = typeof atual.data().versao === 'number' ? atual.data().versao : 1;
    if (versaoAtual !== versaoEsperada) {
      throw new ErroDeConflito();
    }

    const proxima = versaoAtual + 1;

    transacao.update(referencia, {
      ...rascunho,
      versao: proxima,
      atualizadoPor: autorUid,
      atualizadoEm: serverTimestamp(),
    });

    return proxima;
  });
}

/**
 * Publica. Revalida os quatro níveis DENTRO da transação: a tela já bloqueia,
 * mas a tela não é a garantia — o documento pode ter mudado desde então.
 */
export async function publicarConteudo(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<void> {
  const referencia = doc(requireDb(), CONTEUDOS, id);

  await runTransaction(requireDb(), async (transacao) => {
    const atual = await transacao.get(referencia);

    if (!atual.exists()) {
      throw new ErroDeRegra('Este conteúdo não existe mais.');
    }

    const conteudo = paraConteudo(atual.id, atual.data());

    if (conteudo.versao !== versaoEsperada) {
      throw new ErroDeConflito();
    }

    const pendencias = pendenciasParaPublicar(conteudo);
    if (pendencias.length > 0) {
      throw new ErroDeRegra(`Não dá para publicar ainda: ${pendencias.join(' ')}`);
    }

    // A aula aponta para uma atividade que o app precisa conseguir ler: se ela
    // saiu do ar depois de escolhida, o botão "Atividade da semana" abriria o
    // vazio. Conferido aqui, na mesma transação, e não só no seletor.
    if (conteudo.tipo === 'aula') {
      const atividade = await transacao.get(doc(requireDb(), ATIVIDADES, conteudo.aula.atividadeId));

      if (!atividade.exists() || texto(atividade.data().status) !== 'publicado') {
        throw new ErroDeRegra('A atividade da semana escolhida não está publicada.');
      }
    }

    transacao.update(referencia, {
      status: 'publicado' satisfies StatusConteudo,
      // Publicar também desfaz um arquivamento: o destino de "restaurar" já
      // não vale, e deixá-lo gravado seria guardar uma volta que não existe.
      statusAnterior: null,
      versao: conteudo.versao + 1,
      publicadoPor: autorUid,
      publicadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/**
 * Arquiva — a "exclusão" do painel.
 *
 * Apagar o documento deixaria a agenda apontando para um registro que sumiu e
 * levaria junto o histórico editorial. Arquivar tira o conteúdo do catálogo e
 * do app (as regras só deixam usuário comum ler `publicado`) e dá para desfazer.
 *
 * Recusa enquanto houver destaque programado de hoje em diante, a menos que
 * `removerDestaques` seja verdadeiro — o mesmo padrão de "data ocupada vira
 * pergunta, não erro" de `programarEdicao`. Edição encerrada fica: é registro
 * do que já foi ao ar, e reescrever o passado seria mentir sobre ele.
 */
export async function arquivarConteudo(
  id: string,
  versaoEsperada: number,
  autorUid: string,
  removerDestaques = false,
): Promise<void> {
  const banco = requireDb();

  const agendados = await getDocs(
    query(collection(banco, AGENDA), where('conteudoId', '==', id)),
  );

  // Filtra o período em memória de propósito: faixa de datas com igualdade em
  // outro campo exigiria índice composto, e a agenda é pequena.
  const agora = agoraEditorial();
  const futuros = agendados.docs
    .map((d) => paraEdicao(d.id, d.data()))
    // Edição já encerrada é histórico do que foi ao ar; só as que ainda valem
    // atrapalham o arquivamento.
    .filter((edicao) => edicao.fim > agora);

  if (futuros.length > 0 && !removerDestaques) {
    const periodos = futuros
      .map((edicao) => periodoParaExibicao(edicao.inicio, edicao.fim))
      .sort()
      .join('; ');

    throw new ErroPedeConfirmacao(
      `Este conteúdo está programado em ${periodos}. Arquivar vai desmarcar ${futuros.length === 1 ? 'essa edição' : 'essas edições'}.`,
    );
  }

  const referencia = doc(banco, CONTEUDOS, id);

  await runTransaction(banco, async (transacao) => {
    const atual = await transacao.get(referencia);

    if (!atual.exists()) {
      throw new ErroDeRegra('Este conteúdo não existe mais.');
    }

    const conteudo = paraConteudo(atual.id, atual.data());

    if (conteudo.versao !== versaoEsperada) {
      throw new ErroDeConflito();
    }

    if (conteudo.status === 'arquivado') {
      throw new ErroDeRegra('Este conteúdo já está arquivado.');
    }

    transacao.update(referencia, {
      status: 'arquivado' satisfies StatusConteudo,
      // Guarda de onde veio para que restaurar devolva ao mesmo lugar.
      statusAnterior: conteudo.status,
      versao: conteudo.versao + 1,
      arquivadoPor: autorUid,
      arquivadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });

  // Só depois de arquivar de fato: se a transação falhar, a agenda fica intacta.
  for (const destaque of futuros) {
    await deleteDoc(doc(banco, AGENDA, destaque.id));
  }
}

/**
 * Desfaz o arquivamento, devolvendo o conteúdo ao status que tinha antes.
 *
 * Voltar ao que era evita dois enganos: rebaixar a rascunho algo que estava no
 * ar (e sumir com ele sem querer) e republicar sozinho o que era rascunho.
 */
export async function restaurarConteudo(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<StatusConteudo> {
  const referencia = doc(requireDb(), CONTEUDOS, id);

  return runTransaction(requireDb(), async (transacao) => {
    const atual = await transacao.get(referencia);

    if (!atual.exists()) {
      throw new ErroDeRegra('Este conteúdo não existe mais.');
    }

    const conteudo = paraConteudo(atual.id, atual.data());

    if (conteudo.versao !== versaoEsperada) {
      throw new ErroDeConflito();
    }

    if (conteudo.status !== 'arquivado') {
      throw new ErroDeRegra('Este conteúdo não está arquivado.');
    }

    const anterior = texto(atual.data().statusAnterior);
    const destino: StatusConteudo = anterior === 'publicado' ? 'publicado' : 'rascunho';

    transacao.update(referencia, {
      status: destino,
      statusAnterior: null,
      versao: conteudo.versao + 1,
      restauradoPor: autorUid,
      restauradoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return destino;
  });
}

// --- Programação semanal -----------------------------------------------------

/**
 * Agora em Brasília, como `AAAA-MM-DDTHH:MM` — o mesmo formato da agenda.
 *
 * Sai no formato gravado de propósito: com fuso único, comparar períodos é
 * comparar texto, e este é o único ponto do arquivo que precisa saber que
 * horas são.
 */
export function agoraEditorial(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_EDITORIAL_PADRAO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const de = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '00';

  return `${de('year')}-${de('month')}-${de('day')}T${de('hour')}:${de('minute')}`;
}

/**
 * Instante gravado, subindo os formatos antigos.
 *
 * Passou por três formatos: `data` (agenda diária, até 15/09), `inicio` só com
 * a data (15/09) e `AAAA-MM-DDTHH:MM` (16/09). Uma data sem hora vira
 * meia-noite, que é o que ela sempre significou na prática — assim edição
 * antiga continua aparecendo na lista em vez de sumir.
 */
function comoInstante(valor: string): string {
  if (!valor) return '';

  return valor.length >= 16 ? valor.slice(0, 16) : `${valor.slice(0, 10)}T00:00`;
}

function paraEdicao(id: string, dados: DocumentData): EdicaoSemanal {
  const inicio = comoInstante(texto(dados.inicio) || texto(dados.data));
  const fimGravado = comoInstante(texto(dados.fim));

  return {
    id,
    nome: texto(dados.nome),
    conteudoId: texto(dados.conteudoId),
    inicio,
    // Registro sem término (a agenda diária) vale os sete dias padrão.
    fim: fimGravado || (inicio ? fimDaEdicao(inicio) : ''),
    fuso: texto(dados.fuso) || FUSO_EDITORIAL_PADRAO,
    agendadoPor: texto(dados.agendadoPor),
    agendadoEm: millis(dados.agendadoEm),
  };
}

export function observarEdicoes(
  aoMudar: (edicoes: EdicaoSemanal[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      // Sem `orderBy`: o Firestore deixa de fora quem não tem o campo, e a
      // agenda anterior a 15/09 gravava `data`, não `inicio` — essas edições
      // sumiriam da lista apesar de `paraEdicao` saber lê-las. A ordenação é
      // feita aqui, que é barato numa coleção deste tamanho.
      collection(banco, AGENDA),
      (instantaneo) =>
        aoMudar(
          instantaneo.docs
            .map((d) => paraEdicao(d.id, d.data()))
            .sort((a, b) => b.inicio.localeCompare(a.inicio)),
        ),
      falhar,
    ),
  );
}

/**
 * Programa a edição da semana.
 *
 * Recusa conteúdo que não esteja publicado e período que cruze outra edição —
 * "uma única edição ativa por vez" (contrato `671:1237`). Sobreposição não é
 * erro seco: vira pergunta, e a tela reenvia com `substituirId` depois de
 * confirmar, o mesmo padrão que a agenda diária já usava.
 */
export async function programarEdicao(
  entrada: { nome: string; conteudoId: string; inicio: string; fim: string },
  autorUid: string,
  substituirId?: string,
): Promise<void> {
  const pendencias = pendenciasDaEdicao(entrada);
  if (pendencias.length > 0) {
    throw new ErroDeRegra(pendencias.join(' '));
  }

  const banco = requireDb();

  const conteudo = await getDoc(doc(banco, CONTEUDOS, entrada.conteudoId));

  if (!conteudo.exists()) {
    throw new ErroDeRegra('Conteúdo não encontrado.');
  }
  if (texto(conteudo.data().status) !== 'publicado') {
    throw new ErroDeRegra('Só é possível destacar um conteúdo publicado.');
  }

  // O término vem da tela desde 16/09: deixou de ser sempre início + 7 dias.
  const periodo = { inicio: entrada.inicio, fim: entrada.fim };

  // Cruzamento é faixa contra faixa, o que o Firestore não consulta: a
  // verificação roda em memória, e a agenda é pequena por natureza.
  const todas = await getDocs(collection(banco, AGENDA));

  const conflito = todas.docs
    .filter((d) => d.id !== substituirId)
    .map((d) => paraEdicao(d.id, d.data()))
    .find((edicao) => periodosSeSobrepoem(periodo, edicao));

  if (conflito) {
    throw new ErroPedeConfirmacao(
      `O período ${periodoParaExibicao(periodo.inicio, periodo.fim)} cruza a edição “${conflito.nome || 'sem nome'}” (${periodoParaExibicao(conflito.inicio, conflito.fim)}). Substituir aquela edição?`,
    );
  }

  const payload = {
    nome: entrada.nome.trim(),
    conteudoId: entrada.conteudoId,
    inicio: periodo.inicio,
    fim: periodo.fim,
    fuso: FUSO_EDITORIAL_PADRAO,
    agendadoPor: autorUid,
    agendadoEm: serverTimestamp(),
  };

  if (substituirId) {
    await setDoc(doc(banco, AGENDA, substituirId), payload);
    return;
  }

  await addDoc(collection(banco, AGENDA), payload);
}

// --- Filósofos ---------------------------------------------------------------

function paraIntroducoes(valor: unknown): IntroducaoPorNivel {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const lida = (nivel: unknown) => {
    const campos = (nivel ?? {}) as Record<string, unknown>;

    return { titulo: texto(campos.titulo), texto: texto(campos.texto), fonte: texto(campos.fonte) };
  };

  return {
    leigo: lida(bruto.leigo),
    curioso: lida(bruto.curioso),
    estudioso: lida(bruto.estudioso),
    erudito: lida(bruto.erudito),
  };
}

function paraFilosofo(id: string, dados: DocumentData): Filosofo {
  return {
    id,
    nome: texto(dados.nome),
    biografia: texto(dados.biografia),
    portraitAssetId: texto(dados.portraitAssetId) || null,
    // Filósofo gravado antes de 18/09 não tem estes campos: chegam vazios.
    subtitulo: texto(dados.subtitulo),
    periodo: texto(dados.periodo),
    introducoes: paraIntroducoes(dados.introducoes),
    atualizadoEm: millis(dados.atualizadoEm),
  };
}

/** Os campos editáveis do filósofo, com as pontas aparadas. */
function gravavelDoFilosofo(rascunho: RascunhoFilosofo) {
  const aparada = (nivel: Nivel) => ({
    titulo: rascunho.introducoes[nivel].titulo.trim(),
    texto: rascunho.introducoes[nivel].texto.trim(),
    fonte: rascunho.introducoes[nivel].fonte.trim(),
  });

  return {
    nome: rascunho.nome.trim(),
    biografia: rascunho.biografia.trim(),
    portraitAssetId: rascunho.portraitAssetId,
    subtitulo: rascunho.subtitulo.trim(),
    periodo: rascunho.periodo.trim(),
    introducoes: {
      leigo: aparada('leigo'),
      curioso: aparada('curioso'),
      estudioso: aparada('estudioso'),
      erudito: aparada('erudito'),
    },
  };
}

/** Lista o acervo em ordem alfabética — é assim que a tela `643:947` mostra. */
export function observarFilosofos(
  aoMudar: (filosofos: Filosofo[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, FILOSOFOS), orderBy('nome')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraFilosofo(d.id, d.data()))),
      falhar,
    ),
  );
}

/**
 * Cadastra um filósofo. O id vem do nome, não é sorteado.
 *
 * Recusa se o id já existir: dois "Sêneca" gravariam um por cima do outro e o
 * segundo levaria junto os conteúdos do primeiro.
 */
export async function criarFilosofo(rascunho: RascunhoFilosofo): Promise<string> {
  const pendencias = pendenciasDoFilosofo(rascunho);
  if (pendencias.length > 0) {
    throw new ErroDeRegra(pendencias.join(' '));
  }

  const banco = requireDb();
  const id = idDoNome(rascunho.nome);

  if (!id) {
    throw new ErroDeRegra('Este nome não gera um identificador válido. Use letras ou números.');
  }

  const referencia = doc(banco, FILOSOFOS, id);

  if ((await getDoc(referencia)).exists()) {
    throw new ErroDeRegra(`Já existe um filósofo cadastrado como “${rascunho.nome.trim()}”.`);
  }

  await setDoc(referencia, {
    ...gravavelDoFilosofo(rascunho),
    atualizadoEm: serverTimestamp(),
  });

  return id;
}

/**
 * Atualiza nome e biografia. O id fica como está, mesmo que o nome mude: é
 * ele que os conteúdos guardam, e renomear não pode quebrar esse vínculo.
 */
export async function salvarFilosofo(id: string, rascunho: RascunhoFilosofo): Promise<void> {
  const pendencias = pendenciasDoFilosofo(rascunho);
  if (pendencias.length > 0) {
    throw new ErroDeRegra(pendencias.join(' '));
  }

  const banco = requireDb();
  const referencia = doc(banco, FILOSOFOS, id);

  if (!(await getDoc(referencia)).exists()) {
    throw new ErroDeRegra('Este filósofo não existe mais.');
  }

  await updateDoc(referencia, {
    ...gravavelDoFilosofo(rascunho),
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * Importa para o Firestore os filósofos que viviam no código.
 *
 * Só grava quem ainda não existe, então rodar duas vezes não desfaz edição
 * nenhuma. Devolve quantos entraram.
 */
export async function semearFilosofos(): Promise<number> {
  const banco = requireDb();
  const lote = writeBatch(banco);
  let novos = 0;

  for (const semente of SEMENTE_FILOSOFOS) {
    const referencia = doc(banco, FILOSOFOS, semente.id);

    if ((await getDoc(referencia)).exists()) continue;

    lote.set(referencia, {
      nome: semente.nome,
      biografia: '',
      // A semente já vem com retrato quando o acervo tem um para ela: sem isto,
      // importar os seis deixaria todos na inicial do nome.
      portraitAssetId: retratoDoAcervo(semente.id) ? semente.id : null,
      atualizadoEm: serverTimestamp(),
    });
    novos += 1;
  }

  if (novos > 0) await lote.commit();

  return novos;
}

// --- Usuários e permissões ---------------------------------------------------

function paraPerfil(uid: string, dados: DocumentData): PerfilUsuario {
  const papel = texto(dados.papel);

  return {
    uid,
    nome: texto(dados.nome),
    email: texto(dados.email),
    papel: (papel === 'editor' || papel === 'administrador' ? papel : PAPEL_PADRAO) as Papel,
    // O painel não usa preferências nem avatar; lê como nulo para não alegar o
    // que não leu.
    avatarId: null,
    preferencias: null,
  };
}

export function observarUsuarios(
  aoMudar: (usuarios: PerfilUsuario[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, USUARIOS), orderBy('nome')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraPerfil(d.id, d.data()))),
      falhar,
    ),
  );
}

/**
 * Altera o papel de alguém e registra a operação.
 *
 * ATENÇÃO — garantia parcial. As duas travas abaixo rodam no cliente:
 *   1. ninguém altera o próprio papel neste fluxo;
 *   2. o último administrador não perde o acesso.
 *
 * A contagem de administradores é uma consulta feita ANTES da transação, porque
 * o SDK web não permite consultar dentro de `runTransaction` — então há uma
 * janela de corrida se dois admins se rebaixarem ao mesmo tempo. As Security
 * Rules impedem escalada de privilégio (só admin escreve `papel`), mas não
 * sabem contar documentos. A garantia definitiva da regra 2 exige uma Cloud
 * Function; enquanto ela não existe, isto é proteção contra engano, não contra
 * ataque. Ver `firestore.rules` e `docs/progresso.md`.
 */
export async function alterarPapel(
  alvo: PerfilUsuario,
  novoPapel: Papel,
  ator: PerfilUsuario,
): Promise<void> {
  const banco = requireDb();

  if (alvo.uid === ator.uid) {
    throw new ErroDeRegra('Você não pode alterar o próprio papel por aqui.');
  }

  if (novoPapel === alvo.papel) {
    throw new ErroDeRegra(`${alvo.nome || alvo.email} já é ${novoPapel}.`);
  }

  if (alvo.papel === 'administrador' && novoPapel !== 'administrador') {
    const admins = await getDocs(
      query(collection(banco, USUARIOS), where('papel', '==', 'administrador')),
    );

    if (admins.size <= 1) {
      throw new ErroDeRegra('Este é o último administrador. Promova outra pessoa antes.');
    }
  }

  const referencia = doc(banco, USUARIOS, alvo.uid);

  await runTransaction(banco, async (transacao) => {
    const atual = await transacao.get(referencia);

    if (!atual.exists()) {
      throw new ErroDeRegra('Este usuário não existe mais.');
    }

    // Reconfere contra o documento, não contra o que a lista mostrava.
    const papelAtual = paraPerfil(alvo.uid, atual.data()).papel;
    if (papelAtual !== alvo.papel) {
      throw new ErroDeConflito('O papel desta pessoa mudou enquanto você decidia. Confira de novo.');
    }

    transacao.update(referencia, { papel: novoPapel });
  });

  // Registro do nó `600:75`: ator, alvo, valores anterior/novo, data e resultado.
  await addDoc(collection(banco, AUDITORIA), {
    acao: 'alterar-papel',
    atorUid: ator.uid,
    atorEmail: ator.email,
    alvoUid: alvo.uid,
    alvoEmail: alvo.email,
    papelAnterior: alvo.papel,
    papelNovo: novoPapel,
    resultado: 'sucesso',
    em: serverTimestamp(),
  });
}

// --- Biblioteca --------------------------------------------------------------

function paraRecurso(id: string, dados: DocumentData): RecursoBiblioteca {
  const tipo = daLista<TipoRecurso>(dados.tipo, TIPOS_RECURSO, 'video');

  return {
    id,
    tipo,
    titulo: texto(dados.titulo),
    criador: texto(dados.criador),
    url: texto(dados.url),
    videoId: texto(dados.videoId) || null,
    edicao: texto(dados.edicao),
    // Afiliado só existe em livro; um `true` perdido num vídeo não vale.
    afiliado: tipo === 'livro' && dados.afiliado === true,
    recomendacao: texto(dados.recomendacao),
    status: (texto(dados.status) || 'rascunho') as StatusConteudo,
    atualizadoEm: millis(dados.atualizadoEm),
    versao: typeof dados.versao === 'number' ? dados.versao : 1,
  };
}

/**
 * O que se grava a partir do formulário: espaços das pontas removidos
 * ("normalizar espaços", `668:121`), campos de livro zerados em vídeo e o
 * `videoId` derivado do link — o app nunca precisa reinterpretar a URL.
 */
function gravavelDoRecurso(rascunho: RascunhoRecurso) {
  const livro = rascunho.tipo === 'livro';
  const url = rascunho.url.trim();

  return {
    tipo: rascunho.tipo,
    titulo: rascunho.titulo.trim(),
    criador: rascunho.criador.trim(),
    url,
    videoId: livro ? null : idDoVideoDoYoutube(url),
    edicao: livro ? rascunho.edicao.trim() : '',
    afiliado: livro && rascunho.afiliado,
    recomendacao: rascunho.recomendacao.trim(),
  };
}

/** Lista a Biblioteca em tempo real, mais recente primeiro. */
export function observarRecursos(
  aoMudar: (recursos: RecursoBiblioteca[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, BIBLIOTECA), orderBy('atualizadoEm', 'desc')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraRecurso(d.id, d.data()))),
      falhar,
    ),
  );
}

/**
 * O que o app mostra: só publicados.
 *
 * O filtro tem de estar na consulta — as regras não filtram resultados, e uma
 * consulta que pudesse devolver um rascunho seria recusada inteira para quem
 * não é da redação. A ordem é feita aqui: `where` num campo e `orderBy` em
 * outro exigiriam índice composto, e a Biblioteca é pequena.
 */
export function observarRecursosPublicados(
  aoMudar: (recursos: RecursoBiblioteca[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, BIBLIOTECA), where('status', '==', 'publicado')),
      (instantaneo) =>
        aoMudar(
          instantaneo.docs
            .map((d) => paraRecurso(d.id, d.data()))
            .sort((a, b) => b.atualizadoEm - a.atualizadoEm || a.id.localeCompare(b.id)),
        ),
      falhar,
    ),
  );
}

export function observarRecurso(
  id: string,
  aoMudar: (recurso: RecursoBiblioteca | null) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      doc(banco, BIBLIOTECA, id),
      (instantaneo) =>
        aoMudar(instantaneo.exists() ? paraRecurso(instantaneo.id, instantaneo.data()) : null),
      falhar,
    ),
  );
}

/** Cria um recurso, sempre como rascunho — "salvar rascunho não publica". */
export async function criarRecurso(rascunho: RascunhoRecurso, autorUid: string): Promise<string> {
  const referencia = await addDoc(collection(requireDb(), BIBLIOTECA), {
    ...gravavelDoRecurso(rascunho),
    status: 'rascunho' satisfies StatusConteudo,
    versao: 1,
    criadoPor: autorUid,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return referencia.id;
}

/**
 * Lê o recurso dentro da transação e confere a versão — o miolo comum de
 * salvar, publicar, arquivar e restaurar.
 */
async function recursoNaVersao(
  transacao: Transaction,
  id: string,
  versaoEsperada: number,
) {
  const referencia = doc(requireDb(), BIBLIOTECA, id);
  const atual = await transacao.get(referencia);

  if (!atual.exists()) {
    throw new ErroDeRegra('Este recurso não existe mais.');
  }

  const recurso = paraRecurso(atual.id, atual.data());

  if (recurso.versao !== versaoEsperada) {
    throw new ErroDeConflito(
      'Este recurso mudou em outra aba desde que você abriu. Recarregue para não perder o que a outra pessoa escreveu.',
    );
  }

  return { referencia, recurso, dados: atual.data() };
}

/**
 * Grava o rascunho. Um recurso publicado continua publicado: a correção vai
 * direto para o app, como no conteúdo — o painel ainda não separa revisão em
 * rascunho da versão publicada (`668:114`).
 */
export async function salvarRecurso(
  id: string,
  rascunho: RascunhoRecurso,
  versaoEsperada: number,
  autorUid: string,
): Promise<number> {
  return runTransaction(requireDb(), async (transacao) => {
    const { referencia, recurso } = await recursoNaVersao(transacao, id, versaoEsperada);

    // Publicado não pode ficar inválido por uma edição: o app leria um link
    // quebrado. Rascunho pode ficar incompleto à vontade.
    if (recurso.status === 'publicado') {
      const pendencias = pendenciasDoRecurso(rascunho);
      if (pendencias.length > 0) {
        throw new ErroDeRegra(`Este recurso está publicado. Corrija antes de salvar: ${pendencias.join(' ')}`);
      }
    }

    const proxima = recurso.versao + 1;

    transacao.update(referencia, {
      ...gravavelDoRecurso(rascunho),
      versao: proxima,
      atualizadoPor: autorUid,
      atualizadoEm: serverTimestamp(),
    });

    return proxima;
  });
}

/** Publica, revalidando dentro da transação — a tela não é a garantia. */
export async function publicarRecurso(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<void> {
  await runTransaction(requireDb(), async (transacao) => {
    const { referencia, recurso } = await recursoNaVersao(transacao, id, versaoEsperada);

    const pendencias = pendenciasDoRecurso(recurso);
    if (pendencias.length > 0) {
      throw new ErroDeRegra(`Não dá para publicar ainda: ${pendencias.join(' ')}`);
    }

    transacao.update(referencia, {
      status: 'publicado' satisfies StatusConteudo,
      statusAnterior: null,
      versao: recurso.versao + 1,
      publicadoPor: autorUid,
      publicadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/**
 * Arquiva — "arquivar remove das listas" (`668:156`). Sem checagem de agenda:
 * a seleção semanal da Biblioteca saiu do contrato, então nada aponta para um
 * recurso além do próprio catálogo.
 */
export async function arquivarRecurso(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<void> {
  await runTransaction(requireDb(), async (transacao) => {
    const { referencia, recurso } = await recursoNaVersao(transacao, id, versaoEsperada);

    if (recurso.status === 'arquivado') {
      throw new ErroDeRegra('Este recurso já está arquivado.');
    }

    transacao.update(referencia, {
      status: 'arquivado' satisfies StatusConteudo,
      statusAnterior: recurso.status,
      versao: recurso.versao + 1,
      arquivadoPor: autorUid,
      arquivadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/** Devolve ao status de antes do arquivamento, como `restaurarConteudo`. */
export async function restaurarRecurso(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<StatusConteudo> {
  return runTransaction(requireDb(), async (transacao) => {
    const { referencia, recurso, dados } = await recursoNaVersao(transacao, id, versaoEsperada);

    if (recurso.status !== 'arquivado') {
      throw new ErroDeRegra('Este recurso não está arquivado.');
    }

    const destino: StatusConteudo =
      texto(dados.statusAnterior) === 'publicado' ? 'publicado' : 'rascunho';

    transacao.update(referencia, {
      status: destino,
      statusAnterior: null,
      versao: recurso.versao + 1,
      restauradoPor: autorUid,
      restauradoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return destino;
  });
}

// --- Atividades --------------------------------------------------------------

function objetos(valor: unknown): Record<string, unknown>[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];
}

function paraOrdenacao(valor: unknown): DinamicaOrdenacao {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const blocos = objetos(bruto.blocos)
    .map((item) => ({ id: texto(item.id), texto: texto(item.texto), distrator: item.distrator === true }))
    // Bloco sem id não tem como entrar numa tentativa: ela guarda ids.
    .filter((bloco) => bloco.id);

  return {
    fraseBase: texto(bruto.fraseBase),
    blocos: blocos.length > 0 ? blocos : atividadeVazia('ordenacao').ordenacao.blocos,
    mensagemTentativa: texto(bruto.mensagemTentativa),
    explicacao: texto(bruto.explicacao),
  };
}

function paraEscolha(valor: unknown, tipo: TipoAtividade): DinamicaEscolha {
  const bruto = (valor ?? {}) as Record<string, unknown>;
  const base = atividadeVazia(tipo).escolha;
  const alternativas = objetos(bruto.alternativas)
    .map((item) => ({ id: texto(item.id), texto: texto(item.texto), devolutiva: texto(item.devolutiva) }))
    .filter((alternativa) => alternativa.id);
  const mensagem = bruto.mensagem && typeof bruto.mensagem === 'object'
    ? (bruto.mensagem as Record<string, unknown>)
    : null;

  return {
    situacao: texto(bruto.situacao),
    pergunta: texto(bruto.pergunta),
    alternativas: alternativas.length > 0 ? alternativas : base.alternativas,
    modo: daLista<ModoResposta>(bruto.modo, MODOS_RESPOSTA, base.modo),
    respostaId: texto(bruto.respostaId),
    devolutivaLivre: daLista<DevolutivaLivre>(bruto.devolutivaLivre, DEVOLUTIVAS_LIVRES, base.devolutivaLivre),
    devolutivaComum: texto(bruto.devolutivaComum),
    mensagem: mensagem
      ? {
          remetente: texto(mensagem.remetente),
          identificador: texto(mensagem.identificador),
          corpo: texto(mensagem.corpo),
          endereco: texto(mensagem.endereco),
          observacao: texto(mensagem.observacao),
        }
      : null,
  };
}

function paraAtividade(id: string, dados: DocumentData): Atividade {
  const tipo = daLista<TipoAtividade>(dados.tipo, TIPOS_ATIVIDADE, 'reflexao');
  const conclusao = (dados.conclusao ?? {}) as Record<string, unknown>;

  return {
    id,
    tipo,
    titulo: texto(dados.titulo),
    duracaoMinutos: typeof dados.duracaoMinutos === 'number' ? dados.duracaoMinutos : 0,
    instrucao: texto(dados.instrucao),
    filosofoId: texto(dados.filosofoId),
    temaIds: Array.isArray(dados.temaIds)
      ? dados.temaIds.filter((t): t is string => typeof t === 'string')
      : [],
    conteudoId: texto(dados.conteudoId),
    ordenacao: paraOrdenacao(dados.ordenacao),
    escolha: paraEscolha(dados.escolha, tipo),
    conclusao: { titulo: texto(conclusao.titulo), texto: texto(conclusao.texto) },
    status: (texto(dados.status) || 'rascunho') as StatusConteudo,
    atualizadoEm: millis(dados.atualizadoEm),
    versao: typeof dados.versao === 'number' ? dados.versao : 1,
  };
}

/**
 * O que se grava a partir do formulário: pontas aparadas, mensagem simulada
 * só em situação e a sequência correta derivada da ordem dos blocos — o app
 * confere a tentativa contra `sequencia` sem reinterpretar a lista.
 */
function gravavelDaAtividade(rascunho: RascunhoAtividade) {
  const { ordenacao, escolha } = rascunho;
  const mensagem = rascunho.tipo === 'situacao' ? escolha.mensagem : null;

  return {
    tipo: rascunho.tipo,
    titulo: rascunho.titulo.trim(),
    duracaoMinutos: rascunho.duracaoMinutos,
    instrucao: rascunho.instrucao.trim(),
    filosofoId: rascunho.filosofoId,
    temaIds: rascunho.temaIds,
    conteudoId: rascunho.conteudoId,
    ordenacao: {
      fraseBase: ordenacao.fraseBase.trim(),
      blocos: ordenacao.blocos.map((bloco) => ({ ...bloco, texto: bloco.texto.trim() })),
      sequencia: sequenciaCorreta(ordenacao),
      mensagemTentativa: ordenacao.mensagemTentativa.trim(),
      explicacao: ordenacao.explicacao.trim(),
    },
    escolha: {
      situacao: escolha.situacao.trim(),
      pergunta: escolha.pergunta.trim(),
      alternativas: escolha.alternativas.map((alternativa) => ({
        id: alternativa.id,
        texto: alternativa.texto.trim(),
        devolutiva: alternativa.devolutiva.trim(),
      })),
      modo: escolha.modo,
      // Resposta indicada só existe no modo orientado: no livre não há
      // gabarito, e um id perdido ali seria um "certo" escondido.
      respostaId: escolha.modo === 'orientado' ? escolha.respostaId : '',
      devolutivaLivre: escolha.devolutivaLivre,
      devolutivaComum: escolha.devolutivaComum.trim(),
      mensagem: mensagem
        ? {
            remetente: mensagem.remetente.trim(),
            identificador: mensagem.identificador.trim(),
            corpo: mensagem.corpo.trim(),
            endereco: mensagem.endereco.trim(),
            observacao: mensagem.observacao.trim(),
          }
        : null,
    },
    conclusao: {
      titulo: rascunho.conclusao.titulo.trim(),
      texto: rascunho.conclusao.texto.trim(),
    },
  };
}

/** Lista as atividades em tempo real, mais recente primeiro. */
export function observarAtividades(
  aoMudar: (atividades: Atividade[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, ATIVIDADES), orderBy('atualizadoEm', 'desc')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraAtividade(d.id, d.data()))),
      falhar,
    ),
  );
}

/**
 * O que o app mostra: só publicadas. O filtro tem de estar na consulta — ver
 * `observarRecursosPublicados` — e a ordem é feita aqui pelo mesmo motivo.
 */
export function observarAtividadesPublicadas(
  aoMudar: (atividades: Atividade[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      query(collection(banco, ATIVIDADES), where('status', '==', 'publicado')),
      (instantaneo) =>
        aoMudar(
          instantaneo.docs
            .map((d) => paraAtividade(d.id, d.data()))
            .sort((a, b) => b.atualizadoEm - a.atualizadoEm || a.id.localeCompare(b.id)),
        ),
      falhar,
    ),
  );
}

export function observarAtividade(
  id: string,
  aoMudar: (atividade: Atividade | null) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco, falhar) =>
    onSnapshot(
      doc(banco, ATIVIDADES, id),
      (instantaneo) =>
        aoMudar(instantaneo.exists() ? paraAtividade(instantaneo.id, instantaneo.data()) : null),
      falhar,
    ),
  );
}

/** Cria uma atividade, sempre como rascunho. */
export async function criarAtividade(rascunho: RascunhoAtividade, autorUid: string): Promise<string> {
  const referencia = await addDoc(collection(requireDb(), ATIVIDADES), {
    ...gravavelDaAtividade(rascunho),
    status: 'rascunho' satisfies StatusConteudo,
    versao: 1,
    criadoPor: autorUid,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });

  return referencia.id;
}

/** Lê a atividade dentro da transação e confere a versão, como `recursoNaVersao`. */
async function atividadeNaVersao(transacao: Transaction, id: string, versaoEsperada: number) {
  const referencia = doc(requireDb(), ATIVIDADES, id);
  const atual = await transacao.get(referencia);

  if (!atual.exists()) {
    throw new ErroDeRegra('Esta atividade não existe mais.');
  }

  const atividade = paraAtividade(atual.id, atual.data());

  if (atividade.versao !== versaoEsperada) {
    throw new ErroDeConflito(
      'Esta atividade mudou em outra aba desde que você abriu. Recarregue para não perder o que a outra pessoa escreveu.',
    );
  }

  return { referencia, atividade, dados: atual.data() };
}

/** Grava o rascunho. Publicada continua publicada, mas não pode ficar inválida. */
export async function salvarAtividade(
  id: string,
  rascunho: RascunhoAtividade,
  versaoEsperada: number,
  autorUid: string,
): Promise<number> {
  return runTransaction(requireDb(), async (transacao) => {
    const { referencia, atividade } = await atividadeNaVersao(transacao, id, versaoEsperada);

    if (atividade.status === 'publicado') {
      const pendencias = pendenciasDaAtividade(rascunho);
      if (pendencias.length > 0) {
        throw new ErroDeRegra(`Esta atividade está publicada. Corrija antes de salvar: ${pendencias.join(' ')}`);
      }
    }

    const proxima = atividade.versao + 1;

    transacao.update(referencia, {
      ...gravavelDaAtividade(rascunho),
      versao: proxima,
      atualizadoPor: autorUid,
      atualizadoEm: serverTimestamp(),
    });

    return proxima;
  });
}

/** Publica, revalidando dentro da transação — a tela não é a garantia. */
export async function publicarAtividade(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<void> {
  await runTransaction(requireDb(), async (transacao) => {
    const { referencia, atividade } = await atividadeNaVersao(transacao, id, versaoEsperada);

    const pendencias = pendenciasDaAtividade(atividade);
    if (pendencias.length > 0) {
      throw new ErroDeRegra(`Não dá para publicar ainda: ${pendencias.join(' ')}`);
    }

    transacao.update(referencia, {
      status: 'publicado' satisfies StatusConteudo,
      statusAnterior: null,
      versao: atividade.versao + 1,
      publicadoPor: autorUid,
      publicadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/**
 * Arquiva — "arquivar retira do catálogo e preserva o histórico" (`643:1270`).
 *
 * Recusa enquanto uma aula publicada tiver esta atividade como "Atividade da
 * semana": arquivar tiraria do app o exercício que a aula promete. A consulta
 * roda antes da transação porque transação no cliente só lê documento por id.
 */
export async function arquivarAtividade(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<void> {
  const vinculadas = await getDocs(
    query(collection(requireDb(), CONTEUDOS), where('aula.atividadeId', '==', id)),
  );
  const aula = vinculadas.docs
    .map((d) => paraConteudo(d.id, d.data()))
    .find((conteudo) => conteudo.status === 'publicado');

  if (aula) {
    throw new ErroDeRegra(
      `A aula publicada “${aula.titulo || 'sem título'}” usa esta atividade. Troque a atividade da aula antes de arquivar.`,
    );
  }

  await runTransaction(requireDb(), async (transacao) => {
    const { referencia, atividade } = await atividadeNaVersao(transacao, id, versaoEsperada);

    if (atividade.status === 'arquivado') {
      throw new ErroDeRegra('Esta atividade já está arquivada.');
    }

    transacao.update(referencia, {
      status: 'arquivado' satisfies StatusConteudo,
      statusAnterior: atividade.status,
      versao: atividade.versao + 1,
      arquivadoPor: autorUid,
      arquivadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

/** Devolve ao status de antes do arquivamento. */
export async function restaurarAtividade(
  id: string,
  versaoEsperada: number,
  autorUid: string,
): Promise<StatusConteudo> {
  return runTransaction(requireDb(), async (transacao) => {
    const { referencia, atividade, dados } = await atividadeNaVersao(transacao, id, versaoEsperada);

    if (atividade.status !== 'arquivado') {
      throw new ErroDeRegra('Esta atividade não está arquivada.');
    }

    const destino: StatusConteudo =
      texto(dados.statusAnterior) === 'publicado' ? 'publicado' : 'rascunho';

    transacao.update(referencia, {
      status: destino,
      statusAnterior: null,
      versao: atividade.versao + 1,
      restauradoPor: autorUid,
      restauradoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return destino;
  });
}
