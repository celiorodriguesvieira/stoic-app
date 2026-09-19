import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CabecalhoApp } from '@/components/ui/CabecalhoApp';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { observarRecursosPublicados } from '@/lib/admin/repositorio';
import type { RecursoBiblioteca, TipoRecurso } from '@/lib/admin/tipos';
import { fontFamily, spacing } from '@/theme';

const FILTROS: { id: TipoRecurso | 'todos'; rotulo: string }[] = [
  { id: 'todos', rotulo: 'TODOS' },
  { id: 'video', rotulo: 'VÍDEOS' },
  { id: 'livro', rotulo: 'LIVROS' },
];

/**
 * Busca sem acento e sem caixa — "termo normalizado sem acentos" (`668:182`).
 * Assim "meditacoes" encontra "Meditações".
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

/** Linha de apoio do item: "Vídeo de Fulano" / "Livro de Marco Aurélio" (`67:29`, `67:32`). */
function apoioDoItem(recurso: RecursoBiblioteca): string {
  const tipo = recurso.tipo === 'video' ? 'Vídeo' : 'Livro';

  return recurso.criador ? `${tipo} de ${recurso.criador}` : tipo;
}

/**
 * Biblioteca / Início (`67:5`).
 *
 * Só recursos publicados, com busca por título e os filtros Todos, Vídeos e
 * Livros; filtros combinam com a busca (`668:156`). Rascunho e arquivado nunca
 * chegam aqui — a consulta pede só `publicado`, e as regras garantem.
 */
export default function BibliotecaScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [recursos, setRecursos] = useState<RecursoBiblioteca[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<TipoRecurso | 'todos'>('todos');

  useEffect(
    () =>
      observarRecursosPublicados(
        (lidos) => {
          setRecursos(lidos);
          setErro(null);
        },
        (falha) => setErro(falha.message),
      ),
    [],
  );

  const visiveis = useMemo(() => {
    const termo = normalizar(busca);

    return (recursos ?? []).filter(
      (recurso) =>
        (filtro === 'todos' || recurso.tipo === filtro) &&
        (!termo || normalizar(recurso.titulo).includes(termo)),
    );
  }, [recursos, busca, filtro]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <CabecalhoApp titulo="BIBLIOTECA" />

        <View style={[styles.busca, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text variant="bodyLarge" color="textSecondary" accessibilityElementsHidden>
            ⌕
          </Text>
          <TextInput
            accessibilityLabel="Buscar por título"
            placeholder="Buscar por título"
            placeholderTextColor={colors.textSecondary}
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.entradaBusca, { color: colors.text }]}
          />
        </View>

        <View style={styles.filtros} accessibilityRole="radiogroup">
          {FILTROS.map((cada) => {
            const ativo = cada.id === filtro;

            return (
              <Pressable
                key={cada.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: ativo }}
                accessibilityLabel={cada.rotulo}
                onPress={() => setFiltro(cada.id)}
                // Alvo de 48px em volta da pílula de 34 (`649:987`, item 06).
                style={styles.alvoFiltro}>
                <View
                  style={[
                    styles.filtro,
                    ativo
                      ? { backgroundColor: colors.gold, borderColor: colors.gold }
                      : { borderColor: colors.border },
                  ]}>
                  <Text variant="cardLabel">{cada.rotulo}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text variant="cardLabel" color="textAccent">
          CONTEÚDOS DISPONÍVEIS
        </Text>

        {erro ? (
          <Text color="error" accessibilityLiveRegion="polite">
            {erro}
          </Text>
        ) : recursos === null ? (
          <ActivityIndicator color={colors.accent} style={styles.espera} />
        ) : visiveis.length === 0 ? (
          <Text color="textSecondary">
            {busca || filtro !== 'todos'
              ? 'Nenhum conteúdo encontrado.'
              : 'Nenhum conteúdo disponível ainda.'}
          </Text>
        ) : (
          <View style={styles.lista}>
            {visiveis.map((recurso) => (
              <Pressable
                key={recurso.id}
                accessibilityRole="link"
                accessibilityLabel={`${recurso.titulo}. ${apoioDoItem(recurso)}`}
                onPress={() => router.push(`/recurso/${recurso.id}`)}
                style={({ pressed }) => [styles.item, pressed && styles.pressionado]}>
                <Text variant="cardHeading">{recurso.titulo}</Text>
                <Text variant="citationSource" color="textSecondary">
                  {apoioDoItem(recurso)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// Medidas do `67:5`: busca 48 com raio 24, pílulas de 34 com raio 17.
const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing['2xl'],
  },
  busca: {
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    gap: spacing.md,
  },
  entradaBusca: {
    flex: 1,
    height: '100%',
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    marginVertical: -7,
  },
  alvoFiltro: {
    minHeight: 48,
    justifyContent: 'center',
  },
  filtro: {
    height: 34,
    minWidth: 70,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  espera: {
    alignSelf: 'flex-start',
  },
  lista: {
    gap: spacing.lg,
  },
  item: {
    minHeight: 48,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pressionado: {
    opacity: 0.6,
  },
});
