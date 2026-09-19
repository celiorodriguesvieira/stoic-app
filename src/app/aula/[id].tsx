import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Opcao } from '@/components/atividades/TelaAtividade';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoFilosofoEm } from '@/lib/admin/acervo';
import { observarConteudo } from '@/lib/admin/repositorio';
import { NIVEIS, type Conteudo, type Nivel } from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { retratoDoAcervo } from '@/lib/retratos';
import { radius, spacing } from '@/theme';

const ETAPAS = 4;

/** O nível escolhido no onboarding; sem escolha, o de entrada. */
function nivelDaPessoa(nivel: string | null | undefined): Nivel {
  return (NIVEIS as readonly string[]).includes(nivel ?? '') ? (nivel as Nivel) : 'leigo';
}

/**
 * Conhecimento da semana — as quatro etapas da aula (`61:6` a `61:9`).
 *
 * Mostra a versão do nível da pessoa: é para isso que a aula tem quatro. Os
 * textos fixos de cada etapa ("Pare e observe", "Uma pequena prática para
 * hoje", "Pausa concluída") são do Figma; o resto vem do cadastro.
 *
 * Tela de detalhe, com Voltar e sem o menu da conta (item 14 do `649:987`).
 * A escolha da reflexão não é gravada: "a reflexão não atribui nota", e não
 * existe ainda onde guardar o progresso da pessoa.
 */
export default function AulaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfil } = useAuth();
  const { filosofos } = useFilosofos();

  const [aula, setAula] = useState<Conteudo | null | undefined>(undefined);
  const [etapa, setEtapa] = useState(1);
  const [escolha, setEscolha] = useState<string | null>(null);

  useEffect(
    () =>
      observarConteudo(
        id,
        (lido) => setAula(lido && lido.status === 'publicado' && lido.tipo === 'aula' ? lido : null),
        () => setAula(null),
      ),
    [id],
  );

  const sair = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const voltar = () => (etapa > 1 ? setEtapa(etapa - 1) : sair());

  if (aula === undefined || aula === null) {
    return (
      <Moldura>
        {aula === undefined ? (
          <ActivityIndicator color={colors.accent} style={styles.espera} />
        ) : (
          <View style={styles.indisponivel} accessibilityLiveRegion="polite">
            <Text variant="headingMedium">Conteúdo indisponível.</Text>
            <Button label="VOLTAR PARA HOJE" onPress={sair} />
          </View>
        )}
      </Moldura>
    );
  }

  const conteudo = aula.aula.etapas[nivelDaPessoa(perfil?.preferencias?.nivel)];
  const filosofo = filosofos.find((cada) => cada.id === aula.autorId);
  const autor = nomeDoFilosofoEm(filosofos, aula.autorId);
  const atividadeId = aula.aula.atividadeId;

  if (etapa === ETAPAS) {
    return (
      <Moldura>
        <View style={styles.conclusao}>
          <Image
            source={require('@/assets/images/ilustracoes/moeda-romana.png')}
            style={styles.moeda}
            contentFit="contain"
            accessible={false}
          />

          <Text variant="headingLarge" accessibilityRole="header" style={styles.centro}>
            PAUSA CONCLUÍDA
          </Text>

          <Text color="textSecondary" style={styles.centro}>
            {conteudo.sintese}
          </Text>

          <View style={[styles.leve, { backgroundColor: colors.selected, borderColor: colors.border }]}>
            <Text variant="optionLabel" color="textAccent">
              LEVE COM VOCÊ
            </Text>
            <Text variant="cardHeading">{conteudo.leveComVoce}</Text>
          </View>
        </View>

        <Rodape>
          <Button label="VOLTAR PARA HOJE" onPress={() => router.replace('/')} />
        </Rodape>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <View style={styles.topo}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={voltar}
          style={styles.voltar}>
          <Image
            source={require('@/assets/images/icones/voltar.svg')}
            style={styles.icone}
            tintColor={colors.text}
            accessible={false}
          />
        </Pressable>

        <Text variant="cardLabel" color="textAccent">
          {`0${etapa} DE 0${ETAPAS}`}
        </Text>
      </View>

      {etapa === 1 ? (
        <>
          <Cabecalho titulo={aula.titulo} apoio={conteudo.introducao} />

          <CardCitacao
            frase={aula.aula.fraseDestaque}
            citacao={conteudo.modoFonte === 'citacao'}
            autor={autor}
            fonte={conteudo.fonte}
            retratoId={filosofo?.portraitAssetId ?? null}
          />

          <Text variant="bodyMedium">{conteudo.explicacao}</Text>

          <Text variant="cardLabel" color="textAccent">
            {`LEITURA  ·  ${aula.aula.duracaoMinutos} MIN`}
          </Text>

          <Rodape>
            <Button label="LEVAR PARA O COTIDIANO" onPress={() => setEtapa(2)} />
          </Rodape>
        </>
      ) : etapa === 2 ? (
        <>
          <Cabecalho
            titulo="PARE E OBSERVE"
            apoio="Pense em uma situação que esteja ocupando sua mente agora."
          />

          <Text variant="cardHeading" style={styles.pergunta}>
            {conteudo.pergunta}
          </Text>

          <View style={styles.opcoes} accessibilityRole="radiogroup">
            {conteudo.opcoes
              .filter((opcao) => opcao.texto.trim())
              .map((opcao) => (
                <Opcao
                  key={opcao.id}
                  texto={opcao.texto}
                  marcada={escolha === opcao.id}
                  altura={48}
                  aoTocar={() => setEscolha(opcao.id)}
                />
              ))}
          </View>

          <Text variant="bodySmall" color="textSecondary">
            Não existe resposta perfeita. O objetivo é perceber onde sua ação começa.
          </Text>

          <Rodape>
            <Button label="CONTINUAR" disabled={!escolha} onPress={() => setEtapa(3)} />
          </Rodape>
        </>
      ) : (
        <>
          <Cabecalho
            titulo="UMA PEQUENA PRÁTICA PARA HOJE"
            apoio="Transforme a reflexão em uma atitude possível."
          />

          <View style={[styles.pratica, { backgroundColor: colors.canvas, borderColor: colors.border }]}>
            <Image
              source={require('@/assets/images/ilustracoes/ampulheta.png')}
              style={styles.ampulheta}
              contentFit="contain"
              accessible={false}
            />

            <View style={styles.textoPratica}>
              <Text variant="optionLabel" color="textAccent">
                REFLITA
              </Text>
              <Text variant="cardHeading">{conteudo.pratica}</Text>
            </View>
          </View>

          <Rodape>
            {/* "O botão “Atividade da semana” abre o exercício vinculado" (`668:202`). */}
            {atividadeId ? (
              <Button
                label="ATIVIDADE DA SEMANA"
                type="secondary"
                onPress={() => router.push(`/atividade/${atividadeId}`)}
              />
            ) : null}
            <Button label="ASSUMIR ESTE COMPROMISSO" onPress={() => setEtapa(4)} />
          </Rodape>
        </>
      )}
    </Moldura>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.area, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Cabecalho({ titulo, apoio }: { titulo: string; apoio: string }) {
  return (
    <View style={styles.cabecalho}>
      <Text variant="headingLarge" accessibilityRole="header">
        {titulo.toLocaleUpperCase('pt-BR')}
      </Text>
      {apoio ? (
        <Text variant="bodySmall" color="textSecondary">
          {apoio}
        </Text>
      ) : null}
    </View>
  );
}

function Rodape({ children }: { children: ReactNode }) {
  return <View style={styles.rodape}>{children}</View>;
}

/**
 * Card da etapa 1 (`223:13`): frase, autor, obra e retrato.
 *
 * Aspas só em citação conferida — "não atribuir frase editorial como citação
 * literal" (`668:128`). Em adaptação da PAUSA, a frase vai sem aspas.
 */
function CardCitacao({
  frase,
  citacao,
  autor,
  fonte,
  retratoId,
}: {
  frase: string;
  citacao: boolean;
  autor: string;
  fonte: string;
  retratoId: string | null;
}) {
  const { colors } = useTheme();
  const retrato = retratoDoAcervo(retratoId);

  return (
    <View style={[styles.card, { backgroundColor: colors.accent }]}>
      {retrato ? (
        <Image
          source={retrato.arquivo}
          style={styles.retrato}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}

      <Text variant="cardQuote" color="textOnAccent" style={styles.frase}>
        {citacao ? `“${frase}”` : frase}
      </Text>

      <View style={styles.autoria}>
        <Text variant="labelMetadata" color="gold">
          {autor}
        </Text>
        {fonte ? (
          <Text variant="citationSource" color="gold" style={styles.obra} numberOfLines={2}>
            {fonte}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// Medidas do `61:6`–`61:9`: card 342×173 com raio 18, ampulheta 151, moeda 168.
const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing['2xl'],
  },
  espera: {
    marginTop: spacing['3xl'],
  },
  indisponivel: {
    gap: spacing['2xl'],
    marginTop: spacing['3xl'],
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voltar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  icone: {
    width: 24,
    height: 24,
  },
  cabecalho: {
    gap: spacing.sm,
  },
  card: {
    minHeight: 173,
    borderRadius: 18,
    overflow: 'hidden',
    padding: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  frase: {
    width: '70%',
  },
  autoria: {
    width: '45%',
    gap: 2,
  },
  obra: {
    opacity: 0.78,
  },
  retrato: {
    position: 'absolute',
    right: -16,
    bottom: -2,
    width: 215,
    height: 155,
  },
  // Inter semibold 22/30 (`61:25`) — não há variante com essa medida.
  pergunta: {
    fontSize: 22,
    lineHeight: 30,
  },
  opcoes: {
    gap: spacing.md,
  },
  pratica: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    gap: spacing['3xl'],
    alignItems: 'center',
  },
  ampulheta: {
    width: 151,
    height: 151,
  },
  textoPratica: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  conclusao: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['2xl'],
  },
  moeda: {
    width: 168,
    height: 168,
  },
  centro: {
    textAlign: 'center',
  },
  leve: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  rodape: {
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
    gap: spacing.lg,
  },
});
