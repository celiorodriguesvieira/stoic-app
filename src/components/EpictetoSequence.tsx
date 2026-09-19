import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View, type ViewProps } from 'react-native';

const FRAMES = [
  { source: require('@/assets/images/epicteto/01-repouso.png'), durationMs: 180 },
  { source: require('@/assets/images/epicteto/02-ajuste.png'), durationMs: 140 },
  { source: require('@/assets/images/epicteto/03-retorno.png'), durationMs: 1680 },
] as const;

const RESTING_FRAME = 2;

const ASPECT_RATIO = 591 / 886;

export function EpictetoSequence(props: ViewProps) {
  const [frame, setFrame] = useState(RESTING_FRAME);
  const [reduceMotion, setReduceMotion] = useState(true);

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
          style={[styles.frame, index > 0 && styles.overlay, { opacity: index === frame ? 1 : 0 }]}
          contentFit="contain"
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
