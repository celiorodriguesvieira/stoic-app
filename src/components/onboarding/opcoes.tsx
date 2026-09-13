import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type OpcaoNivelProps = {
  titulo: string;
  descricao: string;
  selecionado: boolean;
  onPress: () => void;
};

// Escolha única: o Figma desenha com checkbox, mas o papel acessível é de radio.
export function OpcaoNivel({ titulo, descricao, selecionado, onPress }: OpcaoNivelProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selecionado }}
      onPress={onPress}
      style={[
        styles.nivel,
        selecionado
          ? { backgroundColor: colors.selected, borderColor: colors.gold }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.nivelTexto}>
        <Text variant="optionTitle">{titulo.toUpperCase()}</Text>
        <Text variant="bodySmall">{descricao}</Text>
      </View>
      <Checkbox checked={selecionado} />
    </Pressable>
  );
}

type OpcaoInteresseProps = {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
};

export function OpcaoInteresse({ rotulo, selecionado, onPress }: OpcaoInteresseProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selecionado }}
      onPress={onPress}
      style={[
        styles.interesse,
        selecionado
          ? { backgroundColor: colors.selected, borderColor: colors.gold }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Text variant="optionLabel" style={styles.interesseTexto}>
        {rotulo.toUpperCase()}
      </Text>
      <Checkbox checked={selecionado} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nivel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  nivelTexto: {
    flex: 1,
    gap: spacing.sm,
  },
  interesse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    minHeight: 44,
    paddingHorizontal: 15,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  interesseTexto: {
    flex: 1,
  },
});
