import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MenuSeuEspaco } from '@/components/ui/MenuSeuEspaco';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { minTouchTarget, spacing } from '@/theme';

/**
 * Cabeçalho das áreas principais, com o hambúrguer do menu da conta.
 *
 * Item 14 do contrato (`649:987`): o botão aparece em Hoje, Explorar,
 * Atividades e Biblioteca, sempre no canto superior direito e na mesma
 * posição. Telas de detalhe usam Voltar, e o fluxo de entrada não tem menu.
 */
export function CabecalhoApp({ titulo, apoio }: { titulo: string; apoio?: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <View style={styles.cabecalho}>
      <View style={styles.linha}>
        <View style={styles.textos}>
          <Text variant="headingLarge" accessibilityRole="header">
            {titulo}
          </Text>

          {apoio ? (
            <Text variant="bodySmall" color="textSecondary">
              {apoio}
            </Text>
          ) : null}
        </View>

        <Hamburguer aberto={aberto} aoAbrir={() => setAberto(true)} />
      </View>

      <MenuSeuEspaco aberto={aberto} aoFechar={() => setAberto(false)} />
    </View>
  );
}

/** Ícone de 24px dentro de alvo de 48×48 (item 11). Três barras, sem asset. */
function Hamburguer({ aberto, aoAbrir }: { aberto: boolean; aoAbrir: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menu"
      accessibilityState={{ expanded: aberto }}
      onPress={aoAbrir}
      style={styles.alvo}>
      <View style={styles.icone}>
        {[0, 1, 2].map((barra) => (
          <View key={barra} style={[styles.barra, { backgroundColor: colors.text }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: spacing.xs,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  textos: {
    flex: 1,
    gap: spacing.xs,
  },
  alvo: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    // Puxa o alvo para a direita sem deslocar o título: o ícone fica alinhado
    // à margem, mas a área de toque continua com 48px.
    marginRight: -spacing.md,
  },
  icone: {
    width: 24,
    height: 16,
    justifyContent: 'space-between',
  },
  barra: {
    height: 2,
    borderRadius: 1,
  },
});
