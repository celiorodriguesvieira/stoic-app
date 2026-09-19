import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  CabecalhoFilosofo,
  CardCotidiano,
  nivelInicial,
  PaginaDestino,
  SeletorDeNivel,
} from '@/components/explorar/Itens';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { nomesDosTemas } from '@/lib/admin/acervo';
import { observarConteudosPublicados } from '@/lib/admin/repositorio';
import { NIVEIS, ROTULO_NIVEL, type Conteudo, type Nivel } from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { fontFamily, spacing } from '@/theme';

/**
 * Página do filósofo (`420:87`, template `419:87`) — `/autores/:id`.
 *
 * "Explorar → Filósofo → Conceito no cotidiano" (`421:305`). Uma tela só para
 * todos: "carregar nome, retrato aprovado e conteúdos filtrados pelo
 * autorId… Não criar layouts individuais" (`468:985`).
 *
 * O nível troca o texto da introdução e é levado para a leitura. Sem versão
 * no nível escolhido, avisa em vez de mostrar outro nível calado.
 */
export default function AutorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, nivel: nivelDaRota } = useLocalSearchParams<{ id: string; nivel?: string }>();
  const { perfil } = useAuth();
  const { filosofos, carregando } = useFilosofos();

  const [nivel, setNivel] = useState<Nivel>(() =>
    nivelInicial(nivelDaRota, perfil?.preferencias?.nivel),
  );
  const [conteudos, setConteudos] = useState<Conteudo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(
    () =>
      observarConteudosPublicados(
        (lidos) => {
          setConteudos(lidos);
          setErro(null);
        },
        (falha) => setErro(falha.message),
      ),
    [tentativa],
  );

  const filosofo = filosofos.find((cada) => cada.id === id);
  const doAutor = useMemo(
    () => (conteudos ?? []).filter((conteudo) => conteudo.autorId === id),
    [conteudos, id],
  );

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/explorar'));

  if (carregando) {
    return (
      <PaginaDestino aoVoltar={voltar}>
        <ActivityIndicator
          color={colors.accent}
          style={styles.espera}
          accessibilityLabel="Carregando"
        />
      </PaginaDestino>
    );
  }

  if (!filosofo) {
    return (
      <PaginaDestino aoVoltar={voltar}>
        <Text variant="headingMedium">Autor indisponível.</Text>
      </PaginaDestino>
    );
  }

  const introducao = filosofo.introducoes[nivel];
  const outrosNiveis = NIVEIS.filter(
    (cada) => cada !== nivel && filosofo.introducoes[cada].texto.trim(),
  );

  return (
    <PaginaDestino aoVoltar={voltar}>
      <CabecalhoFilosofo
        nome={filosofo.nome}
        contexto={filosofo.subtitulo}
        apoio={filosofo.periodo}
        retratoId={filosofo.portraitAssetId}
        escuro
      />

      <SeletorDeNivel nivel={nivel} aoEscolher={setNivel} />

      {introducao.texto.trim() ? (
        <View style={styles.bloco}>
          {introducao.titulo ? (
            <Text variant="cardTitle" style={styles.titulo}>
              {introducao.titulo}
            </Text>
          ) : null}
          <Text>{introducao.texto}</Text>
        </View>
      ) : (
        // "Se não existir versão: avisar e oferecer outra disponível; nunca
        // trocar silenciosamente" (`468:985`). O seletor acima é a oferta.
        <View style={styles.bloco} accessibilityLiveRegion="polite">
          <Text>{`Ainda não há introdução na versão ${ROTULO_NIVEL[nivel]}.`}</Text>
          {outrosNiveis.length > 0 ? (
            <Text color="textSecondary">
              {`Disponível em: ${outrosNiveis.map((cada) => ROTULO_NIVEL[cada]).join(', ')}.`}
            </Text>
          ) : filosofo.biografia ? (
            <Text color="textSecondary">{filosofo.biografia}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.bloco}>
        <Text variant="cardTitle" style={styles.titulo}>
          Filosofia no cotidiano
        </Text>

        {erro ? (
          <>
            <Text color="error">{erro}</Text>
            <Button
              label="TENTAR NOVAMENTE"
              type="secondary"
              onPress={() => setTentativa((n) => n + 1)}
            />
          </>
        ) : conteudos === null ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.espera}
            accessibilityLabel="Carregando"
          />
        ) : doAutor.length === 0 ? (
          <Text color="textSecondary">Ainda não há conteúdos deste autor.</Text>
        ) : (
          <View style={styles.lista}>
            {doAutor.map((conteudo) => (
              <CardCotidiano
                key={conteudo.id}
                tema={conteudo.temaIds.length > 0 ? nomesDosTemas(conteudo.temaIds) : ''}
                titulo={conteudo.titulo}
                acao={`Ler com ${filosofo.nome}  →`}
                aoTocar={() =>
                  router.push(
                    conteudo.tipo === 'aula'
                      ? `/aula/${conteudo.id}`
                      : `/conteudos/${conteudo.id}?nivel=${nivel}`,
                  )
                }
              />
            ))}
          </View>
        )}
      </View>

      {introducao.texto.trim() && introducao.fonte ? (
        <Text variant="cardBody" color="textSecondary">
          {`Ponto de partida: ${introducao.fonte}`}
        </Text>
      ) : null}
    </PaginaDestino>
  );
}

const styles = StyleSheet.create({
  espera: {
    alignSelf: 'flex-start',
  },
  bloco: {
    gap: spacing.sm,
  },
  lista: {
    gap: spacing.lg,
  },
  // Inter semibold 20/24 (`419:105`, `419:115`).
  titulo: {
    fontFamily: fontFamily.bodyStrong,
  },
});
