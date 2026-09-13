import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { fontFamily, minTouchTarget, radius, spacing } from '@/theme';

/** Altura da entrada de uma linha (`597:16`). */
const ALTURA = 48;

/** Campo com rótulo e entrada — 8px entre os dois, raio 8, borda `border/default`. */
export function CampoTexto({
  rotulo,
  erro,
  linhas = 1,
  ...rest
}: Omit<TextInputProps, 'style' | 'multiline'> & {
  rotulo: string;
  erro?: string;
  /** 1 = uma linha; acima disso vira área de texto (`597:52` usa 144px ≈ 5 linhas). */
  linhas?: number;
}) {
  const { colors } = useTheme();
  const multilinha = linhas > 1;

  return (
    <View style={styles.campo}>
      <Text variant="supportSemibold">{rotulo}</Text>

      <TextInput
        accessibilityLabel={rotulo}
        accessibilityHint={erro}
        multiline={multilinha}
        textAlignVertical={multilinha ? 'top' : 'center'}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.entrada,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: erro ? colors.error : colors.border,
            height: multilinha ? 22 * linhas + 22 : ALTURA,
            paddingTop: multilinha ? 11 : 0,
          },
        ]}
        {...rest}
      />

      {erro ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

export type Opcao = { id: string; nome: string };

/**
 * Escolha única. Fechado, é a caixa com "Sêneca ▾" do Figma (`597:24`);
 * tocando, a lista abre logo abaixo — em vez de um menu flutuante, que não
 * existe de forma nativa no React Native.
 */
export function CampoSelecao({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
  vazio = 'Selecionar…',
  erro,
}: {
  rotulo: string;
  opcoes: readonly Opcao[];
  valor: string;
  aoEscolher: (id: string) => void;
  vazio?: string;
  erro?: string;
}) {
  const { colors } = useTheme();
  const [aberto, setAberto] = useState(false);

  const escolhida = opcoes.find((opcao) => opcao.id === valor);

  return (
    <View style={styles.campo}>
      <Text variant="supportSemibold">{rotulo}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityValue={{ text: escolhida?.nome ?? vazio }}
        accessibilityState={{ expanded: aberto }}
        onPress={() => setAberto((atual) => !atual)}
        style={[
          styles.entrada,
          styles.selecao,
          {
            backgroundColor: colors.surface,
            borderColor: erro ? colors.error : colors.border,
            height: ALTURA,
          },
        ]}>
        <Text color={escolhida ? 'text' : 'textSecondary'}>{escolhida?.nome ?? vazio}</Text>
        <Text color="textSecondary">{aberto ? '▴' : '▾'}</Text>
      </Pressable>

      {aberto ? (
        <View style={[styles.lista, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {opcoes.map((opcao) => {
            const ativa = opcao.id === valor;

            return (
              <Pressable
                key={opcao.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativa }}
                onPress={() => {
                  aoEscolher(opcao.id);
                  setAberto(false);
                }}
                style={[styles.itemLista, ativa && { backgroundColor: colors.selected }]}>
                <Text color={ativa ? 'text' : 'textSecondary'}>{opcao.nome}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {erro ? (
        <Text variant="bodySmall" color="error">
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

/** Escolha múltipla em pílulas — usado em Temas, que aceita mais de um. */
export function CampoMultiSelecao({
  rotulo,
  opcoes,
  valores,
  aoAlternar,
}: {
  rotulo: string;
  opcoes: readonly Opcao[];
  valores: string[];
  aoAlternar: (id: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.campo}>
      <Text variant="supportSemibold">{rotulo}</Text>

      <View style={styles.pilulas}>
        {opcoes.map((opcao) => {
          const ativa = valores.includes(opcao.id);

          return (
            <Pressable
              key={opcao.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ativa }}
              accessibilityLabel={opcao.nome}
              onPress={() => aoAlternar(opcao.id)}
              style={[
                styles.pilula,
                ativa
                  ? { backgroundColor: colors.accent }
                  : { borderWidth: 1, borderColor: colors.accent },
              ]}>
              <Text color={ativa ? 'textOnAccent' : 'accent'}>{opcao.nome}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  campo: {
    gap: spacing.sm,
  },
  entrada: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  selecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lista: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemLista: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pilulas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pilula: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
});
