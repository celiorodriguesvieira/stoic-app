import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardAutorDestaque } from '@/components/cards/autor-destaque';
import { CardFilosofoHorizontal } from '@/components/cards/filosofo-horizontal';
import { CardMensagemSemanal } from '@/components/cards/mensagem-semanal';
import { CardTemaDestaque } from '@/components/cards/tema-destaque';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

const MENSAGEM_SEMANAL = {
  citacao: '“Você tem poder sobre a sua mente, não sobre os acontecimentos.”',
  autor: 'Marco Aurélio',
  obra: 'Meditações',
  retrato: require('@/assets/images/retratos/marco-aurelio.png'),
};

const AUTORES = [
  { nome: 'Sêneca', apoio: 'Filósofo\nestoico\n4 a.C. — 65 d.C.' },
  { nome: 'Epicteto', apoio: 'Filósofo\nestoico\n50 — 135 d.C.' },
  { nome: 'Marco Aurélio', apoio: 'Imperador\nestoico\n121 — 180 d.C.' },
  { nome: 'Musônio', apoio: 'Filósofo\nestoico\n30 — 101 d.C.' },
];

const TEMAS = [
  { categoria: 'Estoicismo', titulo: 'Com Sêneca' },
  { categoria: 'Virtude', titulo: 'O que depende de nós' },
];

const LEITURAS = [
  { rotulo: 'Estoicismo', titulo: 'Sêneca', descricao: 'Cartas sobre a vida' },
  { rotulo: 'Virtude', titulo: 'Epicteto', descricao: 'Encheirídion' },
  { rotulo: 'Dever', titulo: 'Marco Aurélio', descricao: 'Meditações' },
];

export default function HojeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <Text variant="headingLarge">Hoje</Text>
          <Text variant="bodySmall" color="textSecondary">
            Uma pausa por dia.
          </Text>
        </View>

        <CardMensagemSemanal {...MENSAGEM_SEMANAL} />

        <View style={styles.secao}>
          <Text variant="headingMedium">Autores</Text>
          <View style={styles.grade}>
            {AUTORES.map((autor) => (
              <CardAutorDestaque key={autor.nome} style={styles.itemGrade} {...autor} />
            ))}
          </View>
        </View>

        <View style={styles.secao}>
          <Text variant="headingMedium">Temas</Text>
          <View style={styles.grade}>
            {TEMAS.map((tema) => (
              <CardTemaDestaque key={tema.titulo} style={styles.itemGrade} {...tema} />
            ))}
          </View>
        </View>

        <View style={styles.secao}>
          <Text variant="headingMedium" style={styles.tituloSecaoRecuado}>
            Continue lendo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carrossel}>
            {LEITURAS.map((leitura) => (
              <CardFilosofoHorizontal key={leitura.titulo} {...leitura} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['4xl'],
    gap: spacing['3xl'],
  },
  cabecalho: {
    gap: spacing.xs,
  },
  secao: {
    gap: spacing.lg,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  itemGrade: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  tituloSecaoRecuado: {
    marginBottom: -spacing.xs,
  },
  carrossel: {
    gap: spacing.md,
    paddingRight: spacing['2xl'],
  },
});
