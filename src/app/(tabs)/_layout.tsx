import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { fontFamily, spacing } from '@/theme';

/**
 * Navegação principal — espelha o componente "Navigation / Bottom" do Figma.
 *
 * TODO: substituir a barra padrão por `tabBar={...}` com o componente do
 * design system (inclui ícones e o indicador de item ativo). Por enquanto os
 * rótulos usam a Pixelify Sans, que já é a fonte correta de ação.
 */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.display,
          fontSize: 12,
          paddingTop: spacing.xs,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="atividades" options={{ title: 'Atividades' }} />
      <Tabs.Screen name="biblioteca" options={{ title: 'Biblioteca' }} />
    </Tabs>
  );
}
