import { Image } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { retratoDoAcervo } from '@/lib/retratos';
import { radius, spacing } from '@/theme';

const ALTURA = 210;
/**
 * O `327:502` desenha 146×105, pensado para o retrato do Marco Aurélio. Os
 * retratos do acervo são quase verticais (o do Sêneca é 1182×1331), e numa
 * área larga e baixa o `contain` os encolhia a ~93px de largura. A altura de
 * 152 é a mesma do retrato no Explorar (`431:305`).
 */
const RETRATO_LARGURA = 150;
const RETRATO_ALTURA = 152;

export type ConhecimentoDaSemanaProps = ViewProps & {
  /** `weeklyCardPhrase`: frase editorial de 10–80 caracteres, **sem aspas**. */
  frase: string;
  autor: string;
  duracaoMinutos: number;
  /** Id do acervo de retratos. Sem retrato, o card fica só com o texto. */
  retratoId?: string | null;
};

/**
 * O card do Conhecimento da semana (`327:502`).
 *
 * Mostrava uma citação com autor e obra até 16/09. O contrato trocou isso pela
 * **frase de destaque** da aula, e a troca tem motivo escrito: "frase
 * editorial sem aspas… não atribuir frase editorial como citação literal"
 * (`668:128`). Por isso não há aspas nem nome de obra aqui — o que aparece é
 * texto da redação, não fala do filósofo.
 */
export function CardConhecimentoDaSemana({
  frase,
  autor,
  duracaoMinutos,
  retratoId = null,
  style,
  ...rest
}: ConhecimentoDaSemanaProps) {
  const { colors } = useTheme();

  const retrato = retratoDoAcervo(retratoId);

  return (
    <View style={[styles.card, { backgroundColor: colors.accent }, style]} {...rest}>
      {retrato ? (
        <Image
          source={retrato.arquivo}
          style={styles.retrato}
          contentFit="contain"
          // Decorativo: o nome do filósofo está escrito logo abaixo, e a
          // ilustração não acrescenta informação a quem ouve a tela.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}

      <View style={styles.topo}>
        <Text variant="cardTitle" color="textOnAccent" style={styles.selo}>
          CONHECIMENTO DA SEMANA
        </Text>

        {duracaoMinutos > 0 ? (
          <View style={[styles.tempo, { backgroundColor: colors.gold }]}>
            <Text variant="cardLabel" color="textOnAccent">
              {duracaoMinutos} MIN
            </Text>
          </View>
        ) : null}
      </View>

      <Text variant="cardHeading" color="textOnAccent" style={styles.frase}>
        {frase}
      </Text>

      <Text variant="labelMetadata" color="gold">
        {autor.toLocaleUpperCase('pt-BR')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: ALTURA,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  selo: {
    flex: 1,
  },
  tempo: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  retrato: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: RETRATO_LARGURA,
    height: RETRATO_ALTURA,
  },
  frase: {
    // Deixa a ilustração respirar: a frase não passa por cima do retrato.
    // 55% ≈ os 176px da frase no `327:504`, agora que o retrato é mais alto.
    maxWidth: '55%',
  },
});
