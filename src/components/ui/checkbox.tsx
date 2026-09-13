import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const SIZE = 16;
const CHECK_SIZE = 10;

// Só o desenho; o papel acessível (checkbox ou radio) fica com o elemento tocável que o contém.
export function Checkbox({ checked }: { checked: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.box, { borderColor: checked ? colors.gold : colors.border }]}>
      {checked ? (
        <Image
          source={require('@/assets/images/icones/check.svg')}
          style={styles.check}
          tintColor={colors.gold}
          accessible={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderWidth: 1.25,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
  },
});
