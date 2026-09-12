/**
 * Epicteto animado — sequência "Movimento da mão" (nós 100:3, 103:5, 103:6).
 *
 * A animação do Figma tem 2s em loop com easing `step-end`: são cortes secos
 * entre três quadros de pixel art, sem transição. Por isso não usamos
 * interpolação — apenas trocamos qual quadro está visível.
 *
 * Os três quadros ficam montados o tempo todo, alternando opacidade, para que
 * nenhum precise ser carregado no meio do ciclo (o que causaria um piscar).
 */

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, type ViewProps } from 'react-native';

/** Tempos extraídos dos keyframes do Figma — ciclo total de 2000ms. */
const FRAMES = [
  { source: require('@/assets/images/epicteto/01-repouso.png'), durationMs: 180 },
  { source: require('@/assets/images/epicteto/02-ajuste.png'), durationMs: 140 },
  { source: require('@/assets/images/epicteto/03-retorno.png'), durationMs: 1680 },
] as const;

/**
 * Quadro exibido quando o usuário pede movimento reduzido. É o "Retorno",
 * que ocupa 84% do ciclo — ou seja, o estado em que a arte já passa a maior
 * parte do tempo.
 */
const RESTING_FRAME = 2;

/** Proporção original da arte (591 × 886). */
const ASPECT_RATIO = 591 / 886;

export function EpictetoSequence(props: ViewProps) {
  const [frame, setFrame] = useState(RESTING_FRAME);
  const [reduceMotion, setReduceMotion] = useState(true);

  // Começamos assumindo movimento reduzido e só animamos após confirmar a
  // preferência: evita um piscar de animação para quem desativou movimento.
  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setFrame(RESTING_FRAME);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    // Cada quadro agenda o próximo com a sua própria duração — um
    // `setInterval` único não serviria, porque as durações são diferentes.
    const showFrame = (index: number) => {
      setFrame(index);
      timer = setTimeout(() => showFrame((index + 1) % FRAMES.length), FRAMES[index].durationMs);
    };

    showFrame(0);

    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Epicteto" {...props}>
      {FRAMES.map((item, index) => (
        <Image
          key={index}
          source={item.source}
          // `opacity` no estilo (o expo-image não aceita como prop):
          // mantém os três quadros montados e em cache.
          style={[styles.frame, index > 0 && styles.overlay, { opacity: index === frame ? 1 : 0 }]}
          contentFit="contain"
          // A arte é pixel art: a transição do Figma é corte seco, então
          // qualquer fade aqui seria infiel ao desenho.
          transition={0}
          pointerEvents="none"
          accessible={false}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    height: '100%',
    aspectRatio: ASPECT_RATIO,
    alignSelf: 'center',
  },
  // O primeiro quadro dita o espaço ocupado; os demais se sobrepõem a ele.
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
