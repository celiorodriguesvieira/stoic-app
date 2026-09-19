/**
 * Interesses do onboarding ("Escolha seus fundamentos do estoicismo").
 *
 * Moram aqui, e não dentro da tela do onboarding, porque Preferências mostra
 * o que foi escolhido: as duas telas precisam do mesmo nome para o mesmo id.
 * O perfil grava só os ids (`preferencias.interesses`).
 *
 * Atenção: esta lista não é a de `TEMAS` (`lib/admin/acervo.ts`), que
 * classifica os conteúdos. Só "Autoconhecimento" existe nas duas — ver
 * `docs/progresso.md`.
 */
export const INTERESSES = [
  { id: 'autoconhecimento', rotulo: 'Autoconhecimento' },
  { id: 'etica-convivencia', rotulo: 'Ética e convivência' },
  { id: 'pensamento-critico', rotulo: 'Pensamento crítico' },
  { id: 'felicidade-proposito', rotulo: 'Felicidade e propósito' },
  { id: 'redes-sociais', rotulo: 'Redes sociais e influência' },
  { id: 'consumo-dinheiro', rotulo: 'Consumo e dinheiro' },
] as const;

/**
 * Nomes dos interesses escolhidos, na ordem da lista do onboarding. Id que
 * não existe mais na lista é ignorado em vez de aparecer cru na tela.
 */
export function rotulosDosInteresses(ids: readonly string[]): string[] {
  return INTERESSES.filter((interesse) => ids.includes(interesse.id)).map(
    (interesse) => interesse.rotulo,
  );
}
