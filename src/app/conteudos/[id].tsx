import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { nivelInicial, PaginaDestino, SeletorDeNivel } from '@/components/explorar/Itens';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { nomeDoFilosofoEm, nomesDosTemas } from '@/lib/admin/acervo';
import { observarConteudo } from '@/lib/admin/repositorio';
import {
  aplicacaoVinculada,
  NIVEIS,
  ROTULO_NIVEL,
  type Conteudo,
  type Nivel,
} from '@/lib/admin/tipos';
import { useFilosofos } from '@/lib/admin/use-filosofos';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/** Parágrafos separados por linha em branco — a "leitura integrada" do `419:343`. */
function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((trecho) => trecho.trim())
    .filter(Boolean);
}

/**
 * Leitura — "Filosofia no cotidiano" (`420:118`, template `419:88`),
 * `/conteudos/:id`.
 *
 * Abre no nível que veio da página do filósofo (`?nivel=`) ou, sem ele, no do
 * onboarding. "Se não existir versão: avisar e oferecer outra disponível;
 * nunca trocar silenciosamente" (`468:985`): o seletor é a oferta.
 *
 * Aula não abre aqui: tem leitor próprio de quatro etapas (`/aula/:id`), e
 * quem chega por link antigo é mandado para lá.
 */
export default function ConteudoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, nivel: nivelDaRota } = useLocalSearchParams<{ id: string; nivel?: string }>();
  const { perfil } = useAuth();
  const { filosofos } = useFilosofos();

  const [conteudo, setConteudo] = useState<Conteudo | null | undefined>(undefined);
  const [nivel, setNivel] = useState<Nivel>(() =>
    nivelInicial(nivelDaRota, perfil?.preferencias?.nivel),
  );

  useEffect(
    () =>
      observarConteudo(
        id,
        (lido) => setConteudo(lido && lido.status === 'publicado' ? lido : null),
        () => setConteudo(null),
      ),
    [id],
  );

  useEffect(() => {
    if (conteudo?.tipo === 'aula') router.replace(`/aula/${conteudo.id}`);
  }, [conteudo, router]);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/explorar'));

  if (conteudo === undefined || conteudo?.tipo === 'aula') {
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

  if (conteudo === null) {
    return (
      <PaginaDestino aoVoltar={voltar}>
        <Text variant="headingMedium">Conteúdo indisponível.</Text>
        <Button label="VOLTAR À SELEÇÃO" type="secondary" onPress={voltar} />
      </PaginaDestino>
    );
  }

  const autor = nomeDoFilosofoEm(filosofos, conteudo.autorId);
  const temas = conteudo.temaIds.length > 0 ? nomesDosTemas(conteudo.temaIds) : '';
  const texto = conteudo.textos[nivel].trim();
  const outrosNiveis = NIVEIS.filter((cada) => cada !== nivel && conteudo.textos[cada].trim());
  const aplicacao = conteudo.aplicacao.textos[nivel].trim();

  // "← Sêneca" (`419:123`): a leitura volta para o filósofo.
  const aoFilosofo = () => router.replace(`/autores/${conteudo.autorId}?nivel=${nivel}`);

  return (
    <PaginaDestino aoVoltar={voltar} rotuloVoltar={`← ${autor}`}>
      <View style={styles.cabecalho}>
        <Text variant="cardSupport" color="textAccent">
          FILOSOFIA NO COTIDIANO
        </Text>
        <Text variant="headingLarge" accessibilityRole="header">
          {conteudo.titulo.toLocaleUpperCase('pt-BR')}
        </Text>
        <Text variant="cardSupport" color="textSecondary">
          {[autor, temas].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <SeletorDeNivel nivel={nivel} aoEscolher={setNivel} />

      {texto ? (
        <View style={styles.leitura}>
          {paragrafos(texto).map((trecho, indice) => (
            <Text key={indice}>{trecho}</Text>
          ))}

          {aplicacaoVinculada(conteudo.aplicacao) && aplicacao ? (
            <View style={styles.aplicacao}>
              <Text variant="cardSupport" color="textAccent">
                {conteudo.aplicacao.titulo.toLocaleUpperCase('pt-BR')}
              </Text>
              {paragrafos(aplicacao).map((trecho, indice) => (
                <Text key={indice}>{trecho}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.aplicacao} accessibilityLiveRegion="polite">
          <Text>{`Este conteúdo ainda não tem versão ${ROTULO_NIVEL[nivel]}.`}</Text>
          {outrosNiveis.length > 0 ? (
            <Text color="textSecondary">
              {`Disponível em: ${outrosNiveis.map((cada) => ROTULO_NIVEL[cada]).join(', ')}.`}
            </Text>
          ) : null}
        </View>
      )}

      {conteudo.fonte ? (
        <Text variant="cardSupport" color="textSecondary">
          {`${autor} · ${conteudo.fonte}`}
        </Text>
      ) : null}

      <Button label="VOLTAR AO FILÓSOFO" type="secondary" onPress={aoFilosofo} />
    </PaginaDestino>
  );
}

const styles = StyleSheet.create({
  espera: {
    alignSelf: 'flex-start',
  },
  cabecalho: {
    gap: spacing.sm,
  },
  leitura: {
    gap: spacing.lg,
  },
  aplicacao: {
    gap: spacing.sm,
  },
});
