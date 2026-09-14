import {
  addDoc,
  collection,
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
  where,
  type DocumentData,
} from 'firebase/firestore';

import { db, requireDb } from '@/lib/firebase';
import { PAPEL_PADRAO, type Papel, type PerfilUsuario } from '@/lib/perfil';
import {
  aplicacaoVazia,
  textoPorNivelVazio,
  type Conteudo,
  type DestaqueAgendado,
  type Formato,
  type RascunhoConteudo,
  type StatusConteudo,
  type TextoPorNivel,
  pendenciasParaPublicar,
} from '@/lib/admin/tipos';

const CONTEUDOS = 'conteudos';
const AGENDA = 'agenda';
const USUARIOS = 'usuarios';
const AUDITORIA = 'auditoria';

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

const SEM_FIREBASE =
  'Firebase não configurado. Preencha o .env com as credenciais do projeto (ver docs/painel-admin.md).';

/**
 * As funções `observar*` nunca lançam: sem Firestore, avisam pelo callback de
 * falha e devolvem um cancelamento vazio. Assim a tela trata "não configurado"
 * pelo mesmo caminho de qualquer outro erro, sem try/catch em volta do efeito.
 */
function assinar(
  aoFalhar: (erro: Error) => void,
  montar: (banco: NonNullable<typeof db>) => () => void,
): () => void {
  if (!db) {
    queueMicrotask(() => aoFalhar(new Error(SEM_FIREBASE)));
    return () => {};
  }

  try {
    return montar(db);
  } catch (falha) {
    queueMicrotask(() =>
      aoFalhar(falha instanceof Error ? falha : new Error('Falha ao abrir a consulta.')),
    );
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

function paraConteudo(id: string, dados: DocumentData): Conteudo {
  const aplicacao = (dados.aplicacao ?? {}) as Record<string, unknown>;

  return {
    id,
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
  return assinar(aoFalhar, (banco) =>
    onSnapshot(
      query(collection(banco, CONTEUDOS), orderBy('atualizadoEm', 'desc')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraConteudo(d.id, d.data()))),
      aoFalhar,
    ),
  );
}

export function observarConteudo(
  id: string,
  aoMudar: (conteudo: Conteudo | null) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco) =>
    onSnapshot(
      doc(banco, CONTEUDOS, id),
      (instantaneo) =>
        aoMudar(instantaneo.exists() ? paraConteudo(instantaneo.id, instantaneo.data()) : null),
      aoFalhar,
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

    transacao.update(referencia, {
      status: 'publicado' satisfies StatusConteudo,
      versao: conteudo.versao + 1,
      publicadoPor: autorUid,
      publicadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  });
}

// --- Conhecimento do dia -----------------------------------------------------

function paraDestaque(id: string, dados: DocumentData): DestaqueAgendado {
  return {
    id,
    conteudoId: texto(dados.conteudoId),
    data: texto(dados.data),
    fuso: texto(dados.fuso),
    agendadoPor: texto(dados.agendadoPor),
    agendadoEm: millis(dados.agendadoEm),
  };
}

export function observarAgenda(
  aoMudar: (destaques: DestaqueAgendado[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco) =>
    onSnapshot(
      query(collection(banco, AGENDA), orderBy('data', 'desc')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraDestaque(d.id, d.data()))),
      aoFalhar,
    ),
  );
}

/**
 * Programa o destaque do dia.
 *
 * Recusa conteúdo que não esteja publicado e data já ocupada — a menos que
 * `substituir` seja verdadeiro, o que a tela só envia após confirmação.
 */
export async function programarDestaque(
  entrada: { conteudoId: string; data: string; fuso: string },
  autorUid: string,
  substituir = false,
): Promise<void> {
  const banco = requireDb();

  const conteudo = await getDoc(doc(banco, CONTEUDOS, entrada.conteudoId));

  if (!conteudo.exists()) {
    throw new ErroDeRegra('Conteúdo não encontrado.');
  }
  if (texto(conteudo.data().status) !== 'publicado') {
    throw new ErroDeRegra('Só é possível destacar um conteúdo publicado.');
  }

  const ocupada = await getDocs(
    query(collection(banco, AGENDA), where('data', '==', entrada.data)),
  );

  const existente = ocupada.docs[0];

  if (existente && !substituir) {
    throw new ErroDeRegra('Já existe destaque nesta data.');
  }

  const payload = {
    conteudoId: entrada.conteudoId,
    data: entrada.data,
    fuso: entrada.fuso,
    agendadoPor: autorUid,
    agendadoEm: serverTimestamp(),
  };

  if (existente) {
    await setDoc(doc(banco, AGENDA, existente.id), payload);
    return;
  }

  await addDoc(collection(banco, AGENDA), payload);
}

// --- Usuários e permissões ---------------------------------------------------

function paraPerfil(uid: string, dados: DocumentData): PerfilUsuario {
  const papel = texto(dados.papel);

  return {
    uid,
    nome: texto(dados.nome),
    email: texto(dados.email),
    papel: (papel === 'editor' || papel === 'administrador' ? papel : PAPEL_PADRAO) as Papel,
    // O painel não usa preferências; lê como nulo para não alegar o que não leu.
    preferencias: null,
  };
}

export function observarUsuarios(
  aoMudar: (usuarios: PerfilUsuario[]) => void,
  aoFalhar: (erro: Error) => void,
): () => void {
  return assinar(aoFalhar, (banco) =>
    onSnapshot(
      query(collection(banco, USUARIOS), orderBy('nome')),
      (instantaneo) => aoMudar(instantaneo.docs.map((d) => paraPerfil(d.id, d.data()))),
      aoFalhar,
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
