import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

const ICON_SIZE = 24;
const BAR_CONTENT_HEIGHT = 59;

const ITEMS = {
  index: {
    label: 'HOJE',
    ativo: require('@/assets/icons/nav/hoje-ativo.svg'),
    inativo: require('@/assets/icons/nav/hoje-inativo.svg'),
  },
  explorar: {
    label: 'EXPLORAR',
    ativo: require('@/assets/icons/nav/explorar-ativo.svg'),
    inativo: require('@/assets/icons/nav/explorar-inativo.svg'),
  },
  atividades: {
    label: 'ATIVIDADES',
    ativo: require('@/assets/icons/nav/atividades-ativo.svg'),
    inativo: require('@/assets/icons/nav/atividades-inativo.svg'),
  },
  biblioteca: {
    label: 'BIBLIOTECA',
    ativo: require('@/assets/icons/nav/biblioteca-ativo.svg'),
    inativo: require('@/assets/icons/nav/biblioteca-inativo.svg'),
  },
} as const;

type RouteName = keyof typeof ITEMS;

export type BottomNavigationProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>['tabBar']>
>[0];

export function BottomNavigation({ state, navigation, insets }: BottomNavigationProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}>
      {state.routes.map((route, index) => {
        const item = ITEMS[route.name as RouteName];
        if (!item) return null;

        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={onPress}
            style={styles.item}>
            <Image
              source={focused ? item.ativo : item.inativo}
              style={styles.icon}
              contentFit="contain"
            />
            <Text variant="labelNav" color={focused ? 'text' : 'textSecondary'}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
  },
  item: {
    flex: 1,
    minHeight: BAR_CONTENT_HEIGHT,
    alignItems: 'center',
    gap: 7,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
