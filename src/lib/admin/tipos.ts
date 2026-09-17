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
  /** Artigo ou aula. Documento gravado antes de 16/09 não tem o campo: é artigo. */
  tipo: TipoConteudo;
  titulo: string;
  /** Filósofo. Id estável para que renomear o filósofo não quebre o vínculo. */
  autorId: string;
  formato: Formato;
  temaIds: string[];
  fonte: string;
  textos: TextoPorNivel;
  aplicacao: AplicacaoCotidiana;
  /** Identificação e quatro etapas por nível. Vazia quando `tipo` é `artigo`. */
  aula: DadosDaAula;
  status: StatusConteudo;
  atualizadoEm: number;
  /**
   * Sobe a cada gravação. O editor guarda a versão que carregou e recusa salvar
   * por cima de uma versão mais nova — é o "conflito de edição" do nó `600:76`.
   */
  versao: number;
};

export type RascunhoConteudo = Omit<Conteudo, 'id' | 'atualizadoEm' | 'versao' | 'status'>;

export function conteudoVazio(tipo: TipoConteudo = 'artigo'): RascunhoConteudo {
  return {
    tipo,
    titulo: '',
    autorId: '',
    formato: 'leitura',
    temaIds: [],
    fonte: '',
    textos: textoPorNivelVazio(),
    aplicacao: aplicacaoVazia(),
    aula: aulaVazia(),
  };
}

/**
 * O que o formulário edita, a partir do documento lido.
 *
 * Existe para que acrescentar um campo ao conteúdo não exija lembrar de
 * copiá-lo em cada editor — foi assim que `tipo` e `aula` quase ficaram de
 * fora do editor de artigo.
 */
export function paraRascunho(conteudo: Conteudo): RascunhoConteudo {
  const { id, status, atualizadoEm, versao, ...rascunho } = conteudo;

  return rascunho;
}

/**
 * Motivos que impedem a publicação. Lista vazia = pode publicar.
 *
 * Despacha por tipo porque artigo e aula são registros diferentes: um tem um
 * texto por nível, a outra tem as quatro etapas. Publicar passa por aqui
 * (`publicarConteudo`), então a trava vale para os dois sem a tela precisar
 * escolher a validação certa.
 */
export function pendenciasParaPublicar(conteudo: RascunhoConteudo): string[] {
  if (conteudo.tipo === 'aula') return pendenciasDaAula(conteudo);

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

// --- Aula: o Conhecimento da semana ------------------------------------------

/**
 * Tipo do registro no acervo.
 *
 * O catálogo é um só — "artigos, aulas e recursos compartilham o acervo"
 * (`672:1248`). O que muda é o editor: o artigo tem um texto por nível; a aula
 * tem as quatro etapas do contrato em cada um dos quatro níveis. `recurso`
 * (Biblioteca) ficou de fora porque nenhuma tela sabe abrir um, e um tipo sem
 * editor só produziria registro órfão no catálogo.
 */
export const TIPOS_CONTEUDO = ['artigo', 'aula'] as const;
export type TipoConteudo = (typeof TIPOS_CONTEUDO)[number];

export const ROTULO_TIPO: Record<TipoConteudo, string> = {
  artigo: 'Artigo',
  aula: 'Aula',
};

/**
 * Origem do texto (`670:1277`).
 *
 * Existe para decidir as aspas: o contrato só admite aspas em citação
 * conferida, e a adaptação da PAUSA precisa dizer que é adaptação.
 */
export const MODOS_FONTE = ['citacao', 'adaptacao'] as const;
export type ModoFonte = (typeof MODOS_FONTE)[number];

export const ROTULO_MODO_FONTE: Record<ModoFonte, string> = {
  citacao: 'Citação conferida',
  adaptacao: 'Adaptação da PAUSA',
};

/**
 * Alternativa da reflexão.
 *
 * O `id` é sorteado uma vez e nunca muda — é ele que a resposta da pessoa vai
 * guardar. Se a opção fosse identificada pela posição, corrigir a redação ou
 * reordenar a lista reescreveria o que já foi respondido.
 */
export type OpcaoReflexao = { id: string; texto: string };

export const MIN_OPCOES_REFLEXAO = 2;
export const MAX_OPCOES_REFLEXAO = 6;

/** Limites da frase do card da Home (`703:193`). */
export const MIN_FRASE_DESTAQUE = 10;
export const MAX_FRASE_DESTAQUE = 80;

export function novaOpcaoReflexao(): OpcaoReflexao {
  return { id: `op-${Math.random().toString(36).slice(2, 10)}`, texto: '' };
}

/**
 * As quatro etapas de um nível de leitura (`668:202`, seções 03 a 06).
 *
 * Tudo aqui é por nível de propósito: a mesma aula explicada para o Leigo e
 * para o Erudito muda de pergunta, de fonte e de conclusão, não só de texto.
 */
export type EtapasDaAula = {
  /** Etapa 1 — introdução e ideia central. */
  introducao: string;
  modoFonte: ModoFonte;
  /** Obra, edição e localização da passagem de referência. */
  fonte: string;
  explicacao: string;
  /** Etapa 2 — pergunta da reflexão. */
  pergunta: string;
  /** De 2 a 6, seleção única. */
  opcoes: OpcaoReflexao[];
  /**
   * O que se diz depois da escolha. Sem pontuação: reflexão não tem gabarito.
   *
   * **Opcional desde 16/09**: o desenho da tela trocou o campo pela frase fixa
   * "a reflexão não atribui nota; no aplicativo, a pessoa escolhe uma
   * alternativa" (`668:202`). O contrato editorial ainda cita "orientação sem
   * pontuação" no passo 2, então o campo continua existindo e gravando — mas
   * deixou de impedir a publicação.
   */
  orientacao: string;
  /** Etapa 3 — prática e compromisso. */
  pratica: string;
  /** Etapa 4 — síntese da experiência. */
  sintese: string;
  /** Etapa 4 — a frase que fica. */
  leveComVoce: string;
};

export type EtapasPorNivel = Record<Nivel, EtapasDaAula>;

export function etapasVazias(): EtapasDaAula {
  return {
    introducao: '',
    // Adaptação é o padrão seguro: assumir citação abriria aspas em texto que
    // ninguém conferiu contra a obra.
    modoFonte: 'adaptacao',
    fonte: '',
    explicacao: '',
    pergunta: '',
    opcoes: [novaOpcaoReflexao(), novaOpcaoReflexao()],
    orientacao: '',
    pratica: '',
    sintese: '',
    leveComVoce: '',
  };
}

/** Identificação da aula — comum aos quatro níveis (`670:1248`). */
export type DadosDaAula = {
  /** Frase do card da Home, de 10 a 80 caracteres (`703:193`). */
  fraseDestaque: string;
  /** Duração estimada em minutos — o "3 MIN" do card da Home. */
  duracaoMinutos: number;
  etapas: EtapasPorNivel;
};

export function aulaVazia(): DadosDaAula {
  return {
    fraseDestaque: '',
    duracaoMinutos: 3,
    etapas: {
      leigo: etapasVazias(),
      curioso: etapasVazias(),
      estudioso: etapasVazias(),
      erudito: etapasVazias(),
    },
  };
}

/**
 * O que falta num nível, na linguagem das pendências do `673:1249`
 * ("explicação ausente", "localização da passagem não informada").
 *
 * Lista vazia = nível pronto. É o que alimenta tanto a linha "Situação das
 * versões" do editor quanto a revisão antes de publicar.
 */
export function pendenciasDoNivel(etapas: EtapasDaAula): string[] {
  const faltando: string[] = [];

  if (!etapas.introducao.trim()) faltando.push('introdução ausente');
  if (!etapas.fonte.trim()) faltando.push('referência da fonte não informada');
  if (!etapas.explicacao.trim()) faltando.push('explicação ausente');
  if (!etapas.pergunta.trim()) faltando.push('pergunta da reflexão ausente');

  const escritas = etapas.opcoes.filter((opcao) => opcao.texto.trim()).length;
  if (escritas < MIN_OPCOES_REFLEXAO) {
    faltando.push(`reflexão com menos de ${MIN_OPCOES_REFLEXAO} alternativas`);
  }

  if (!etapas.pratica.trim()) faltando.push('prática ausente');
  if (!etapas.sintese.trim()) faltando.push('síntese ausente');
  if (!etapas.leveComVoce.trim()) faltando.push('“Leve com você” ausente');

  return faltando;
}

export function nivelCompleto(etapas: EtapasDaAula): boolean {
  return pendenciasDoNivel(etapas).length === 0;
}

/**
 * Quantos itens obrigatórios um nível tem.
 *
 * Contado a partir de um nível em branco, em vez de escrito à mão: acrescentar
 * ou remover uma checagem em `pendenciasDoNivel` ajusta o total sozinho, sem
 * ninguém lembrar de mexer aqui.
 */
export const ITENS_DO_NIVEL = pendenciasDoNivel(etapasVazias()).length;

/** Itens já preenchidos num nível, de `ITENS_DO_NIVEL`. */
export function itensPreenchidos(etapas: EtapasDaAula): number {
  return ITENS_DO_NIVEL - pendenciasDoNivel(etapas).length;
}

/** Níveis prontos para publicar, dos quatro. */
export function niveisCompletos(etapas: EtapasPorNivel): Nivel[] {
  return NIVEIS.filter((nivel) => nivelCompleto(etapas[nivel]));
}

/**
 * O que falta na identificação — o que vale para os quatro níveis de uma vez.
 *
 * Separada das etapas porque o editor mostra as duas coisas em lugares
 * diferentes: a identificação sempre, as etapas só do nível em edição.
 */
export function pendenciasDaIdentificacao(conteudo: RascunhoConteudo): string[] {
  const pendencias: string[] = [];

  if (!conteudo.titulo.trim()) pendencias.push('Informe o título.');

  const frase = conteudo.aula.fraseDestaque.trim();
  if (frase.length < MIN_FRASE_DESTAQUE || frase.length > MAX_FRASE_DESTAQUE) {
    pendencias.push(
      `Frase de destaque do card: de ${MIN_FRASE_DESTAQUE} a ${MAX_FRASE_DESTAQUE} caracteres.`,
    );
  }

  if (!conteudo.autorId) pendencias.push('Escolha o filósofo da biblioteca.');
  // A tela passou a pedir **um** tema (`668:202`, 16/09); o modelo continua
  // guardando lista, porque o contrato diz que "um conteúdo tem muitos temas"
  // e voltar atrás depois custaria migração.
  if (conteudo.temaIds.length === 0) pendencias.push('Escolha o tema.');
  if (!(conteudo.aula.duracaoMinutos > 0)) pendencias.push('Informe a duração em minutos.');

  return pendencias;
}

/**
 * Motivos que impedem publicar uma aula (`673:1249`).
 *
 * "Sem uma versão completa, a aula fica em rascunho" — e o contrato pede as
 * quatro, não uma: quem entra no app escolhe o nível, e um nível vazio seria
 * uma aula que abre sem conteúdo.
 */
export function pendenciasDaAula(conteudo: RascunhoConteudo): string[] {
  const pendencias = pendenciasDaIdentificacao(conteudo);

  for (const nivel of NIVEIS) {
    const faltando = pendenciasDoNivel(conteudo.aula.etapas[nivel]);

    if (faltando.length > 0) {
      pendencias.push(`Versão ${ROTULO_NIVEL[nivel]}: ${faltando.join(', ')}.`);
    }
  }

  return pendencias;
}

/**
 * Edição semanal: guarda a REFERÊNCIA ao conteúdo e o período, nunca uma cópia
 * do texto (nó `600:74`). Assim, corrigir o conteúdo corrige o destaque.
 *
 * Era um destaque por data até 2026-09-15, quando o contrato editorial fixou
 * que "o mesmo conteúdo permanece em destaque durante a semana" (`671:1248`).
 */
export type EdicaoSemanal = {
  id: string;
  /** Nome interno, só para a redação se achar na lista. */
  nome: string;
  conteudoId: string;
  /** `AAAA-MM-DDTHH:MM` em Brasília. Instante de entrada, **inclusivo**. */
  inicio: string;
  /** `AAAA-MM-DDTHH:MM`. Instante de saída, **exclusivo**: às 00:00 do término já saiu. */
  fim: string;
  fuso: string;
  agendadoPor: string;
  agendadoEm: number;
};

/**
 * O fuso da redação. **Fixo**, não escolhido.
 *
 * Havia um seletor de fuso na tela até 16/09; o desenho o substituiu por uma
 * frase ("Fuso horário: Brasília"). Isso não é só simplificação de tela: com
 * um fuso só, comparar dois períodos é comparar duas strings `AAAA-MM-DDTHH:MM`,
 * e é por isso que este arquivo não precisa de conversão para instante em
 * nenhum lugar. Voltar a ter fusos diferentes quebraria essa comparação.
 */
export const FUSO_EDITORIAL_PADRAO = 'America/Sao_Paulo';

/** Sete dias consecutivos, do contrato `671:1248`. */
export const DIAS_DA_EDICAO = 7;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export function dataValida(data: string): boolean {
  return DATA_ISO.test(data) && !Number.isNaN(Date.parse(`${data}T00:00:00Z`));
}

export function horaValida(hora: string): boolean {
  return HORA.test(hora);
}

/** `AAAA-MM-DD` + `HH:MM` → `AAAA-MM-DDTHH:MM`, o formato gravado. */
export function instante(data: string, hora: string): string {
  return `${data}T${hora}`;
}

/** Parte da data de um instante gravado. */
export function dataDe(instante: string): string {
  return instante.slice(0, 10);
}

/** Parte da hora de um instante gravado. Meia-noite quando não houver. */
export function horaDe(instante: string): string {
  return instante.length >= 16 ? instante.slice(11, 16) : '00:00';
}

/**
 * `AAAA-MM-DD` → `DD/MM/AAAA`, como a tela pede (`595:7`).
 *
 * O formato brasileiro é o que a redação digita; o ISO é o que se grava, para
 * que ordenar por texto continue ordenando por tempo.
 */
export function dataParaExibicao(data: string): string {
  if (!DATA_ISO.test(data)) return data;

  const [ano, mes, dia] = data.split('-');

  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata enquanto se digita: só os dígitos, com as barras no lugar.
 *
 * Existe para o campo nunca chegar a "1/09/2026", que não é data nem texto
 * livre e quebrava o cálculo do término.
 */
export function mascaraDeData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)];

  return partes.filter((parte) => parte.length > 0).join('/');
}

/** `HH:MM` enquanto se digita. */
export function mascaraDeHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);

  return digitos.length <= 2 ? digitos : `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

/** `DD/MM/AAAA` → `AAAA-MM-DD`. Devolve o que veio quando não casa. */
export function dataDeExibicao(texto: string): string {
  const casa = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!casa) return texto.trim();

  const [, dia, mes, ano] = casa;

  return `${ano}-${mes}-${dia}`;
}

/** Período legível numa linha: "21/09/2026 00:00 → 28/09/2026 00:00". */
export function periodoParaExibicao(inicio: string, fim: string): string {
  return `${dataParaExibicao(dataDe(inicio))} ${horaDe(inicio)} até ${dataParaExibicao(dataDe(fim))} ${horaDe(fim)}`;
}

/**
 * Soma dias a uma data `AAAA-MM-DD`.
 *
 * Contas em UTC de propósito: são datas de calendário, não instantes. Somar em
 * horário local faria o dia pular na virada do horário de verão.
 */
export function somarDias(data: string, dias: number): string {
  // Devolve vazio em vez de estourar: enquanto alguém digita a data, o campo
  // passa por valores incompletos como "1/09/2026", e `toISOString` lança
  // `RangeError` em data inválida. Foi assim que digitar no início apagou o
  // campo de término.
  if (!dataValida(data)) return '';

  const base = new Date(`${data}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);

  return base.toISOString().slice(0, 10);
}

/**
 * Fim sugerido para uma edição que começa em `inicio`: sete dias depois, no
 * mesmo horário.
 *
 * É sugestão, não regra: desde 16/09 o término é campo editável na tela. A
 * frase "permanece em destaque por sete dias" descreve o padrão, e é isto que
 * preenche os campos — mas quem programa pode encurtar ou esticar.
 */
export function fimDaEdicao(inicio: string): string {
  const dia = somarDias(dataDe(inicio), DIAS_DA_EDICAO);

  return dia ? `${dia}T${horaDe(inicio)}` : '';
}

/**
 * Próxima segunda-feira a partir de uma data (ela mesma, se já for segunda).
 *
 * A virada na segunda é a convenção proposta pelo contrato, e ele diz que é
 * configurável — por isso ela só preenche o campo, não trava a escolha.
 */
export function proximaSegunda(data: string): string {
  if (!dataValida(data)) return '';

  const dia = new Date(`${data}T00:00:00Z`).getUTCDay();
  const faltam = (8 - dia) % 7;

  return somarDias(data, faltam);
}

/** Dois períodos se cruzam? Fim exclusivo dos dois lados. */
export function periodosSeSobrepoem(
  a: { inicio: string; fim: string },
  b: { inicio: string; fim: string },
): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

/** Motivos que impedem programar. Lista vazia = pode programar. */
export function pendenciasDaEdicao(entrada: {
  nome: string;
  conteudoId: string;
  inicio: string;
  fim: string;
}): string[] {
  const pendencias: string[] = [];

  if (!entrada.nome.trim()) pendencias.push('Dê um nome interno à edição.');
  if (!entrada.conteudoId) pendencias.push('Escolha a aula publicada.');

  const inicioOk = dataValida(dataDe(entrada.inicio)) && horaValida(horaDe(entrada.inicio));
  const fimOk = dataValida(dataDe(entrada.fim)) && horaValida(horaDe(entrada.fim));

  if (!inicioOk) pendencias.push('Informe data (DD/MM/AAAA) e horário (HH:MM) de início.');
  if (!fimOk) pendencias.push('Informe data (DD/MM/AAAA) e horário (HH:MM) de término.');

  // Comparação de texto basta porque os dois lados estão no mesmo fuso — ver
  // FUSO_EDITORIAL_PADRAO.
  if (inicioOk && fimOk && entrada.fim <= entrada.inicio) {
    pendencias.push('O término precisa vir depois do início.');
  }

  return pendencias;
}

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
   * Retrato escolhido do acervo do app (`src/lib/retratos.ts`).
   *
   * Era `fotoUrl` até 15/09/2026, quando o cadastro deixou de enviar arquivos:
   * "Retratos incluídos no app • Sem envio de arquivos" (`643:1215`). Nulo faz
   * o app mostrar a inicial do nome.
   */
  portraitAssetId: string | null;
  atualizadoEm: number;
};

/** O que o formulário edita. Id e data são do repositório. */
export type RascunhoFilosofo = Pick<Filosofo, 'nome' | 'biografia' | 'portraitAssetId'>;

export function filosofoVazio(): RascunhoFilosofo {
  return { nome: '', biografia: '', portraitAssetId: null };
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
