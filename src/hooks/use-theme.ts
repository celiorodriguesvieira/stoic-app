import { Colors, type ColorScheme } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const mode: ColorScheme = scheme === 'dark' ? 'dark' : 'light';

  return { colors: Colors[mode], mode };
}
