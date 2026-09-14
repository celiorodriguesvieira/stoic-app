import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="criar-conta" />
      <Stack.Screen name="entrar" />
      <Stack.Screen name="recuperar-senha" />
      <Stack.Screen name="verificar-email" />
    </Stack>
  );
}
