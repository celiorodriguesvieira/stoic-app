import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CitacaoAutoria } from '@/components/CitacaoAutoria';
import { EpictetoSequence } from '@/components/EpictetoSequence';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

// 5 s dá tempo de ler o título e a citação (a spec do Figma previa 2,2 s, curto demais na prática).
// A transição cruzada de 450 ms segue a spec.
const SPLASH_MS = 5000;
const FADE_MS = 450;

type SplashOverlayProps = {
  onFinish: () => void;
};

export function SplashOverlay({ onFinish }: SplashOverlayProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }

    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!active) return;

      if (reduceMotion) {
        onFinish();
        return;
      }

      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    });

    return () => {
      active = false;
    };
  }, [leaving, onFinish, opacity]);

  return (
    <Animated.View
      accessibilityViewIsModal
      pointerEvents={leaving ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, { opacity, backgroundColor: colors.surface }]}>
      {/* Sem botão: a splash avança sozinha; tocar em qualquer lugar só adianta a saída. */}
      <Pressable accessible={false} style={styles.fill} onPress={() => setLeaving(true)}>
        <SafeAreaView style={styles.safeArea}>
          <Text variant="splashKicker" style={styles.kicker}>
            BOAS-VINDAS!
          </Text>

          <EpictetoSequence style={styles.art} />

          <View style={styles.editorial}>
            <View>
              <Text variant="splashHeading" style={styles.heading}>
                PARE. PENSE.
              </Text>
              <Text variant="splashHeading" color="textAccent" style={styles.heading}>
                ESCOLHA.
              </Text>
            </View>

            <Text variant="quote" style={styles.quote}>
              “Mancar é um impedimento para a perna, mas não para a vontade.”
            </Text>

            <CitacaoAutoria autor="Epicteto" obra="Encheirídion, 9" />
          </View>
        </SafeAreaView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  kicker: {
    textAlign: 'center',
  },

  art: {
    flex: 1,
    minHeight: 200,
  },
  editorial: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  heading: {
    textAlign: 'center',
  },
  quote: {
    textAlign: 'center',
    maxWidth: 272,
  },
});
