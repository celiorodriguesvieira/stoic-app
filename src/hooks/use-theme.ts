/**
 * Acesso ao tema ativo do PAUSA.
 *
 * O modo segue a preferência do sistema (`userInterfaceStyle: "automatic"`
 * em app.json). Quando houver tela de ajustes, trocar `useColorScheme` por
 * um contexto que permita sobrescrever a escolha do sistema.
 */

import { Colors, type ColorScheme } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const mode: ColorScheme = scheme === 'dark' ? 'dark' : 'light';

  return { colors: Colors[mode], mode };
}
