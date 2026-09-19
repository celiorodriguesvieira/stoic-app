import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Busca,
  Linha,
  normalizar,
  porNome,
  rotaDoConteudo,
  rotuloDoConteudo,
  Secao,
} from '@/components/explorar/Itens';
import { CabecalhoApp } from '@/components/ui/CabecalhoApp';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { TEMAS } from '@/lib/admin/acervo';
import { observarConteudosPublicados } from '@/lib/admin/repositorio';
import type { Conteudo, Filosofo, Tema } from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { radius, spacing } from '@/theme';

type Aba = 'temas' | 'autores' | 'conteudos';

const ABAS: { id: Aba; rotulo: string; busca: string }[] = [
  { id: 'temas', rotulo: 'TEMAS', busca: 'Buscar temas' },
  { id: 'autores', rotulo: 'AUTORES', busca: 'Buscar autores' },
  { id: 'conteudos', rotulo: 'CONTEÚDOS', busca: 'Buscar conteúdos' },
];

/** Primeira letra, maiúscula e com acento — o "É" de "Ética" (`360:61`). */
function inicial(nome: string): string {
  return nome.trim().charAt(0).toLocaleUpperCase('pt-BR');
}

/**
 * Explorar (`62:5`, `363:19`, `364:35`).
 *
 * "Temas e autores: ordem alfabética • Conteúdos: mais recentes" (`668:204`).
 * Os destaques e "Mais acessados" dependem da curadoria e de medição, que
 * ainda não existem; o contrato manda ocultar sem medição, e é o que se faz.
 *
 * A busca é por aba: trocar de aba mantém o que foi digitado em cada uma.
 */
export default function ExplorarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { filosofos, carregando: carregandoFilosofos, erro: erroFilosofos } = useFilosofos();

  const [aba, setAba] = useState<Aba>('temas');
  const [buscas, setBuscas] = useState<Record<Aba, string>>({
    temas: '',
    autores: '',
    conteudos: '',
  });
  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [erroConteudos, setErroConteudos] = useState<string | null>(null);

  useEffect(
    () =>
      observarConteudosPublicados(
        (lidos) => {
          setConteudos(lidos);
          setErroConteudos(null);
        },
        (falha) => setErroConteudos(falha.message),
      ),
    [],
  );

  const termo = normalizar(buscas[aba]);

  const temas = useMemo(
    () =>
      porNome(TEMAS, (tema) => tema.nome).filter(
        (tema) => !termo || normalizar(tema.nome).includes(termo),
      ),
    [termo],
  );

  const autores = useMemo(
    () =>
      porNome(filosofos, (filosofo) => filosofo.nome).filter(
        (filosofo) => !termo || normalizar(filosofo.nome).includes(termo),
      ),
    [filosofos, termo],
  );

  const lista = useMemo(
    () =>
      (conteudos ?? []).filter((conteudo) => !termo || normalizar(conteudo.titulo).includes(termo)),
    [conteudos, termo],
  );

  const atual = ABAS.find((cada) => cada.id === aba)!;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <CabecalhoApp titulo="EXPLORE MAIS IDEIAS" />

        <View style={[styles.abas, { borderColor: colors.border }]} accessibilityRole="tablist">
          {ABAS.map((cada) => {
            const ativa = cada.id === aba;

            return (
              <Pressable
                key={cada.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                onPress={() => setAba(cada.id)}
                style={[styles.aba, ativa && { backgroundColor: colors.gold }]}>
                <Text variant="cardLabel" color={ativa ? 'textOnAccent' : 'text'}>
                  {cada.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Busca
          valor={buscas[aba]}
          aoMudar={(texto) => setBuscas((atuais) => ({ ...atuais, [aba]: texto }))}
          placeholder={atual.busca}
        />

        <View style={styles.lista}>
          {aba === 'temas' ? (
            <ListaDeTemas temas={temas} aoAbrir={(id) => router.push(`/temas/${id}`)} />
          ) : aba === 'autores' ? (
            <ListaDeAutores
              autores={autores}
              carregando={carregandoFilosofos}
              erro={erroFilosofos}
              aoAbrir={(id) => router.push(`/autores/${id}`)}
            />
          ) : (
            <ListaDeConteudos
              conteudos={conteudos === null ? null : lista}
              buscando={!!termo}
              erro={erroConteudos}
              aoAbrir={(conteudo) => router.push(rotaDoConteudo(conteudo))}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** Aba Temas (`62:5`): os temas em ordem alfabética. */
function ListaDeTemas({
  temas,
  aoAbrir,
}: {
  temas: readonly Tema[];
  aoAbrir: (id: string) => void;
}) {
  return (
    <>
      <Secao>TEMAS EM ORDEM ALFABÉTICA</Secao>
      {temas.length === 0 ? (
        <Text color="textSecondary">Nenhum tema encontrado.</Text>
      ) : (
        temas.map((tema) => (
          <Linha
            key={tema.id}
            marcador={inicial(tema.nome)}
            nome={tema.nome}
            aoTocar={() => aoAbrir(tema.id)}
          />
        ))
      )}
    </>
  );
}

/** Aba Autores (`363:19`): os filósofos cadastrados em ordem alfabética. */
function ListaDeAutores({
  autores,
  carregando,
  erro,
  aoAbrir,
}: {
  autores: readonly Filosofo[];
  carregando: boolean;
  erro: string | null;
  aoAbrir: (id: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <>
      <Secao>AUTORES EM ORDEM ALFABÉTICA</Secao>
      {erro ? (
        <Text color="error">{erro}</Text>
      ) : carregando ? (
        <ActivityIndicator color={colors.accent} style={styles.espera} />
      ) : autores.length === 0 ? (
        <Text color="textSecondary">Nenhum autor encontrado.</Text>
      ) : (
        autores.map((filosofo) => (
          <Linha
            key={filosofo.id}
            marcador={inicial(filosofo.nome)}
            nome={filosofo.nome}
            aoTocar={() => aoAbrir(filosofo.id)}
          />
        ))
      )}
    </>
  );
}

/** Aba Conteúdos (`364:35`): os publicados, do mais recente. `null` = carregando. */
function ListaDeConteudos({
  conteudos,
  buscando,
  erro,
  aoAbrir,
}: {
  conteudos: readonly Conteudo[] | null;
  buscando: boolean;
  erro: string | null;
  aoAbrir: (conteudo: Conteudo) => void;
}) {
  const { colors } = useTheme();

  return (
    <>
      <Secao>TODOS OS CONTEÚDOS</Secao>
      {erro ? (
        <Text color="error">{erro}</Text>
      ) : conteudos === null ? (
        <ActivityIndicator color={colors.accent} style={styles.espera} />
      ) : conteudos.length === 0 ? (
        <Text color="textSecondary">
          {buscando ? 'Nenhum conteúdo encontrado.' : 'Nenhum conteúdo disponível ainda.'}
        </Text>
      ) : (
        conteudos.map((conteudo) => (
          <Linha
            key={conteudo.id}
            marcador={rotuloDoConteudo(conteudo)}
            nome={conteudo.titulo}
            aoTocar={() => aoAbrir(conteudo)}
          />
        ))
      )}
    </>
  );
}

// Medidas do `62:5`: abas 342×40 com raio 10, linhas a cada 52px.
const styles = StyleSheet.create({
  conteudo: {
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  abas: {
    height: 40,
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md + 1,
  },
  lista: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  espera: {
    alignSelf: 'flex-start',
  },
});
