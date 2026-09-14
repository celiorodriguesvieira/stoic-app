import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PixelifySans_400Regular } from '@expo-google-fonts/pixelify-sans/400Regular';
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans/500Medium';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
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
  const { isSignedIn, verificacaoPendente, initializing: authInitializing } = useAuth();
  const { onboardingDone, initializing: onboardingInitializing } = useOnboarding();

  // A splash abre TODA sessão, sem exceção — inclusive o painel administrativo.
  // Roda por cima da rota inicial, que já carrega por baixo.
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

  return (
    <View style={styles.root}>
      <View
        style={styles.root}
        importantForAccessibility={splashDone ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!splashDone}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
          }}>
          {/*
            Contrato de navegação `618:18`.

            01 · Primeiro acesso: Boas-vindas → Criar conta ou Entrar.
                 Não existe entrada sem cadastro (item 06).
            02 · Depois: decidido pelo estado salvo, nunca por contagem de aberturas.

            A verificação de e-mail mantém a pessoa em `(auth)` mesmo já
            autenticada — é a etapa entre o cadastro e o onboarding.
          */}
          <Stack.Protected guard={isSignedIn && !verificacaoPendente && onboardingDone}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={isSignedIn && !verificacaoPendente && !onboardingDone}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>

          <Stack.Protected guard={!isSignedIn || verificacaoPendente}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          {/*
            04 · O painel é sempre montado: quem não tem papel precisa receber
            "Acesso não autorizado", e não ver a rota desaparecer sem explicação.
            Quem decide é `admin/_layout.tsx`. Os dados seguem protegidos pelas
            Security Rules — a tela nunca foi a barreira.
          */}
          <Stack.Screen name="admin" />
        </Stack>
      </View>

      {!splashDone && <SplashOverlay onFinish={finishSplash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
