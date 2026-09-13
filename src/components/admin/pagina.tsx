import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
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
    <ScrollView
      style={{ backgroundColor: colors.surface }}
      contentContainerStyle={styles.rolagem}>
      <View style={styles.coluna}>
        {topo}

        <Text variant="headingLarge" accessibilityRole="header">
          {titulo}
        </Text>

        {apoio ? <Text variant="supportSemibold">{apoio}</Text> : null}

        {children}

        {nota ? <Text variant="supportSemibold">{nota}</Text> : null}
      </View>
    </ScrollView>
  );
}

/** Caixa de seção: fundo `bg/canvas`, padding 24. Nós `595:1138`, `596:1151`, `597:57`. */
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
      {titulo ? <Text variant="supportSemibold">{titulo}</Text> : null}
      {apoio ? <Text variant="supportSemibold">{apoio}</Text> : null}
      {children}
    </View>
  );
}

/** Linha de ações ou de campos lado a lado, com 16px entre eles. */
export function Linha({ children }: { children: ReactNode }) {
  return <View style={styles.linha}>{children}</View>;
}

const styles = StyleSheet.create({
  rolagem: {
    padding: spacing['2xl'],
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
