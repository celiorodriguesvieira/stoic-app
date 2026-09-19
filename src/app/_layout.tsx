import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { PixelifySans_400Regular } from '@expo-google-fonts/pixelify-sans/400Regular';
import { PixelifySans_500Medium } from '@expo-google-fonts/pixelify-sans/500Medium';
import { PixelifySans_600SemiBold } from '@expo-google-fonts/pixelify-sans/600SemiBold';
import { PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans/700Bold';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { SplashOverlay } from '@/components/SplashOverlay';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
        {/* Conteúdo escuro sobre fundo claro: o app é só claro (item 04 do `649:987`). */}
        <StatusBar style="dark" />
        <RootNavigator />
      </OnboardingProvider>
    </AuthProvider>
  );
}

/**
 * Largura de referência do app (`516:837`): "viewport de referência:
 * 390 × 844px". No navegador de desktop, sem este limite, as telas do app
 * esticam de ponta a ponta — o login virava uma faixa de 2000px de largura.
 *
 * O painel administrativo é a exceção: foi desenhado em 1200px e tem o próprio
 * limite em `PaginaAdmin`.
 */
const LARGURA_DO_APP = 390;

function RootNavigator() {
  const { colors } = useTheme();
  const caminho = usePathname();
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

  // Só no navegador e fora do painel. No aparelho a tela já tem a largura certa,
  // e limitar ali deixaria faixas nas laterais em tablet.
  const emColuna = Platform.OS === 'web' && !caminho.startsWith('/admin');

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <View
        style={[styles.root, emColuna && styles.coluna]}
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
            {/* Telas abertas pelo menu "Seu espaço" — exigem conta, como ele. */}
            <Stack.Screen name="perfil" />
            <Stack.Screen name="preferencias" />
            {/* Detalhe da Biblioteca: fora das abas, com Voltar (item 14 do `649:987`). */}
            <Stack.Screen name="recurso/[id]" />
            {/* Atividade: interação e conclusão, fora das abas, com Voltar. */}
            <Stack.Screen name="atividade/[id]" />
            {/* Conhecimento da semana: as quatro etapas da aula, aberta pelo card da Home. */}
            <Stack.Screen name="aula/[id]" />
            {/* Destinos do Explorar, nas rotas do `468:985`. */}
            <Stack.Screen name="temas/[id]" />
            <Stack.Screen name="autores/[id]" />
            <Stack.Screen name="conteudos/[id]" />
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
  coluna: {
    width: '100%',
    maxWidth: LARGURA_DO_APP,
    alignSelf: 'center',
  },
  root: { flex: 1 },
});
