import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { NIVEIS, ROTULO_FORMATO, ROTULO_NIVEL, type Conteudo, type Nivel } from '@/lib/admin/tipos';
import { retratoDoAcervo } from '@/lib/retratos';
import { fontFamily, minTouchTarget, radius, spacing } from '@/theme';

/**
 * Peças do Explorar (`62:5`, `363:19`, `364:35`) e dos destinos (`466:495`).
 *
 * "Toda a linha é clicável" (`468:985`): cada item é um `Pressable` inteiro,
 * não um texto com link dentro.
 */

/** Busca sem acento e sem caixa, como na Biblioteca (`668:182`). */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim();
}

/** Ordem alfabética em português: "Ética" entre "Epicteto" e "Marco". */
export function porNome<T>(itens: readonly T[], nome: (item: T) => string): T[] {
  return [...itens].sort((a, b) => nome(a).localeCompare(nome(b), 'pt-BR'));
}

/** "LEITURA", "VÍDEO" ou "AULA" — o rótulo dourado das linhas (`364:114`). */
export function rotuloDoConteudo(conteudo: Conteudo): string {
  return (conteudo.tipo === 'aula' ? 'Aula' : ROTULO_FORMATO[conteudo.formato]).toLocaleUpperCase(
    'pt-BR',
  );
}

/** A aula tem leitor próprio, em quatro etapas; o artigo abre na leitura. */
export function rotaDoConteudo(conteudo: Conteudo): Href {
  return conteudo.tipo === 'aula' ? `/aula/${conteudo.id}` : `/conteudos/${conteudo.id}`;
}

/**
 * Nível inicial de uma página do Explorar: o que veio da tela anterior, senão
 * a preferência do onboarding, senão Leigo.
 *
 * "Iniciar na preferência do onboarding e conservar a escolha entre
 * apresentação e leitura" (`421:307`): a página do filósofo passa o nível
 * escolhido para a leitura pela rota (`?nivel=`).
 */
export function nivelInicial(
  daRota: string | undefined,
  doPerfil: string | null | undefined,
): Nivel {
  const valido = (valor: string | null | undefined): valor is Nivel =>
    (NIVEIS as readonly string[]).includes(valor ?? '');

  if (valido(daRota)) return daRota;
  if (valido(doPerfil)) return doPerfil;

  return 'leigo';
}

/** "NÍVEL DE LEITURA" com os quatro níveis lado a lado (`419:95`). */
export function SeletorDeNivel({
  nivel,
  aoEscolher,
}: {
  nivel: Nivel;
  aoEscolher: (nivel: Nivel) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.profundidade}>
      <Text variant="cardSupport" color="textSecondary">
        NÍVEL DE LEITURA
      </Text>

      <View style={[styles.seletor, { borderColor: colors.border }]} accessibilityRole="radiogroup">
        {NIVEIS.map((cada) => {
          const ativo = cada === nivel;

          return (
            <Pressable
              key={cada}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              onPress={() => aoEscolher(cada)}
              style={[styles.opcaoNivel, ativo && { backgroundColor: colors.canvas }]}>
              <Text variant="cardSupport">{ROTULO_NIVEL[cada]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Entrada "Filosofia no cotidiano" (`423:303`): tema, título e ação. "Todo o
 * card é clicável."
 */
export function CardCotidiano({
  tema,
  titulo,
  descricao,
  acao,
  aoTocar,
}: {
  tema: string;
  titulo: string;
  descricao?: string;
  acao: string;
  aoTocar: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${titulo}. ${acao.replace('→', '').trim()}`}
      onPress={aoTocar}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.canvas, borderColor: colors.border },
        pressed && styles.pressionado,
      ]}>
      {tema ? (
        <Text variant="cardSupport" color="textAccent">
          {tema.toLocaleUpperCase('pt-BR')}
        </Text>
      ) : null}
      <Text variant="cardTitle" style={styles.tituloCard}>
        {titulo}
      </Text>
      {descricao ? <Text color="textSecondary">{descricao}</Text> : null}
      <Text variant="cardHeading" color="textAccent">
        {acao}
      </Text>
    </Pressable>
  );
}

/** Busca em pílula de 44px (`360:30`). */
export function Busca({
  valor,
  aoMudar,
  placeholder,
}: {
  valor: string;
  aoMudar: (texto: string) => void;
  placeholder: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.busca, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="bodyLarge" color="textSecondary" accessibilityElementsHidden>
        ⌕
      </Text>
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={valor}
        onChangeText={aoMudar}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.entradaBusca, { color: colors.text }]}
      />
    </View>
  );
}

/** Rótulo de seção em dourado — "TEMAS EM ORDEM ALFABÉTICA" (`360:49`). */
export function Secao({ children }: { children: string }) {
  return (
    <Text variant="cardLabel" color="gold">
      {children}
    </Text>
  );
}

/** Linha de 44px: marcador dourado, nome e seta (`360:50`, `364:113`). */
export function Linha({
  marcador,
  nome,
  aoTocar,
}: {
  marcador: string;
  nome: string;
  aoTocar: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={nome}
      onPress={aoTocar}
      style={({ pressed }) => [
        styles.linha,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && styles.pressionado,
      ]}>
      <Text variant="cardLabel" color="gold" style={styles.marcador}>
        {marcador}
      </Text>
      <Text variant="supportSemibold" style={styles.nome} numberOfLines={1}>
        {nome}
      </Text>
      <Text variant="bodyLarge" color="textSecondary" accessibilityElementsHidden>
        ›
      </Text>
    </Pressable>
  );
}

/**
 * Card do acervo (`492:769`): formato, título, resumo e ação. Clicar abre o
 * conteúdo. "Sem retrato repetido": o retrato fica no cabeçalho do autor.
 */
export function CardConteudo({
  conteudo,
  resumo,
  aoTocar,
}: {
  conteudo: Conteudo;
  resumo: string;
  aoTocar: () => void;
}) {
  const { colors } = useTheme();
  const video = conteudo.tipo !== 'aula' && conteudo.formato === 'video';
  const duracao = conteudo.tipo === 'aula' ? `${conteudo.aula.duracaoMinutos} min` : '';

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${conteudo.titulo}. ${rotuloDoConteudo(conteudo)}`}
      onPress={aoTocar}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.canvas, borderColor: colors.border },
        pressed && styles.pressionado,
      ]}>
      <View style={styles.formato}>
        <Text variant="cardSupport" color="textAccent">
          {rotuloDoConteudo(conteudo)}
        </Text>
        {duracao ? (
          <Text variant="cardSupport" color="textAccent">
            {duracao}
          </Text>
        ) : null}
      </View>

      <Text variant="cardTitle" style={styles.tituloCard}>
        {conteudo.titulo}
      </Text>

      {resumo ? <Text color="textSecondary">{resumo}</Text> : null}

      <Text variant="cardHeading" color="textAccent">
        {video ? 'Assistir conteúdo →' : 'Ler conteúdo →'}
      </Text>
    </Pressable>
  );
}

/**
 * Cabeçalho de filósofo (`492:756`, `431:310`): nome, contexto e retrato
 * contido à direita. `escuro` é a variante do destaque em Explorar.
 */
export function CabecalhoFilosofo({
  nome,
  contexto,
  apoio,
  retratoId,
  escuro = false,
}: {
  nome: string;
  contexto: string;
  apoio?: string;
  retratoId: string | null;
  escuro?: boolean;
}) {
  const { colors } = useTheme();
  const retrato = retratoDoAcervo(retratoId);

  return (
    <View style={[styles.filosofo, { backgroundColor: escuro ? colors.accent : 'transparent' }]}>
      {retrato ? (
        <Image
          source={retrato.arquivo}
          style={styles.retrato}
          contentFit="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}

      <View style={styles.identificacao}>
        <Text variant="cardTitle" color={escuro ? 'gold' : 'text'} style={styles.nomeFilosofo}>
          {nome.toLocaleUpperCase('pt-BR')}
        </Text>
        {contexto ? (
          <Text variant="cardBody" color={escuro ? 'textOnAccent' : 'text'}>
            {contexto.toLocaleUpperCase('pt-BR')}
          </Text>
        ) : null}
        {apoio ? (
          <Text
            variant="cardBody"
            color={escuro ? 'textOnAccent' : 'text'}
            style={styles.apoioFilosofo}>
            {apoio.toLocaleUpperCase('pt-BR')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Moldura das páginas de destino (`466:495`): rolagem vertical, margens de
 * 24 e "← Explorar" no topo. Fora das abas, como o detalhe da Biblioteca.
 */
export function PaginaDestino({
  aoVoltar,
  rotuloVoltar = '← Explorar',
  children,
}: {
  aoVoltar: () => void;
  rotuloVoltar?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.area, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.pagina} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rotuloVoltar.replace('← ', 'Voltar para ')}
          onPress={aoVoltar}
          style={styles.voltar}>
          <Text>{rotuloVoltar}</Text>
        </Pressable>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// Medidas do `62:5`/`364:35`: busca 44 com raio 22, linhas 44 com raio 10,
// card do acervo com raio 16 e padding 24, cabeçalho do filósofo 160.
const styles = StyleSheet.create({
  busca: {
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  entradaBusca: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  linha: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  marcador: {
    width: 50,
  },
  nome: {
    flex: 1,
  },
  pressionado: {
    opacity: 0.6,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  formato: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tituloCard: {
    fontFamily: fontFamily.bodyStrong,
  },
  filosofo: {
    minHeight: 160,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  retrato: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '44%',
    height: 152,
  },
  identificacao: {
    width: '52%',
    paddingLeft: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  nomeFilosofo: {
    fontFamily: fontFamily.bodyStrong,
  },
  apoioFilosofo: {
    opacity: 0.78,
  },
  profundidade: {
    gap: spacing.sm,
  },
  seletor: {
    height: 44,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  opcaoNivel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  area: {
    flex: 1,
  },
  pagina: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  voltar: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
