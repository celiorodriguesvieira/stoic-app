import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="entrar" />
      <Stack.Screen name="criar-conta" />
    </Stack>
  );
}
