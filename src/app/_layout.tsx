/**
 * Importamos cada peso pelo seu subcaminho, e não pelo índice do pacote.
 * O índice faz `require` de TODAS as variações (a Inter tem 16, ~5,5 MB), e
 * o Metro não consegue descartar assets não usados — importar do índice
 * levaria todas elas para dentro do app.
 */
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { mode } = useTheme();

  /**
   * A identidade do PAUSA depende da Pixelify Sans. Renderizar antes das
   * fontes carregarem causa um flash com a fonte do sistema, então seguramos
   * a splash nativa até `useFonts` resolver.
   */
  const [fontsLoaded, fontError] = useFonts({
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </AuthProvider>
  );
}

/**
 * Precisa ser um componente separado: `useAuth` só funciona abaixo do
 * `AuthProvider`, e o provider é montado por `RootLayout`.
 */
function RootNavigator() {
  const { colors } = useTheme();
  const { isSignedIn, initializing } = useAuth();

  /**
   * Só liberamos a splash nativa quando já sabemos se há sessão. Isso evita o
   * pisca da tela de login aparecendo para quem já está logado.
   */
  useEffect(() => {
    if (!initializing) {
      SplashScreen.hideAsync();
    }
  }, [initializing]);

  if (initializing) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
