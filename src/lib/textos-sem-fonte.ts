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

  /** Editor da aula — aviso sobre a atividade obrigatória ainda não implementada. */
  aulaAtividadePendente:
    'Atividade da semana: obrigatória pelo contrato e ainda não implementada.',
} as const;
