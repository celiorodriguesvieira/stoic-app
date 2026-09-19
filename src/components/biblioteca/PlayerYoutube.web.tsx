import { createElement } from 'react';

import { enderecoDoPlayer } from '@/lib/admin/tipos';

import { ALTURA_PLAYER, PlayerIndisponivel } from './PlayerYoutubeComum';

/** Web: o `iframe` oficial do YouTube, sem reprodução automática (`668:156`). */
export function PlayerYoutube({ videoId, aoAbrir }: { videoId: string | null; aoAbrir: () => void }) {
  if (!videoId) return <PlayerIndisponivel aoAbrir={aoAbrir} />;

  return createElement('iframe', {
    src: enderecoDoPlayer(videoId),
    title: 'Player do YouTube',
    allow: 'encrypted-media; picture-in-picture; fullscreen',
    allowFullScreen: true,
    style: { width: '100%', height: ALTURA_PLAYER, border: 0 },
  });
}
