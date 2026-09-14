import { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardRetratoFilosofo } from '@/components/cards/retrato-filosofo';
import { OpcaoInteresse, OpcaoNivel } from '@/components/onboarding/opcoes';
import { ProgressoOnboarding } from '@/components/onboarding/progresso';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding, type ParcialOnboarding } from '@/lib/onboarding-context';
import { spacing } from '@/theme';

const NIVEIS = [
  { id: 'leigo', titulo: 'Leigo', descricao: 'Não possuo conhecimento prévio' },
  { id: 'curioso', titulo: 'Curioso', descricao: 'Assunto interessante para aprender' },
  { id: 'estudioso', titulo: 'Estudioso', descricao: 'Não possuo conhecimento prévio' },
  { id: 'erudito', titulo: 'Erudito', descricao: 'Proficiência em filosofia' },
] as const;

const INTERESSES = [
  { id: 'autoconhecimento', rotulo: 'Autoconhecimento' },
  { id: 'etica-convivencia', rotulo: 'Ética e convivência' },
  { id: 'pensamento-critico', rotulo: 'Pensamento crítico' },
  { id: 'felicidade-proposito', rotulo: 'Felicidade e propósito' },
  { id: 'redes-sociais', rotulo: 'Redes sociais e influência' },
  { id: 'consumo-dinheiro', rotulo: 'Consumo e dinheiro' },
] as const;

const TOTAL_ETAPAS = 2;
const HORIZONTAL_PADDING = 28;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { finishOnboarding, parcial, salvarParcial } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);

  /**
   * Etapa e escolhas num objeto só.
   *
   * Retoma de onde parou (contrato `618:18`, item 02) — o provedor termina de
   * ler o armazenamento antes desta tela montar, então o valor inicial serve.
   * Manter tudo junto garante que cada mudança seja gravada por inteiro, em vez
   * de três estados que podem sair de sincronia com o que está no aparelho.
   */
  const [rascunho, setRascunho] = useState<ParcialOnboarding>(
    () => parcial ?? { etapa: 0, nivel: null, interesses: [] },
  );

  const { etapa, nivel, interesses } = rascunho;

  function atualizar(mudanca: Partial<ParcialOnboarding>) {
    const proximo = { ...rascunho, ...mudanca };
    setRascunho(proximo);
    salvarParcial(proximo);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });

    if (rascunho.etapa === 0) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const anterior = { ...rascunho, etapa: rascunho.etapa - 1 };
      setRascunho(anterior);
      salvarParcial(anterior);
      return true;
    });

    return () => subscription.remove();
  }, [rascunho, salvarParcial]);

  function alternarInteresse(id: string) {
    atualizar({
      interesses: interesses.includes(id)
        ? interesses.filter((item) => item !== id)
        : [...interesses, id],
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={styles.cabecalho}>
          {etapa === 0 ? (
            <View style={styles.kicker}>
              <Text variant="onboardingKicker" color="textAccent">
                CAMINHADA DE APRENDIZADO
              </Text>
              <View style={[styles.kickerLinha, { backgroundColor: colors.gold }]} />
            </View>
          ) : (
            <View />
          )}
          <Text variant="supportSemibold" style={styles.numero}>
            {String(etapa + 1).padStart(2, '0')}
          </Text>
        </View>

        {etapa === 0 ? (
          <View style={styles.corpo}>
            <View style={styles.introducao}>
              <Text variant="onboardingTitle" accessibilityRole="header">
                {'UMA PAUSA\nPARA PENSAR'}
              </Text>
              <Text>
                Filosofia, ensinamentos e reflexões para o cotidiano, que leva a ideia ao
                cotidiano.
              </Text>
            </View>

            <View style={styles.secao} accessibilityRole="radiogroup">
              <Text variant="cardHeading">Selecione seu nível dentro da filosofia:</Text>
              <View style={styles.lista}>
                {NIVEIS.map((item) => (
                  <OpcaoNivel
                    key={item.id}
                    titulo={item.titulo}
                    descricao={item.descricao}
                    selecionado={nivel === item.id}
                    onPress={() => atualizar({ nivel: item.id })}
                  />
                ))}
              </View>
            </View>

            <CardRetratoFilosofo
              nome="Sêneca"
              contexto="Filósofo estoico e senador romano"
              periodo="4 a.C. — 65 d.C."
              imagem={require('@/assets/images/retratos/seneca-abertura.png')}
              largura={181}
              altura={138}
              recorte={{ width: '112.4%', height: '166.46%', left: 0, top: '-3.34%' }}
            />
          </View>
        ) : (
          <View style={[styles.corpo, styles.corpoCompacto]}>
            <Text variant="onboardingTitleCompact" accessibilityRole="header">
              {'O QUE VOCÊ DESEJA\nEXPLORAR?'}
            </Text>

            <View style={styles.secao}>
              <View style={styles.tituloSecao}>
                <Text variant="onboardingKicker" color="textAccent">
                  JORNADA INICIAL
                </Text>
                <Text variant="cardHeading">Escolha seus fundamentos do estoicismo</Text>
              </View>
              <View style={styles.lista}>
                {INTERESSES.map((item) => (
                  <OpcaoInteresse
                    key={item.id}
                    rotulo={item.rotulo}
                    selecionado={interesses.includes(item.id)}
                    onPress={() => alternarInteresse(item.id)}
                  />
                ))}
              </View>
            </View>

            <CardRetratoFilosofo
              nome="Friedrich Nietzsche"
              contexto="Filósofo alemão"
              periodo="1844 — 1900"
              imagem={require('@/assets/images/retratos/nietzsche-leitura.png')}
              largura={167}
              altura={136}
              recorte={{ width: '102.04%', height: '121.48%', left: '0.18%', top: '-5.19%' }}
            />
          </View>
        )}

        <View style={[styles.rodape, etapa === 0 && styles.rodapeAmplo]}>
          {etapa === 0 ? (
            <Button
              label="COMEÇAR"
              shape="rounded"
              onPress={() => atualizar({ etapa: 1 })}
            />
          ) : (
            <Button
              label="CONTINUAR"
              shape="rounded"
              onPress={() => finishOnboarding({ nivel, interesses })}
            />
          )}
          <ProgressoOnboarding etapa={etapa} total={TOTAL_ETAPAS} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing['2xl'],
    paddingBottom: 30,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kicker: {
    marginTop: spacing.lg,
    gap: 5,
  },
  kickerLinha: {
    width: 230,
    height: 2,
  },
  numero: {
    textAlign: 'right',
  },
  corpo: {
    marginTop: spacing['2xl'],
    gap: spacing['2xl'],
  },
  corpoCompacto: {
    marginTop: spacing.lg,
    gap: spacing['2xl'],
  },
  introducao: {
    gap: spacing.xl,
  },
  tituloSecao: {
    gap: spacing.sm,
  },
  secao: {
    gap: spacing.lg,
  },
  lista: {
    gap: spacing.sm,
  },
  rodape: {
    marginTop: spacing['2xl'],
    gap: spacing['4xl'],
  },
  rodapeAmplo: {
    gap: spacing['5xl'],
  },
});
