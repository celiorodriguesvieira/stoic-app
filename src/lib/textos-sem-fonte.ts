/**
 * Textos de tela que **não vêm do Figma**.
 *
 * Existe porque em 16/09/2026 o autor apontou o problema com todas as letras:
 * eu vinha escrevendo frase de interface por conta própria — e uma delas
 * chegou a mandar o leitor rodar `firebase deploy` dentro do produto.
 *
 * A regra passou a ser: **se não existe no Figma, não se inventa.** Quando uma
 * situação precisa de texto e o arquivo não tem nenhum, a frase entra aqui,
 * declarada, curta e esperando redação — em vez de ficar escondida no meio de
 * uma tela como se fosse aprovada.
 *
 * Nada aqui é importado ainda: esta lista é o inventário para uma passada de
 * revisão editorial. Ao aprovar cada frase no Figma, tire-a daqui e use a do
 * arquivo.
 */
export const TEXTOS_SEM_FONTE = {
  /** `repositorio.ts` — classes 503 e 401 do `668:181`, sem texto especificado. */
  erroFalhaTemporaria: 'Falha temporária. Tente novamente.',
  erroSessaoExpirada: 'Sessão expirada.',

  /** Home (`327:403`) — o Figma só desenha a tela cheia, sem estado de espera. */
  homeCarregando: 'Buscando o conhecimento da semana…',

  /**
   * Home sem edição ativa. O contrato manda o comportamento — "ocultar
   * destaque e oferecer Explorar" (`668:135`) — mas não escreve as palavras.
   */
  homeSemEdicao: 'Nenhuma edição programada para esta semana.',
  homeSemEdicaoAcao: 'EXPLORAR',

  /** Editor da aula — seletor "Atividade da semana" enquanto a lista chega. */
  aulaAtividadesCarregando: 'Carregando…',
  aulaAtividadeNaoPublicada: 'não publicada',
  aulaPendenciaAtividade: 'Escolha a atividade da semana.',
  aulaAtividadeForaDoAr: 'A atividade da semana escolhida não está publicada.',
  atividadeEmUsoPelaAula:
    'A aula publicada “…” usa esta atividade. Troque a atividade da aula antes de arquivar.',

  /**
   * Biblioteca no painel. O Figma desenha os dois formulários (`668:203`,
   * `779:143`) e o detalhe do vídeo no app (`67:6`), mas não a lista, a prévia
   * do livro nem o texto do aviso de afiliado — só manda mostrá-lo.
   */
  bibliotecaApoio: 'Vídeos do YouTube e livros recomendados.',
  bibliotecaVazia: 'Nenhum recurso nesta lista.',
  bibliotecaJaPublicado: 'Este recurso já está publicado.',
  bibliotecaRotuloLivro: 'LIVRO',
  bibliotecaAbrirLoja: 'ABRIR NA LOJA',
  bibliotecaAvisoAfiliado:
    'Link de afiliado: o PAUSA pode receber comissão por compras feitas por ele.',
  bibliotecaVideoInvalido: 'Link de vídeo inválido',

  /** Biblioteca do app (`67:5`, `67:6`) — estados que o Figma não desenha. */
  bibliotecaAppVazia: 'Nenhum conteúdo disponível ainda.',
  bibliotecaAppSemResultado: 'Nenhum conteúdo encontrado.',
  bibliotecaIndisponivel: 'Conteúdo indisponível.',
  bibliotecaVoltar: 'VOLTAR À BIBLIOTECA',

  /**
   * Atividades no painel (`643:1270`–`643:1272`, `644:104`, `644:1271`). O
   * Figma desenha os campos com exemplos, mas não os estados, os controles de
   * lista nem os campos que o contrato `668:142` exige e a tela não mostra.
   */
  atividadesVazia: 'Nenhuma atividade nesta lista.',
  atividadesFiltroTipo: 'Tipo',
  atividadesFiltroStatus: 'Status',
  atividadesVinculoNenhum: 'Nenhum',
  atividadesJaPublicada: 'Esta atividade já está publicada.',
  atividadeCampoTentativa: 'Mensagem de nova tentativa *',
  atividadeExemploTentativa: 'Ainda não. Releia a frase e tente outra ordem.',
  atividadeCampoSituacao: 'Situação *',
  atividadeCampoPergunta: 'Pergunta *',
  atividadeConclusaoTitulo: 'Título da conclusão',
  atividadeConclusaoTexto: 'Aprendizado',
  atividadeBlocoDistrator: 'DISTRATOR',
  atividadeAdicionarBloco: 'ADICIONAR BLOCO',
  atividadeAdicionarAlternativa: 'ADICIONAR ALTERNATIVA',
  atividadeIncluirMensagem: 'INCLUIR MENSAGEM SIMULADA',
  atividadeRemoverMensagem: 'REMOVER MENSAGEM SIMULADA',

  /** Aba Atividades e atividade no app (`66:2`) — estados que o Figma não desenha. */
  atividadesAppSemRecomendada: 'ATIVIDADES',
  atividadesAppVazia: 'Nenhuma atividade disponível ainda.',
  atividadesAppSemTempo: 'Nenhuma atividade neste tempo.',
  atividadeIndisponivel: 'Atividade indisponível.',
  atividadeVoltar: 'VOLTAR ÀS ATIVIDADES',

  /** Leitor da aula (`61:6`–`61:9`) — aula que saiu do ar. */
  aulaIndisponivel: 'Conteúdo indisponível.',

  /**
   * Explorar e destinos (`62:5`, `466:495`). O `468:985` manda os estados
   * ("Vazio: mensagem e Explorar outros temas") mas não escreve as mensagens.
   */
  explorarSemTema: 'Nenhum tema encontrado.',
  explorarSemAutor: 'Nenhum autor encontrado.',
  explorarSemConteudo: 'Nenhum conteúdo encontrado.',
  explorarVazio: 'Nenhum conteúdo disponível ainda.',
  temaIndisponivel: 'Tema indisponível.',
  temaVazio: 'Ainda não há conteúdos neste tema.',
  autorIndisponivel: 'Autor indisponível.',
  autorVazio: 'Ainda não há conteúdos deste autor.',
  leituraSemVersao: 'Este conteúdo ainda não tem versão {nível}.',
  semVersaoDisponivelEm: 'Disponível em: {níveis}.',
  filosofoSemIntroducao: 'Ainda não há introdução na versão {nível}.',

  /**
   * Cadastro do filósofo. O `673:1306` junta "Subtítulo e período de vida" num
   * campo, e o `673:1310` descreve a introdução numa linha só; os rótulos
   * separados são meus.
   */
  filosofoSubtitulo: 'Subtítulo',
  filosofoPeriodo: 'Período de vida',
  filosofoIntroTitulo: 'Título ({nível})',
  filosofoIntroTexto: 'Texto ({nível}) *',
  filosofoIntroFonte: 'Fonte ({nível})',

  /** Preferências — "Temas de interesse" sem nada escolhido no onboarding. */
  preferenciasSemInteresse: 'Nenhum tema escolhido.',
} as const;
