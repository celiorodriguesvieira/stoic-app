import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { CardConteudo, PaginaDestino, rotaDoConteudo } from '@/components/explorar/Itens';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoFilosofoEm, TEMAS } from '@/lib/admin/acervo';
import { observarConteudosPublicados } from '@/lib/admin/repositorio';
import type { Conteudo } from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';

/**
 * Página do tema (`466:698`) — `/temas/:id`, como pede o `468:985`.
 *
 * Lista os conteúdos publicados que têm o tema. O tema ainda não tem
 * descrição cadastrada (os seis vivem em `acervo.ts`), então a apresentação
 * do desenho fica de fora até o cadastro de temas existir.
 */
export default function TemaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { filosofos } = useFilosofos();

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

  const tema = TEMAS.find((cada) => cada.id === id);
  const doTema = useMemo(
    () => (conteudos ?? []).filter((conteudo) => conteudo.temaIds.includes(id)),
    [conteudos, id],
  );

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/explorar'));

  if (!tema) {
    return (
      <PaginaDestino aoVoltar={voltar}>
        <Text variant="headingMedium">Tema indisponível.</Text>
      </PaginaDestino>
    );
  }

  return (
    <PaginaDestino aoVoltar={voltar}>
      <Text variant="headingLarge" accessibilityRole="header">
        {tema.nome}
      </Text>

      {erro ? (
        // "Erro: preservar filtro e oferecer nova tentativa" (`468:985`).
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
      ) : doTema.length === 0 ? (
        // "Vazio: mensagem e Explorar outros temas" (`468:985`).
        <>
          <Text>Ainda não há conteúdos neste tema.</Text>
          <Button label="EXPLORAR OUTROS TEMAS" type="secondary" onPress={voltar} />
        </>
      ) : (
        <>
          <Text variant="cardBody">
            {doTema.length === 1
              ? '1 conteúdo nesta seleção'
              : `${doTema.length} conteúdos nesta seleção`}
          </Text>

          {doTema.map((conteudo) => (
            <CardConteudo
              key={conteudo.id}
              conteudo={conteudo}
              resumo={nomeDoFilosofoEm(filosofos, conteudo.autorId)}
              aoTocar={() => router.push(rotaDoConteudo(conteudo))}
            />
          ))}
        </>
      )}
    </PaginaDestino>
  );
}

const styles = StyleSheet.create({
  espera: {
    alignSelf: 'flex-start',
  },
});
