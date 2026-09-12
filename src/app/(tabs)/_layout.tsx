import { Tabs } from 'expo-router';

import { BottomNavigation } from '@/components/ui/bottom-navigation';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNavigation {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="atividades" options={{ title: 'Atividades' }} />
      <Tabs.Screen name="biblioteca" options={{ title: 'Biblioteca' }} />
    </Tabs>
  );
}
