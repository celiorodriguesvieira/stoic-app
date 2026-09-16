import type { Filosofo, Tema } from '@/lib/admin/tipos';

/**
 * Semente do cadastro de filósofos.
 *
 * Estes seis estiveram escritos no código até 2026-09-15, quando os filósofos
 * ganharam tela própria (`643:947`) e passaram a morar no Firestore. A lista
 * continua aqui por dois motivos: é o que a tela oferece importar num banco
 * vazio, e é o retrato de emergência enquanto a coleção ainda não carregou.
 *
 * Os ids são os mesmos de antes de propósito — os conteúdos já cadastrados
 * guardam um deles em `autorId`.
 */
export const SEMENTE_FILOSOFOS: readonly Pick<Filosofo, 'id' | 'nome'>[] = [
  { id: 'seneca', nome: 'Sêneca' },
  { id: 'epicteto', nome: 'Epicteto' },
  { id: 'marco-aurelio', nome: 'Marco Aurélio' },
  { id: 'aristoteles', nome: 'Aristóteles' },
  { id: 'zenao-de-citio', nome: 'Zenão de Cítio' },
  { id: 'nietzsche', nome: 'Nietzsche' },
];

/**
 * Temas continuam fixos: o Figma não desenhou curadoria de temas, e inventar
 * uma tela para eles seria implementar o que ninguém pediu.
 */
export const TEMAS: readonly Tema[] = [
  { id: 'tempo-e-escolhas', nome: 'Tempo e escolhas' },
  { id: 'autoconhecimento', nome: 'Autoconhecimento' },
  { id: 'desejo-e-suficiente', nome: 'Desejo e suficiente' },
  { id: 'medo-e-coragem', nome: 'Medo e coragem' },
  { id: 'dinheiro-e-risco', nome: 'Dinheiro e risco' },
  { id: 'juizo-e-opiniao', nome: 'Juízo e opinião' },
];

/**
 * Id a partir do nome: "Marco Aurélio" vira `marco-aurelio`.
 *
 * Id legível em vez de sorteado porque é ele que aparece gravado em cada
 * conteúdo — e um `autorId` que se lê ajuda a depurar o acervo à mão.
 */
export function idDoNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Nome do filósofo dentro de uma lista já carregada. */
export function nomeDoFilosofoEm(filosofos: readonly Filosofo[], id: string): string {
  return filosofos.find((filosofo) => filosofo.id === id)?.nome
    ?? SEMENTE_FILOSOFOS.find((filosofo) => filosofo.id === id)?.nome
    ?? '—';
}

export function nomesDosTemas(ids: string[]): string {
  const nomes = ids
    .map((id) => TEMAS.find((tema) => tema.id === id)?.nome)
    .filter((nome): nome is string => !!nome);

  return nomes.length > 0 ? nomes.join(' · ') : '—';
}
