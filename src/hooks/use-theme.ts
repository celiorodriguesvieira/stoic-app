import { Colors, type ColorScheme } from '@/theme';

/**
 * Tema do app — travado em claro nesta versão.
 *
 * Item 04 do contrato do menu (`649:987`): "somente tema claro,
 * independentemente da aparência do aparelho. Não exibir seletor de tema nem
 * persistir uma preferência de aparência. Tema escuro fica fora do escopo."
 *
 * Antes daqui o app seguia o aparelho, e escurecia com cores que eu havia
 * escolhido no código — nenhuma tela escura foi desenhada no Figma. Os valores
 * do modo escuro seguem em `tokens.ts` à espera de um desenho.
 */
export function useTheme() {
  const mode: ColorScheme = 'light';

  return { colors: Colors[mode], mode };
}
