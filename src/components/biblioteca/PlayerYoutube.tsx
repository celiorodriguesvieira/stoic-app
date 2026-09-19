import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useTheme } from '@/hooks/use-theme';
import { enderecoDoPlayer } from '@/lib/admin/tipos';

import { ALTURA_PLAYER, PlayerIndisponivel } from './PlayerYoutubeComum';

/**
 * Página mínima com o `iframe` oficial.
 *
 * Carregar a URL do embed direto na WebView não serve: sem página de origem o
 * pedido sai sem `Referer`, e o YouTube recusa o player ("erro 153"). Montar o
 * `iframe` dentro de uma página com `baseUrl` dá a ele uma origem. Nada de
 * HTML vindo do cadastro entra aqui — só o `videoId`, validado na gravação.
 */
function pagina(videoId: string): string {
  const src = `${enderecoDoPlayer(videoId)}?playsinline=1`;

  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${src}" title="Player do YouTube" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}

/** Origem declarada para o `iframe`. Só identifica o app; nada é carregado dela. */
const ORIGEM = 'https://pausa.app';

/**
 * Aparelho: o player oficial numa WebView, tocando dentro do app.
 *
 * Se a incorporação falhar, volta a representação do Figma (`780:52`) que
 * abre no YouTube — "se a incorporação for bloqueada, permitir abrir no
 * YouTube" (`668:156`).
 */
export function PlayerYoutube({ videoId, aoAbrir }: { videoId: string | null; aoAbrir: () => void }) {
  const { colors } = useTheme();
  const [falhou, setFalhou] = useState(false);

  if (!videoId || falhou) return <PlayerIndisponivel aoAbrir={aoAbrir} invalido={!videoId} />;

  return (
    <View style={[styles.moldura, { backgroundColor: colors.accent }]}>
      <WebView
        source={{ html: pagina(videoId), baseUrl: ORIGEM }}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        scrollEnabled={false}
        onError={() => setFalhou(true)}
        onHttpError={() => setFalhou(true)}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  moldura: {
    height: ALTURA_PLAYER,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
