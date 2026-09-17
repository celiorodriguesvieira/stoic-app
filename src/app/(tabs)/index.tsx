import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardConhecimentoDaSemana } from '@/components/cards/mensagem-semanal';
import { CardTemaDestaque } from '@/components/cards/tema-destaque';
import { CabecalhoApp } from '@/components/ui/cabecalho-app';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoFilosofoEm } from '@/lib/admin/acervo';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { useEdicaoAtiva } from '@/lib/edicao-ativa';
import { radius, spacing } from '@/theme';

/**
 * Saudação pela hora do aparelho.
 *
 * Hora local, e não o fuso editorial: "boa noite" tem de casar com a janela de
 * quem lê, não com a agenda da redação.
 */
function saudacao(hora = new Date().getHours()): string {
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';

  return 'Boa noite';
}

export default function HojeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { perfil } = useAuth();
  const { filosofos } = useFilosofos();
  const { ativa, carregando } = useEdicaoAtiva();

  // Sem nome ainda lido, só a saudação. Melhor do que "Bom dia, " pendurado,
  // ou um "usuário" que ninguém escolheu como nome.
  const nome = perfil?.nome?.trim();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <CabecalhoApp titulo="PAUSA" apoio={nome ? `${saudacao()}, ${nome}` : saudacao()} />

        {carregando ? (
          <Aguardando />
        ) : ativa ? (
          <CardConhecimentoDaSemana
            frase={ativa.aula.aula.fraseDestaque}
            autor={nomeDoFilosofoEm(filosofos, ativa.aula.autorId)}
            duracaoMinutos={ativa.aula.aula.duracaoMinutos}
            retratoId={
              filosofos.find((filosofo) => filosofo.id === ativa.aula.autorId)?.portraitAssetId ??
              null
            }
          />
        ) : (
          <SemEdicao aoExplorar={() => router.push('/explorar')} />
        )}

        <View style={styles.atalhos}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore ideias, ver temas"
            onPress={() => router.push('/explorar')}
            style={styles.atalho}>
            <CardTemaDestaque titulo="Explore ideias" cta="VER TEMAS  →" tom="dourado" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aplique no dia a dia, começar"
            onPress={() => router.push('/atividades')}
            style={styles.atalho}>
            <CardTemaDestaque titulo="Aplique no dia-a-dia" cta="COMEÇAR  →" />
          </Pressable>
        </View>

        {/*
          "Continue de onde parou" (`327:479`) fica de fora enquanto não houver
          o que retomar. O handoff da própria seção manda: "sem histórico em
          andamento: ocultar o card e recolher seu espaço". Hoje o app não grava
          posição de leitura em lugar nenhum, então o card nunca teria o que
          mostrar — e um card de exemplo diria que existe progresso que não
          existe.
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

function Aguardando() {
  const { colors } = useTheme();

  return (
    <View style={[styles.aviso, { borderColor: colors.border }]}>
      <Text color="textSecondary">Buscando o conhecimento da semana…</Text>
    </View>
  );
}

/**
 * Semana sem programação.
 *
 * O contrato é explícito (`668:135`): "sem edição ativa: ocultar destaque e
 * oferecer Explorar; não reaproveitar semana vencida sem aviso". Por isso não
 * se repesca a última edição nem se mostra conteúdo de exemplo.
 */
function SemEdicao({ aoExplorar }: { aoExplorar: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.aviso, { borderColor: colors.border }]}>
      <Text variant="labelMetadata" color="textSecondary">
        CONHECIMENTO DA SEMANA
      </Text>

      <Text>Nenhuma edição programada para esta semana.</Text>

      <Pressable accessibilityRole="button" onPress={aoExplorar} style={styles.alvo}>
        <Text variant="labelMetadata" color="textAccent">
          EXPLORAR
        </Text>
      </Pressable>
    </View>
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
    gap: spacing['2xl'],
  },
  aviso: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  alvo: {
    minHeight: 48,
    justifyContent: 'center',
  },
  atalhos: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  atalho: {
    flex: 1,
  },
});
