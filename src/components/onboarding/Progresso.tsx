import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const DOT = 8;
const ACTIVE_WIDTH = 22;

export function ProgressoOnboarding({ etapa, total }: { etapa: number; total: number }) {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityLabel={`Etapa ${etapa + 1} de ${total}`}
      style={styles.row}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === etapa
              ? { width: ACTIVE_WIDTH, backgroundColor: colors.gold }
              : { backgroundColor: colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
});
