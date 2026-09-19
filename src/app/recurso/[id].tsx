import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetalheRecurso } from '@/components/biblioteca/DetalheRecurso';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { observarRecurso } from '@/lib/admin/repositorio';
import type { RecursoBiblioteca } from '@/lib/admin/tipos';
import { minTouchTarget, spacing } from '@/theme';

/**
 * Biblioteca / Detalhe (`67:6`).
 *
 * Tela de detalhe: usa Voltar, sem o menu da conta (item 14 do `649:987`).
 * Recurso arquivado ou despublicado deixa de ser legível pelas regras, e a
 * recusa chega aqui como erro — o contrato manda "mostrar indisponível,
 * oferecer voltar" (`668:114`), não um aviso técnico.
 */
export default function RecursoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recurso, setRecurso] = useState<RecursoBiblioteca | null | undefined>(undefined);

  useEffect(
    () =>
      observarRecurso(
        id,
        (lido) => setRecurso(lido && lido.status === 'publicado' ? lido : null),
        () => setRecurso(null),
      ),
    [id],
  );

  // Link direto sem histórico volta à área principal correspondente (`654:1760`).
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/biblioteca'));

  return (
    <SafeAreaView edges={['top']} style={[styles.area, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para a Biblioteca"
          onPress={voltar}
          style={styles.voltar}>
          <Image
            source={require('@/assets/images/icones/voltar.svg')}
            style={styles.icone}
            contentFit="contain"
          />
        </Pressable>

        {recurso === undefined ? (
          <ActivityIndicator color={colors.accent} style={styles.espera} />
        ) : recurso === null ? (
          <View style={styles.indisponivel} accessibilityLiveRegion="polite">
            <Text variant="headingMedium">Conteúdo indisponível.</Text>
            <Button label="VOLTAR À BIBLIOTECA" onPress={voltar} />
          </View>
        ) : (
          <DetalheRecurso recurso={recurso} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  voltar: {
    width: Math.max(48, minTouchTarget),
    height: Math.max(48, minTouchTarget),
    justifyContent: 'center',
    // O ícone fica na margem de 24px, como no Figma; o alvo cresce para fora.
    marginLeft: -spacing.md,
    paddingLeft: spacing.md,
  },
  icone: {
    width: 24,
    height: 24,
  },
  espera: {
    marginTop: spacing['3xl'],
  },
  indisponivel: {
    gap: spacing['2xl'],
  },
});
