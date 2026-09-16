/**
 * Modelo de conteúdo do PAUSA — contrato do handoff `600:74`.
 *
 * "Um contentId, authorId, themeIds e versões por nível. Aplicação cotidiana
 * com vínculo ao contentId e versões próprias por nível; cadastrar/editar uma
 * vez, exibir nos dois caminhos. Salvar rascunho com níveis incompletos;
 * publicar somente após validação dos quatro."
 */

export const NIVEIS = ['leigo', 'curioso', 'estudioso', 'erudito'] as const;
export type Nivel = (typeof NIVEIS)[number];

export const ROTULO_NIVEL: Record<Nivel, string> = {
  leigo: 'Leigo',
  curioso: 'Curioso',
  estudioso: 'Estudioso',
  erudito: 'Erudito',
};

export const FORMATOS = ['leitura', 'video'] as const;
export type Formato = (typeof FORMATOS)[number];

export const ROTULO_FORMATO: Record<Formato, string> = {
  leitura: 'Leitura',
  video: 'Vídeo',
};

/**
 * `arquivado` é a exclusão do painel.
 *
 * Apagar de verdade deixaria destaque órfão na agenda e sumiria com o histórico
 * editorial; arquivar tira o conteúdo do app e do catálogo sem perder o
 * registro, e volta atrás. As Security Rules já escondem de quem não é da
 * redação: só `publicado` é legível por usuário comum.
 */
export type StatusConteudo = 'rascunho' | 'publicado' | 'arquivado';

export const ROTULO_STATUS: Record<StatusConteudo, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
};

/** Texto por nível. Vazio significa "ainda não escrito". */
export type TextoPorNivel = Record<Nivel, string>;

export function textoPorNivelVazio(): TextoPorNivel {
  return { leigo: '', curioso: '', estudioso: '', erudito: '' };
}

export function niveisPreenchidos(textos: TextoPorNivel): Nivel[] {
  return NIVEIS.filter((nivel) => textos[nivel].trim().length > 0);
}

/**
 * Aplicação prática vinculada ao conteúdo.
 *
 * Não é um registro separado no catálogo: mora dentro do conteúdo e é exibida
 * em dois caminhos (na página do conteúdo e em Filosofia no Cotidiano), sem
 * cópia — é o "um registro, dois pontos de acesso" do nó `597:59`.
 */
export type AplicacaoCotidiana = {
  titulo: string;
  textos: TextoPorNivel;
};

export function aplicacaoVazia(): AplicacaoCotidiana {
  return { titulo: '', textos: textoPorNivelVazio() };
}

export function aplicacaoVinculada(aplicacao: AplicacaoCotidiana): boolean {
  return aplicacao.titulo.trim().length > 0 && niveisPreenchidos(aplicacao.textos).length > 0;
}

export type Conteudo = {
  id: string;
  titulo: string;
  /** Filósofo. Id estável para que renomear o filósofo não quebre o vínculo. */
  autorId: string;
  formato: Formato;
  temaIds: string[];
  fonte: string;
  textos: TextoPorNivel;
  aplicacao: AplicacaoCotidiana;
  status: StatusConteudo;
  atualizadoEm: number;
  /**
   * Sobe a cada gravação. O editor guarda a versão que carregou e recusa salvar
   * por cima de uma versão mais nova — é o "conflito de edição" do nó `600:76`.
   */
  versao: number;
};

export type RascunhoConteudo = Omit<Conteudo, 'id' | 'atualizadoEm' | 'versao' | 'status'>;

export function conteudoVazio(): RascunhoConteudo {
  return {
    titulo: '',
    autorId: '',
    formato: 'leitura',
    temaIds: [],
    fonte: '',
    textos: textoPorNivelVazio(),
    aplicacao: aplicacaoVazia(),
  };
}

/** Motivos que impedem a publicação. Lista vazia = pode publicar. */
export function pendenciasParaPublicar(conteudo: RascunhoConteudo): string[] {
  const pendencias: string[] = [];

  if (!conteudo.titulo.trim()) pendencias.push('Informe o título.');
  if (!conteudo.autorId) pendencias.push('Escolha o filósofo.');
  if (conteudo.temaIds.length === 0) pendencias.push('Escolha ao menos um tema.');
  if (!conteudo.fonte.trim()) pendencias.push('Informe a fonte e referência.');

  const faltando = NIVEIS.filter((nivel) => !conteudo.textos[nivel].trim());
  if (faltando.length > 0) {
    pendencias.push(
      `Escreva o texto de ${faltando.map((nivel) => ROTULO_NIVEL[nivel]).join(', ')}.`,
    );
  }

  return pendencias;
}

/**
 * Destaque do dia: guarda a REFERÊNCIA ao conteúdo e a data, nunca uma cópia
 * do texto (nó `600:74`). Assim, corrigir o conteúdo corrige o destaque.
 */
export type DestaqueAgendado = {
  id: string;
  conteudoId: string;
  /** `AAAA-MM-DD` no fuso editorial — uma data, não um instante. */
  data: string;
  fuso: string;
  agendadoPor: string;
  agendadoEm: number;
};

export const FUSO_EDITORIAL_PADRAO = 'America/Sao_Paulo';

/**
 * Filósofo — cadastro próprio desde 2026-09-15 (nós `643:947`, `643:948`,
 * `643:1215`). Deixou de ser constante no código e virou coleção no Firestore.
 *
 * O `id` continua sendo o mesmo texto de antes (`seneca`, `marco-aurelio`…):
 * é ele que os conteúdos já cadastrados guardam em `autorId`, e trocá-lo
 * deixaria cada conteúdo sem autor.
 */
export type Filosofo = {
  id: string;
  nome: string;
  biografia: string;
  /**
   * Endereço da foto. Nulo enquanto não houver upload — o contrato `643:1269`
   * diz que sem foto o app mostra a inicial do nome.
   */
  fotoUrl: string | null;
  atualizadoEm: number;
};

/** O que o formulário edita. Id, foto e data são do repositório. */
export type RascunhoFilosofo = Pick<Filosofo, 'nome' | 'biografia'>;

export function filosofoVazio(): RascunhoFilosofo {
  return { nome: '', biografia: '' };
}

/** Nome é obrigatório e não pode ser só espaço em branco (contrato `643:1269`). */
export function pendenciasDoFilosofo(rascunho: RascunhoFilosofo): string[] {
  const pendencias: string[] = [];

  if (!rascunho.nome.trim()) pendencias.push('Informe o nome do filósofo.');

  return pendencias;
}

/** Inicial exibida no lugar da foto. Uma letra, maiúscula. */
export function inicialDoNome(nome: string): string {
  return nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
}

export type Tema = { id: string; nome: string };
