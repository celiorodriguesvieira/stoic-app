import type { ImageSourcePropType } from 'react-native';

/**
 * Acervo de retratos do app.
 *
 * O cadastro de filósofos **não envia arquivos** (`643:1215`, 15/09/2026):
 * "Retratos incluídos no app • Sem envio de arquivos", e "novas imagens são
 * incluídas pelo desenvolvedor". Este arquivo é essa inclusão — acrescentar um
 * retrato é pôr o PNG em `assets/images/retratos/` e uma entrada aqui.
 *
 * Texto alternativo e crédito vivem aqui, e não no formulário, porque são
 * propriedade da imagem e não do filósofo: a mesma ilustração descrita duas
 * vezes por dois editores acabaria com duas descrições diferentes.
 */
export type RetratoDoAcervo = {
  /**
   * Gravado em `filosofos/{id}.portraitAssetId`. Não muda depois de usado.
   *
   * **É o mesmo id do filósofo** (`seneca`, `epicteto`…). Não é coincidência:
   * é isso que faz "Importar os seis do código" já sair com retrato. Enquanto
   * os ids do acervo eram nomes de pose (`seneca-abertura`), a importação só
   * casava com Marco Aurélio e os outros nasciam sem imagem.
   *
   * Um filósofo pode não ter retrato — Aristóteles não tem —, e aí o app
   * mostra a inicial do nome, como manda o contrato.
   */
  id: string;
  /** Como a imagem aparece na lista de escolha do painel. */
  nome: string;
  arquivo: ImageSourcePropType;
  /** Descrição para leitor de tela. O contrato exige imagem descrita. */
  textoAlternativo: string;
  credito: string;
};

/**
 * Os arquivos vieram de `assets/filosofos/` na raiz do projeto, o material
 * original do autor. Sêneca e Nietzsche já estavam no app (arquivos
 * idênticos); Epicteto e Zenão de Cítio entraram em 16/09/2026.
 *
 * Os textos alternativos foram escritos **olhando cada imagem**, e não a
 * partir do nome do arquivo: descrevem a roupa, a pose e o objeto que cada
 * retrato realmente mostra. Trocar um PNG sem reescrever a descrição faria o
 * leitor de tela anunciar uma imagem que não está ali.
 *
 * ATENÇÃO editorial: os créditos abaixo dizem que as ilustrações são originais
 * da PAUSA, geradas por IA a partir do `GUIA_PERSONAGENS_PIXEL_ART.md`. Confira
 * a redação antes da entrega — é ela que aparece para quem usa o app, e o uso
 * de IA na produção das imagens interessa à seção 21 do TCC.
 */
export const ACERVO_DE_RETRATOS: readonly RetratoDoAcervo[] = [
  {
    id: 'seneca',
    nome: 'Sêneca',
    arquivo: require('@/assets/images/retratos/seneca-abertura.png'),
    textoAlternativo:
      'Retrato de Sêneca em pixel art: homem magro e sem barba, cabelo curto encaracolado, vestindo toga clara com faixa púrpura e barrado grego. Olha para o lado, de expressão contida.',
    credito: 'Ilustração original da PAUSA, em pixel art gerada por IA.',
  },
  {
    id: 'epicteto',
    nome: 'Epicteto',
    arquivo: require('@/assets/images/retratos/epicteto.png'),
    textoAlternativo:
      'Retrato de Epicteto em pixel art: homem idoso de barba branca farta e cabelo encaracolado, túnica marrom simples sobre um ombro, apoiado numa muleta de madeira. Olha para cima.',
    credito: 'Ilustração original da PAUSA, em pixel art gerada por IA.',
  },
  {
    id: 'marco-aurelio',
    nome: 'Marco Aurélio',
    arquivo: require('@/assets/images/retratos/marco-aurelio.png'),
    textoAlternativo:
      'Retrato de Marco Aurélio em pixel art: homem de barba grisalha encaracolada, couraça romana com uma cabeça em relevo no peito e manto vermelho-escuro preso no ombro por um broche dourado.',
    credito: 'Ilustração original da PAUSA, em pixel art gerada por IA.',
  },
  {
    id: 'zenao-de-citio',
    nome: 'Zenão de Cítio',
    arquivo: require('@/assets/images/retratos/zenao-de-citio.png'),
    textoAlternativo:
      'Retrato de Zenão de Cítio em pixel art: homem de testa alta e entradas, barba grisalha cerrada, túnica verde-oliva sob um manto azul. Sobrancelhas franzidas, olhar severo.',
    credito: 'Ilustração original da PAUSA, em pixel art gerada por IA.',
  },
  {
    id: 'nietzsche',
    nome: 'Nietzsche',
    arquivo: require('@/assets/images/retratos/nietzsche-leitura.png'),
    textoAlternativo:
      'Retrato de Nietzsche em pixel art: homem de bigode muito espesso, casaco escuro e gravata vinho, de cabeça baixa lendo um livro aberto que segura nas duas mãos.',
    credito: 'Ilustração original da PAUSA, em pixel art gerada por IA.',
  },
];

/**
 * Retrato pelo id gravado no filósofo.
 *
 * Devolve `null` para id vazio e também para id que não existe mais — um
 * retrato retirado do acervo faz o app voltar à inicial do nome, que é o que o
 * contrato manda ("sem retrato no acervo, exibir a inicial"), em vez de
 * quebrar a tela.
 */
export function retratoDoAcervo(id: string | null | undefined): RetratoDoAcervo | null {
  if (!id) return null;

  return ACERVO_DE_RETRATOS.find((retrato) => retrato.id === id) ?? null;
}
