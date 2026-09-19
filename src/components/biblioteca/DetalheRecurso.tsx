import * as WebBrowser from 'expo-web-browser';
import { Linking, StyleSheet, View } from 'react-native';

import { PlayerYoutube } from '@/components/biblioteca/PlayerYoutube';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { RecursoBiblioteca } from '@/lib/admin/tipos';
import { fontFamily, spacing } from '@/theme';

/**
 * Corpo do detalhe da Biblioteca (`67:6`): rótulo do tipo, título, criador,
 * player, "Por que recomendamos" e o botão para fora do app.
 *
 * É o mesmo componente na tela do app e na prévia do painel — o contrato pede
 * que "a prévia use o mesmo player" (`668:156`), e duas cópias acabariam
 * mostrando coisas diferentes.
 */
export function DetalheRecurso({ recurso }: { recurso: RecursoBiblioteca }) {
  const video = recurso.tipo === 'video';

  /**
   * Abre a loja ou o YouTube num navegador por cima do app, não fora dele: ao
   * fechar, a pessoa está de volta no detalhe, em vez de depender do "◀ PAUSA"
   * do iOS. O link vai inteiro, com o código de afiliado. Se o navegador
   * interno falhar, cai no navegador do sistema.
   */
  const abrir = () => {
    if (!recurso.url) return;

    WebBrowser.openBrowserAsync(recurso.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: 'close',
    }).catch(() => Linking.openURL(recurso.url).catch(() => {}));
  };

  const linhaDoCriador = [recurso.criador, recurso.edicao]
    .filter((parte) => parte.trim())
    .join('  ·  ')
    .toLocaleUpperCase('pt-BR');

  return (
    <View style={styles.corpo}>
      <Text variant="cardLabel" color="textAccent">
        {video ? 'VÍDEO NO YOUTUBE' : 'LIVRO'}
      </Text>

      <Text variant="headingLarge" style={styles.titulo} accessibilityRole="header">
        {(recurso.titulo || 'Sem título').toLocaleUpperCase('pt-BR')}
      </Text>

      {linhaDoCriador ? (
        <Text variant="labelMetadata" color="textSecondary">
          {linhaDoCriador}
        </Text>
      ) : null}

      {video ? (
        <View style={styles.player}>
          <PlayerYoutube videoId={recurso.videoId} aoAbrir={abrir} />
        </View>
      ) : null}

      <Text variant="cardLabel" color="textAccent" style={styles.rotuloRecomendacao}>
        POR QUE RECOMENDAMOS
      </Text>

      <Text style={styles.recomendacao} color={recurso.recomendacao ? 'text' : 'textSecondary'}>
        {recurso.recomendacao || 'Sem recomendação ainda.'}
      </Text>

      {/* "Se Link de afiliado = Sim, mostrar o aviso de comissão antes do botão" (`779:177`). */}
      {!video && recurso.afiliado ? (
        <Text variant="bodySmall" color="textSecondary">
          Link de afiliado: o PAUSA pode receber comissão por compras feitas por ele.
        </Text>
      ) : null}

      <Button
        label={video ? 'ABRIR NO YOUTUBE' : 'ABRIR NA LOJA'}
        disabled={!recurso.url}
        onPress={abrir}
        style={styles.botao}
      />

      {video ? (
        <Text style={styles.recomendacao}>Se o vídeo não carregar aqui, abra no YouTube.</Text>
      ) : null}
    </View>
  );
}

// Medidas do `67:6`: título 28/34, texto 15/23.
const styles = StyleSheet.create({
  corpo: {
    gap: spacing.lg,
  },
  titulo: {
    lineHeight: 34,
  },
  rotuloRecomendacao: {
    marginTop: spacing.sm,
  },
  recomendacao: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 23,
  },
  player: {
    marginTop: spacing.lg,
  },
  botao: {
    marginTop: spacing['2xl'],
  },
});
