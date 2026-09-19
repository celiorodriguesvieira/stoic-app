import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CabecalhoApp } from '@/components/ui/CabecalhoApp';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { observarAtividadesPublicadas } from '@/lib/admin/repositorio';
import { ROTULO_TIPO_ATIVIDADE, type Atividade } from '@/lib/admin/tipos';
import { useEdicaoAtiva } from '@/lib/edicao-ativa';
import { radius, spacing } from '@/theme';

/** "Escolha pelo tempo": 2, 5 e 10 minutos (`66:16`–`66:20`). */
const TEMPOS = [2, 5, 10] as const;

/** "Ordenação · 2 min" — a meta de cada item da lista (`66:24`). */
function meta(atividade: Atividade): string {
  return `${ROTULO_TIPO_ATIVIDADE[atividade.tipo]} · ${atividade.duracaoMinutos} min`;
}

/**
 * Atividades / Início (`66:5`).
 *
 * A recomendada é a atividade da semana da edição ativa: é a que a redação
 * escolheu para acompanhar a aula em destaque. A "atividade recomendada" da
 * programação (`595:7`) ainda não existe; quando existir, ela manda aqui.
 *
 * O filtro de tempo mostra o que cabe no tempo escolhido (até N minutos), e
 * tocar de novo no mesmo tempo desfaz o filtro.
 */
export default function AtividadesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { ativa } = useEdicaoAtiva();

  const [atividades, setAtividades] = useState<Atividade[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);

  useEffect(
    () =>
      observarAtividadesPublicadas(
        (lidas) => {
          setAtividades(lidas);
          setErro(null);
        },
        (falha) => setErro(falha.message),
      ),
    [],
  );

  const recomendada = useMemo(() => {
    const id = ativa?.aula.aula.atividadeId;

    return id ? (atividades ?? []).find((atividade) => atividade.id === id) ?? null : null;
  }, [ativa, atividades]);

  const outras = useMemo(
    () =>
      (atividades ?? []).filter(
        (atividade) =>
          atividade.id !== recomendada?.id && (tempo === null || atividade.duracaoMinutos <= tempo),
      ),
    [atividades, recomendada, tempo],
  );

  const abrir = (atividade: Atividade) => router.push(`/atividade/${atividade.id}`);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <CabecalhoApp
          titulo="PRATIQUE UMA IDEIA"
          apoio="Escolha uma atividade curta para observar, pensar e agir com mais clareza."
        />

        {recomendada ? (
          <View style={styles.secao}>
            <Text variant="cardLabel" color="textAccent">
              RECOMENDADA PARA HOJE
            </Text>

            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${recomendada.titulo}. ${meta(recomendada)}. Começar`}
              onPress={() => abrir(recomendada)}
              style={({ pressed }) => [
                styles.recomendada,
                { backgroundColor: colors.canvas, borderColor: colors.border },
                pressed && styles.pressionado,
              ]}>
              <Text variant="cardLabel" color="textAccent">
                {`${ROTULO_TIPO_ATIVIDADE[recomendada.tipo]} · ${recomendada.duracaoMinutos} MIN`.toLocaleUpperCase(
                  'pt-BR',
                )}
              </Text>
              <Text variant="cardTitle">{recomendada.titulo.toLocaleUpperCase('pt-BR')}</Text>
              <Text variant="cardLabel" color="textAccent" style={styles.comecar}>
                COMEÇAR →
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.secao}>
          <Text variant="cardLabel" color="textAccent">
            ESCOLHA PELO TEMPO
          </Text>

          <View style={styles.tempos} accessibilityRole="radiogroup">
            {TEMPOS.map((minutos) => {
              const ativo = tempo === minutos;

              return (
                <Pressable
                  key={minutos}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Até ${minutos} minutos`}
                  onPress={() => setTempo(ativo ? null : minutos)}
                  // Alvo de 48px em volta da pílula de 36 (`649:987`, item 06).
                  style={styles.alvoTempo}>
                  <View
                    style={[
                      styles.pilula,
                      ativo
                        ? { backgroundColor: colors.gold, borderColor: colors.gold }
                        : { borderColor: colors.border },
                    ]}>
                    <Text variant="cardLabel">{`${minutos} MIN`}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.secao}>
          <Text variant="cardLabel" color="textAccent">
            {recomendada ? 'OUTRAS ATIVIDADES' : 'ATIVIDADES'}
          </Text>

          {erro ? (
            <Text color="error" accessibilityLiveRegion="polite">
              {erro}
            </Text>
          ) : atividades === null ? (
            <ActivityIndicator color={colors.accent} style={styles.espera} />
          ) : outras.length === 0 ? (
            <Text color="textSecondary">
              {tempo !== null ? 'Nenhuma atividade neste tempo.' : 'Nenhuma atividade disponível ainda.'}
            </Text>
          ) : (
            <View>
              {outras.map((atividade) => (
                <Pressable
                  key={atividade.id}
                  accessibilityRole="link"
                  accessibilityLabel={`${atividade.titulo}. ${meta(atividade)}`}
                  onPress={() => abrir(atividade)}
                  style={({ pressed }) => [styles.item, pressed && styles.pressionado]}>
                  <View style={styles.textoItem}>
                    <Text variant="cardHeading">{atividade.titulo}</Text>
                    <Text variant="citationSource" color="textSecondary">
                      {meta(atividade)}
                    </Text>
                  </View>

                  <Image
                    source={require('@/assets/images/icones/avancar.svg')}
                    style={styles.seta}
                    tintColor={colors.wine}
                    accessible={false}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// Medidas do `66:5`: card recomendado 342×154, pílulas 88×36, itens a cada 62px.
const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['3xl'],
  },
  secao: {
    gap: spacing.md,
  },
  recomendada: {
    minHeight: 154,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  comecar: {
    marginTop: 'auto',
  },
  tempos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    marginVertical: -6,
  },
  alvoTempo: {
    minHeight: 48,
    justifyContent: 'center',
  },
  pilula: {
    height: 36,
    width: 88,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  textoItem: {
    flex: 1,
    gap: spacing.xs,
  },
  seta: {
    width: 24,
    height: 24,
  },
  pressionado: {
    opacity: 0.6,
  },
  espera: {
    alignSelf: 'flex-start',
  },
});
