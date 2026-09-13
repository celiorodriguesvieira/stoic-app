import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/**
 * Painel administrativo.
 *
 * Quem pode entrar é decidido em `src/app/_layout.tsx`: a pilha inteira só é
 * registrada para editor ou administrador (`Stack.Protected`). Se o papel cair
 * no meio da sessão, as telas somem e o roteador leva de volta para o app.
 *
 * Isso é conveniência de navegação, não segurança — quem protege os dados são
 * as Security Rules em `firestore.rules`.
 */
export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    />
  );
}
