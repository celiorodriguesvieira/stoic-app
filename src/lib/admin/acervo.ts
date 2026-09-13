import type { Filosofo, Tema } from '@/lib/admin/tipos';

/**
 * Filósofos e temas disponíveis no editor.
 *
 * Ainda são constantes: o Figma mostra os dois campos como seletores de lista
 * fechada e não há tela de curadoria desenhada. Quando houver, viram as
 * coleções `filosofos` e `temas` no Firestore — por isso o conteúdo guarda
 * `autorId` e `temaIds`, não os nomes.
 */
export const FILOSOFOS: readonly Filosofo[] = [
  { id: 'seneca', nome: 'Sêneca' },
  { id: 'epicteto', nome: 'Epicteto' },
  { id: 'marco-aurelio', nome: 'Marco Aurélio' },
  { id: 'aristoteles', nome: 'Aristóteles' },
  { id: 'zenao-de-citio', nome: 'Zenão de Cítio' },
  { id: 'nietzsche', nome: 'Nietzsche' },
];

export const TEMAS: readonly Tema[] = [
  { id: 'tempo-e-escolhas', nome: 'Tempo e escolhas' },
  { id: 'autoconhecimento', nome: 'Autoconhecimento' },
  { id: 'desejo-e-suficiente', nome: 'Desejo e suficiente' },
  { id: 'medo-e-coragem', nome: 'Medo e coragem' },
  { id: 'dinheiro-e-risco', nome: 'Dinheiro e risco' },
  { id: 'juizo-e-opiniao', nome: 'Juízo e opinião' },
];

export function nomeDoFilosofo(id: string): string {
  return FILOSOFOS.find((filosofo) => filosofo.id === id)?.nome ?? '—';
}

export function nomesDosTemas(ids: string[]): string {
  const nomes = ids
    .map((id) => TEMAS.find((tema) => tema.id === id)?.nome)
    .filter((nome): nome is string => !!nome);

  return nomes.length > 0 ? nomes.join(' · ') : '—';
}
