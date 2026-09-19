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
  /**
   * "Atividade da semana *" (`668:202`, etapa 3). Uma só para os quatro
   * níveis: a atividade tem uma versão editorial por publicação, não uma por
   * nível (`668:142`). Vazio = ainda não vinculada.
   */
  atividadeId: string;
  etapas: EtapasPorNivel;
};

export function aulaVazia(): DadosDaAula {
  return {
    fraseDestaque: '',
    duracaoMinutos: 3,
    atividadeId: '',
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

  // Vale para os quatro níveis, então entra uma vez, e não na lista de cada um.
  if (!conteudo.aula.atividadeId) pendencias.push('Escolha a atividade da semana.');

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
  /**
   * "Subtítulo e período de vida" (`673:1306`): as duas linhas do card escuro
   * da página do filósofo (`431:310`) — "Filósofo estoico e senador romano",
   * "4 a.C. — 65 d.C.". Separados porque o card os mostra em linhas e pesos
   * diferentes.
   */
  subtitulo: string;
  periodo: string;
  /**
   * "Introdução por nível *" (`673:1310`): "preencher texto e fonte de cada
   * versão". É o que a página do filósofo mostra abaixo do seletor de nível
   * (`420:87`): título, texto e o "Ponto de partida".
   */
  introducoes: IntroducaoPorNivel;
  atualizadoEm: number;
};

export type IntroducaoDoFilosofo = {
  /** "Uma filosofia para viver melhor". */
  titulo: string;
  texto: string;
  /** Obra e trecho — o "Ponto de partida" do `420:87`. */
  fonte: string;
};

export type IntroducaoPorNivel = Record<Nivel, IntroducaoDoFilosofo>;

export function introducoesVazias(): IntroducaoPorNivel {
  const vazia = (): IntroducaoDoFilosofo => ({ titulo: '', texto: '', fonte: '' });

  return { leigo: vazia(), curioso: vazia(), estudioso: vazia(), erudito: vazia() };
}

/** O que o formulário edita. Id e data são do repositório. */
export type RascunhoFilosofo = Omit<Filosofo, 'id' | 'atualizadoEm'>;

export function filosofoVazio(): RascunhoFilosofo {
  return {
    nome: '',
    biografia: '',
    portraitAssetId: null,
    subtitulo: '',
    periodo: '',
    introducoes: introducoesVazias(),
  };
}

/**
 * Nome é obrigatório e não pode ser só espaço em branco (contrato `643:1269`).
 * A introdução também, nos quatro níveis: o campo é "Introdução por nível *"
 * (`673:1310`), e a página do filósofo abre no nível de quem lê.
 */
export function pendenciasDoFilosofo(rascunho: RascunhoFilosofo): string[] {
  const pendencias: string[] = [];

  if (!rascunho.nome.trim()) pendencias.push('Informe o nome do filósofo.');

  const faltando = NIVEIS.filter((nivel) => !rascunho.introducoes[nivel].texto.trim());
  if (faltando.length > 0) {
    pendencias.push(
      `Escreva a introdução de ${faltando.map((nivel) => ROTULO_NIVEL[nivel]).join(', ')}.`,
    );
  }

  return pendencias;
}

/** Inicial exibida no lugar da foto. Uma letra, maiúscula. */
export function inicialDoNome(nome: string): string {
  return nome.trim().charAt(0).toLocaleUpperCase('pt-BR') || '?';
}

export type Tema = { id: string; nome: string };

// --- Biblioteca --------------------------------------------------------------

/**
 * Recurso curado da Biblioteca (`668:203` vídeo, `779:143` livro).
 *
 * Coleção própria, fora do acervo de conteúdos: o contrato separa os dois
 * formulários ("Vídeo do YouTube e Livro") e o recurso não tem níveis, autor
 * do acervo nem aplicação. Enfiá-lo em `conteudos` obrigaria cada tela do
 * catálogo a saber ignorar metade dos campos.
 *
 * O contrato chama os tipos de `youtube | book`; aqui ficam em português, como
 * o resto do modelo.
 */
export const TIPOS_RECURSO = ['video', 'livro'] as const;
export type TipoRecurso = (typeof TIPOS_RECURSO)[number];

export const ROTULO_TIPO_RECURSO: Record<TipoRecurso, string> = {
  video: 'Vídeo',
  livro: 'Livro',
};

export type RecursoBiblioteca = {
  id: string;
  tipo: TipoRecurso;
  titulo: string;
  /** Canal ou criador do vídeo; autor do livro. */
  criador: string;
  /** Link do YouTube (vídeo) ou da loja (livro). Sempre HTTPS. */
  url: string;
  /**
   * Extraído do link na gravação, nunca digitado. O app monta o player a
   * partir dele — "o sistema extrai videoId e constrói embed seguro, sem
   * aceitar HTML" (`668:156`). Nulo em livro e em link que não é de vídeo.
   */
  videoId: string | null;
  /** Só livro, opcional. */
  edicao: string;
  /** Só livro. Padrão Não (`668:156`). */
  afiliado: boolean;
  /** "Por que recomendamos". */
  recomendacao: string;
  status: StatusConteudo;
  atualizadoEm: number;
  /** Mesma trava de conflito do conteúdo. */
  versao: number;
};

export type RascunhoRecurso = Omit<
  RecursoBiblioteca,
  'id' | 'status' | 'atualizadoEm' | 'versao' | 'videoId'
>;

export function recursoVazio(tipo: TipoRecurso = 'video'): RascunhoRecurso {
  return { tipo, titulo: '', criador: '', url: '', edicao: '', afiliado: false, recomendacao: '' };
}

export function paraRascunhoDeRecurso(recurso: RecursoBiblioteca): RascunhoRecurso {
  const { id, status, atualizadoEm, versao, videoId, ...rascunho } = recurso;

  return rascunho;
}

/** Limites de título do contrato `668:121` ("título 3–120 caracteres"). */
export const MIN_TITULO = 3;
export const MAX_TITULO = 120;

const HTTPS = /^https:\/\/[^\s/?#]+\.[^\s/?#]+(?:[/?#]\S*)?$/i;

export function urlHttps(url: string): boolean {
  return HTTPS.test(url.trim());
}

/**
 * Formas aceitas de link de vídeo do YouTube. Expressões, e não `new URL`,
 * porque o `URL` do React Native não implementa `hostname` nem `searchParams`.
 */
const LINKS_YOUTUBE = [
  /^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)/i,
  /^https:\/\/(?:www\.|m\.)?youtube\.com\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/i,
  /^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[/?#]|$)/i,
];

/** Id do vídeo, ou nulo quando o link não é de um vídeo do YouTube. */
export function idDoVideoDoYoutube(url: string): string | null {
  const limpo = url.trim();

  for (const forma of LINKS_YOUTUBE) {
    const casa = forma.exec(limpo);
    if (casa) return casa[1];
  }

  return null;
}

/** Player oficial, sem reprodução automática (`668:156`). */
export function enderecoDoPlayer(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export type CampoRecurso = 'titulo' | 'criador' | 'url' | 'recomendacao';

/**
 * Erros por campo — "publicar lista erros por campo" (`668:121`). A ordem é a
 * do formulário, para a lista ler de cima para baixo como a tela.
 */
export function errosDoRecurso(recurso: RascunhoRecurso): Partial<Record<CampoRecurso, string>> {
  const erros: Partial<Record<CampoRecurso, string>> = {};
  const video = recurso.tipo === 'video';

  const titulo = recurso.titulo.trim().length;
  if (titulo < MIN_TITULO || titulo > MAX_TITULO) {
    erros.titulo = `Título: de ${MIN_TITULO} a ${MAX_TITULO} caracteres.`;
  }

  if (!recurso.criador.trim()) {
    erros.criador = video ? 'Informe o canal ou criador.' : 'Informe o autor do livro.';
  }

  if (video) {
    if (!idDoVideoDoYoutube(recurso.url)) {
      erros.url = 'Use o link HTTPS de um vídeo do YouTube.';
    }
  } else if (!urlHttps(recurso.url)) {
    erros.url = 'Use um link HTTPS da loja.';
  }

  if (!recurso.recomendacao.trim()) {
    erros.recomendacao = 'Diga por que recomendamos.';
  }

  return erros;
}

export function pendenciasDoRecurso(recurso: RascunhoRecurso): string[] {
  return Object.values(errosDoRecurso(recurso));
}

// --- Atividades --------------------------------------------------------------

/**
 * Atividade — prática curta da aba Atividades (`66:2`), cadastrada no painel
 * (`643:1270` lista, `643:1271`/`644:104`/`644:1271` editor, `643:1272` prévia).
 *
 * Contrato `668:142`: "Atividades têm uma versão editorial por publicação;
 * não exigir quatro níveis sem conteúdo aprovado para eles." Por isso não há
 * texto por nível aqui, ao contrário da aula.
 *
 * O contrato chama os tipos de ordenação/reflexão/situação; a situação
 * contextual de golpes é uma variante da situação (mensagem simulada), não um
 * quarto tipo.
 */
export const TIPOS_ATIVIDADE = ['ordenacao', 'reflexao', 'situacao'] as const;
export type TipoAtividade = (typeof TIPOS_ATIVIDADE)[number];

export const ROTULO_TIPO_ATIVIDADE: Record<TipoAtividade, string> = {
  ordenacao: 'Ordenação',
  reflexao: 'Reflexão',
  situacao: 'Situação',
};

/** "Duração inteira 1–120 min" (`668:142`). */
export const MIN_DURACAO_ATIVIDADE = 1;
export const MAX_DURACAO_ATIVIDADE = 120;

/** "2–12 blocos" (`668:142`). */
export const MIN_BLOCOS = 2;
export const MAX_BLOCOS = 12;

/** "2–6 alternativas distintas e seleção única" (`668:142`). */
export const MIN_ALTERNATIVAS = 2;
export const MAX_ALTERNATIVAS = 6;

function idSorteado(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Bloco da ordenação. "IDs estáveis, texto e flag de distrator" (`668:142`):
 * a tentativa da pessoa guarda ids, então corrigir a redação de um bloco não
 * reescreve o que já foi respondido.
 */
export type BlocoOrdenacao = { id: string; texto: string; distrator: boolean };

export function novoBloco(distrator = false): BlocoOrdenacao {
  return { id: idSorteado('bl'), texto: '', distrator };
}

export type DinamicaOrdenacao = {
  /** "Frase-base (opcional)" — o começo que os blocos completam. */
  fraseBase: string;
  /**
   * A ordem da lista **é** o gabarito: os blocos que não são distratores, na
   * ordem em que aparecem, formam a sequência correta. O app embaralha na
   * apresentação — "embaralhar apresentação, não gabarito".
   */
  blocos: BlocoOrdenacao[];
  /** "Mensagem de tentativa … obrigatória" — o que se diz quando a ordem não confere. */
  mensagemTentativa: string;
  /** "Explicação após conferir *" (`644:104`). */
  explicacao: string;
};

/** Sequência correta: ids dos blocos não distratores, na ordem da lista. */
export function sequenciaCorreta(dinamica: DinamicaOrdenacao): string[] {
  return dinamica.blocos.filter((bloco) => !bloco.distrator).map((bloco) => bloco.id);
}

/**
 * Alternativa de reflexão ou situação. A devolutiva mora na própria
 * alternativa para não depender de posição — ver `OpcaoReflexao`.
 */
export type AlternativaAtividade = { id: string; texto: string; devolutiva: string };

export function novaAlternativa(): AlternativaAtividade {
  return { id: idSorteado('alt'), texto: '', devolutiva: '' };
}

/**
 * "Modo orientado: uma resposta indicada e explicação para cada alternativa.
 * Modo livre: sem gabarito, acerto, erro, nota ou ranking" (`668:142`).
 */
export const MODOS_RESPOSTA = ['orientado', 'livre'] as const;
export type ModoResposta = (typeof MODOS_RESPOSTA)[number];

export const ROTULO_MODO_RESPOSTA: Record<ModoResposta, string> = {
  orientado: 'Com resposta orientadora',
  livre: 'Reflexão livre (sem certo ou errado)',
};

/** No modo livre, "devolutiva comum ou por escolha" (`668:142`). */
export const DEVOLUTIVAS_LIVRES = ['comum', 'porEscolha'] as const;
export type DevolutivaLivre = (typeof DEVOLUTIVAS_LIVRES)[number];

export const ROTULO_DEVOLUTIVA_LIVRE: Record<DevolutivaLivre, string> = {
  comum: 'Devolutiva comum a todas as escolhas',
  porEscolha: 'Devolutiva por alternativa',
};

/**
 * Variante "mensagem simulada" da situação (`644:1271`, `668:142`).
 *
 * "Nunca tornar o endereço suspeito clicável": `endereco` é texto, e é texto
 * que o app deve mostrar — nunca um link.
 */
export type MensagemSimulada = {
  remetente: string;
  /** Telefone ou e-mail já mascarado pela redação. */
  identificador: string;
  corpo: string;
  endereco: string;
  observacao: string;
};

export function mensagemSimuladaVazia(): MensagemSimulada {
  return { remetente: '', identificador: '', corpo: '', endereco: '', observacao: '' };
}

export type DinamicaEscolha = {
  /** O cenário do card ("Uma pessoa não respondeu à sua mensagem."). */
  situacao: string;
  /** A pergunta acima das alternativas ("O que depende de você?"). */
  pergunta: string;
  alternativas: AlternativaAtividade[];
  modo: ModoResposta;
  /** Só no modo orientado: id da alternativa indicada. */
  respostaId: string;
  /** Só no modo livre. */
  devolutivaLivre: DevolutivaLivre;
  /** Só no modo livre com devolutiva comum. */
  devolutivaComum: string;
  /** Só em situação, e só quando aplicável. */
  mensagem: MensagemSimulada | null;
};

export type ConclusaoAtividade = {
  /** "ONDE SUA AÇÃO COMEÇA" — o título da tela de conclusão. */
  titulo: string;
  /** O aprendizado que fecha a atividade. */
  texto: string;
};

export type Atividade = {
  id: string;
  tipo: TipoAtividade;
  titulo: string;
  duracaoMinutos: number;
  instrucao: string;
  /** Opcionais — "authorIds/contentRef opcionais" (`668:142`). Vazio = nenhum. */
  filosofoId: string;
  temaIds: string[];
  conteudoId: string;
  /**
   * As duas dinâmicas ficam no registro, e o `tipo` diz qual vale. Assim trocar
   * o tipo no formulário e voltar não apaga o que já se escreveu na outra.
   */
  ordenacao: DinamicaOrdenacao;
  escolha: DinamicaEscolha;
  conclusao: ConclusaoAtividade;
  status: StatusConteudo;
  atualizadoEm: number;
  /** Mesma trava de conflito do conteúdo. */
  versao: number;
};

export type RascunhoAtividade = Omit<Atividade, 'id' | 'status' | 'atualizadoEm' | 'versao'>;

export function ordenacaoVazia(): DinamicaOrdenacao {
  return {
    fraseBase: '',
    blocos: [novoBloco(), novoBloco(true)],
    mensagemTentativa: '',
    explicacao: '',
  };
}

export function escolhaVazia(tipo: TipoAtividade = 'reflexao'): DinamicaEscolha {
  return {
    situacao: '',
    pergunta: '',
    alternativas: [novaAlternativa(), novaAlternativa()],
    // O desenho abre a reflexão orientada e a situação livre (`643:1271`,
    // `644:1271`); os dois modos continuam disponíveis nos dois tipos.
    modo: tipo === 'situacao' ? 'livre' : 'orientado',
    respostaId: '',
    devolutivaLivre: 'comum',
    devolutivaComum: '',
    mensagem: null,
  };
}

export function atividadeVazia(tipo: TipoAtividade = 'reflexao'): RascunhoAtividade {
  return {
    tipo,
    titulo: '',
    duracaoMinutos: 3,
    instrucao: '',
    filosofoId: '',
    temaIds: [],
    conteudoId: '',
    ordenacao: ordenacaoVazia(),
    escolha: escolhaVazia(tipo),
    conclusao: { titulo: '', texto: '' },
  };
}

export function paraRascunhoDeAtividade(atividade: Atividade): RascunhoAtividade {
  const { id, status, atualizadoEm, versao, ...rascunho } = atividade;

  return rascunho;
}

export type CampoAtividade =
  | 'titulo'
  | 'duracao'
  | 'instrucao'
  | 'cenario'
  | 'itens'
  | 'resposta'
  | 'devolutiva'
  | 'tentativa'
  | 'explicacao'
  | 'mensagem'
  | 'conclusao';

function repetidos(textos: string[]): boolean {
  const normalizados = textos.map((texto) => texto.trim().toLocaleLowerCase('pt-BR'));

  return new Set(normalizados).size !== normalizados.length;
}

/**
 * Erros por campo, na ordem do formulário. Lista vazia = pode publicar.
 *
 * É a checagem do rodapé da prévia (`643:1272`): "Validar: título, tipo,
 * duração, instrução, dinâmica completa e conclusão. Confirmar resposta
 * orientadora quando aplicável."
 */
export function errosDaAtividade(
  atividade: RascunhoAtividade,
): Partial<Record<CampoAtividade, string>> {
  const erros: Partial<Record<CampoAtividade, string>> = {};

  const titulo = atividade.titulo.trim().length;
  if (titulo < MIN_TITULO || titulo > MAX_TITULO) {
    erros.titulo = `Título: de ${MIN_TITULO} a ${MAX_TITULO} caracteres.`;
  }

  const duracao = atividade.duracaoMinutos;
  if (
    !Number.isInteger(duracao) ||
    duracao < MIN_DURACAO_ATIVIDADE ||
    duracao > MAX_DURACAO_ATIVIDADE
  ) {
    erros.duracao = `Duração: minutos inteiros, de ${MIN_DURACAO_ATIVIDADE} a ${MAX_DURACAO_ATIVIDADE}.`;
  }

  if (!atividade.instrucao.trim()) erros.instrucao = 'Escreva a instrução.';

  if (atividade.tipo === 'ordenacao') {
    const { blocos, mensagemTentativa, explicacao } = atividade.ordenacao;

    if (blocos.length < MIN_BLOCOS || blocos.length > MAX_BLOCOS) {
      erros.itens = `Use de ${MIN_BLOCOS} a ${MAX_BLOCOS} blocos.`;
    } else if (blocos.some((bloco) => !bloco.texto.trim())) {
      erros.itens = 'Todo bloco precisa de texto.';
    } else if (repetidos(blocos.map((bloco) => bloco.texto))) {
      erros.itens = 'Há blocos com o mesmo texto.';
    } else if (blocos.every((bloco) => bloco.distrator)) {
      erros.itens = 'A sequência correta precisa de ao menos um bloco que não seja distrator.';
    }

    if (!mensagemTentativa.trim()) erros.tentativa = 'Escreva a mensagem de nova tentativa.';
    if (!explicacao.trim()) erros.explicacao = 'Escreva a explicação após conferir.';
  } else {
    const escolha = atividade.escolha;

    if (!escolha.situacao.trim() || !escolha.pergunta.trim()) {
      erros.cenario = 'Escreva a situação e a pergunta.';
    }

    const { alternativas } = escolha;
    if (alternativas.length < MIN_ALTERNATIVAS || alternativas.length > MAX_ALTERNATIVAS) {
      erros.itens = `Use de ${MIN_ALTERNATIVAS} a ${MAX_ALTERNATIVAS} alternativas.`;
    } else if (alternativas.some((alternativa) => !alternativa.texto.trim())) {
      erros.itens = 'Toda alternativa precisa de texto.';
    } else if (repetidos(alternativas.map((alternativa) => alternativa.texto))) {
      erros.itens = 'As alternativas precisam ser distintas.';
    }

    const semDevolutiva = alternativas.some((alternativa) => !alternativa.devolutiva.trim());

    if (escolha.modo === 'orientado') {
      if (!alternativas.some((alternativa) => alternativa.id === escolha.respostaId)) {
        erros.resposta = 'Indique a resposta orientadora.';
      }
      if (semDevolutiva) erros.devolutiva = 'Escreva a devolutiva de cada alternativa.';
    } else if (escolha.devolutivaLivre === 'comum') {
      if (!escolha.devolutivaComum.trim()) erros.devolutiva = 'Escreva a devolutiva comum.';
    } else if (semDevolutiva) {
      erros.devolutiva = 'Escreva a devolutiva de cada alternativa.';
    }

    const mensagem = atividade.tipo === 'situacao' ? escolha.mensagem : null;
    if (
      mensagem &&
      (!mensagem.remetente.trim() || !mensagem.corpo.trim() || !mensagem.observacao.trim())
    ) {
      erros.mensagem = 'Mensagem simulada: informe remetente, corpo e orientação de observação.';
    }
  }

  if (!atividade.conclusao.titulo.trim() || !atividade.conclusao.texto.trim()) {
    erros.conclusao = 'Escreva o título e o aprendizado da conclusão.';
  }

  return erros;
}

export function pendenciasDaAtividade(atividade: RascunhoAtividade): string[] {
  return Object.values(errosDaAtividade(atividade));
}

/** "Reflexão • 3 min" — a linha de apoio da lista (`643:1270`) e do app (`66:5`). */
export function resumoDaAtividade(atividade: Pick<Atividade, 'tipo' | 'duracaoMinutos'>): string {
  return `${ROTULO_TIPO_ATIVIDADE[atividade.tipo]} • ${atividade.duracaoMinutos} min`;
}
