import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PixelifySans_400Regular } from '@expo-google-fonts/pixelify-sans/400Regular';
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans/500Medium';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SplashOverlay } from '@/components/splash-overlay';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { mode } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { isSignedIn, podeEditar, initializing: authInitializing } = useAuth();
  const { onboardingDone, initializing: onboardingInitializing } = useOnboarding();

  // O painel administrativo é separado do app público: não recebe a splash.
  const segments = useSegments();
  const noAdmin = segments[0] === 'admin';

  // A splash roda em toda abertura, por cima da rota inicial que já carrega por baixo.
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  const initializing = authInitializing || onboardingInitializing;

  useEffect(() => {
    if (!initializing) {
      SplashScreen.hideAsync();
    }
  }, [initializing]);

  if (initializing) {
    return null;
  }

  const mostrarSplash = !splashDone && !noAdmin;

  return (
    <View style={styles.root}>
      <View
        style={styles.root}
        importantForAccessibility={mostrarSplash ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={mostrarSplash}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          <Stack.Protected guard={isSignedIn && onboardingDone}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={isSignedIn && !onboardingDone}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>

          <Stack.Protected guard={!isSignedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          {/*
            Painel administrativo. A pilha só existe para editor ou administrador —
            quem não tem papel não consegue nem digitar /admin na barra de endereço.
            É conveniência de navegação, não segurança: quem protege os dados são as
            Security Rules em `firestore.rules`.
          */}
          <Stack.Protected guard={podeEditar}>
            <Stack.Screen name="admin" />
          </Stack.Protected>
        </Stack>
      </View>

      {mostrarSplash && <SplashOverlay onFinish={finishSplash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
