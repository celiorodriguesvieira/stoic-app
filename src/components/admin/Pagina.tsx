import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

/** Largura do frame de referência no Figma (`595:3`). O painel é desktop. */
const LARGURA = 1200;

type PaginaAdminProps = {
  titulo: string;
  apoio?: string;
  /** Linha acima do título — "PAUSA / ADMINISTRADOR" ou o botão de voltar. */
  topo?: ReactNode;
  /** Rodapé de nota editorial, em `supportSemibold`. */
  nota?: string;
  children: ReactNode;
};

export function PaginaAdmin({ titulo, apoio, topo, nota, children }: PaginaAdminProps) {
  const { colors } = useTheme();

  return (
    // O painel foi desenhado para desktop, mas abre no aparelho — e sem a área
    // segura o topo da página ficava por baixo do relógio e do entalhe. As
    // laterais entram por causa do entalhe em paisagem; embaixo, do indicador
    // de início.
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.area, { backgroundColor: colors.surface }]}>
      <ScrollView
        style={{ backgroundColor: colors.surface }}
        contentContainerStyle={styles.rolagem}
        // O teclado cobria o campo em foco. Ajustar o recuo da rolagem, e não
        // envolver num `KeyboardAvoidingView` como fazem as telas de login, é
        // o que funciona aqui: os formulários do painel são longos, e só o
        // recuo faz o iOS rolar até o campo em foco. Encolher a área, sozinho,
        // deixaria o campo fora da vista do mesmo jeito.
        automaticallyAdjustKeyboardInsets
        // Tocar em "Salvar" com o teclado aberto tem de valer na primeira vez,
        // em vez de o primeiro toque só fechar o teclado.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <View style={styles.coluna}>
          {topo}

          <Text variant="headingLarge" accessibilityRole="header">
            {titulo}
          </Text>

          {apoio ? <Text variant="bodyMedium">{apoio}</Text> : null}

          {children}

          {nota ? <Text variant="supportSemibold">{nota}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Caixa de seção: fundo `bg/canvas`, padding 24. Nós `595:1138`, `596:1151`,
 * `597:57`.
 *
 * Tipografia medida no `668:202`: título de seção em 22/28 (`headingMedium`),
 * apoio em 16/22 (`bodyMedium`), rótulo de campo em 14 semibold. Estavam todos
 * em 14 semibold, o que achatava a hierarquia e deixava a tela sem respiro.
 */
export function CaixaSecao({
  titulo,
  apoio,
  espacamento = 'lg',
  children,
}: {
  titulo?: string;
  apoio?: string;
  /** 8px dentro de formulários (`596:1151`), 16px em listas (`595:1138`). */
  espacamento?: 'sm' | 'lg';
  children?: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.caixa,
        { backgroundColor: colors.canvas, gap: spacing[espacamento] },
      ]}>
      {titulo ? <Text variant="headingMedium">{titulo}</Text> : null}
      {apoio ? <Text variant="bodyMedium">{apoio}</Text> : null}
      {children}
    </View>
  );
}

/** Linha de ações ou de campos lado a lado, com 16px entre eles. */
export function Linha({ children }: { children: ReactNode }) {
  return <View style={styles.linha}>{children}</View>;
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  rolagem: {
    paddingHorizontal: spacing['2xl'],
    // 16px depois da área segura, como manda o contrato editorial: "posicionar
    // o início do cabeçalho em safeAreaTop + 16 px… não somar duas vezes
    // quando o contêiner já a aplica". O `SafeAreaView` em volta é quem aplica
    // a área segura; aqui só entra o respiro de 16.
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  coluna: {
    width: '100%',
    maxWidth: LARGURA,
    gap: spacing['2xl'],
  },
  caixa: {
    padding: spacing['2xl'],
    overflow: 'hidden',
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
});
