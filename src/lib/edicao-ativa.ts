import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import {
  agoraEditorial,
  observarConteudo,
  observarEdicoes,
} from '@/lib/admin/repositorio';
import type { Conteudo, EdicaoSemanal } from '@/lib/admin/tipos';

export type EdicaoAtiva = { edicao: EdicaoSemanal; aula: Conteudo };

/**
 * A edição em cartaz agora.
 *
 * "Uma única edição ativa por vez" e "sem edição ativa: ocultar destaque e
 * oferecer Explorar; não reaproveitar semana vencida sem aviso" (contrato
 * `668:135`). Daí devolver `null` — e não a última edição — quando o período
 * corrente não pertence a ninguém.
 */
function ativaEm(edicoes: readonly EdicaoSemanal[], agora: string): EdicaoSemanal | null {
  // Início inclusivo, fim exclusivo: às 00:00 do término a edição já saiu.
  return edicoes.find((edicao) => edicao.inicio <= agora && agora < edicao.fim) ?? null;
}

export function useEdicaoAtiva(): {
  ativa: EdicaoAtiva | null;
  carregando: boolean;
  erro: string | null;
} {
  const [edicoes, setEdicoes] = useState<EdicaoSemanal[] | null>(null);
  /**
   * A aula lida, junto do id que foi pedido.
   *
   * O id anda com o conteúdo de propósito: sem ele, trocar de edição deixaria
   * na tela a aula da edição anterior até a leitura nova voltar — e limpar por
   * efeito faria a Home renderizar duas vezes a cada troca.
   */
  const [lida, setLida] = useState<{ conteudoId: string; conteudo: Conteudo | null } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(agoraEditorial);

  useEffect(
    () =>
      observarEdicoes(setEdicoes, (falha) => {
        setEdicoes([]);
        setErro(falha.message);
      }),
    [],
  );

  /**
   * O relógio só avança quando o app volta ao primeiro plano.
   *
   * A virada da semana acontece uma vez a cada sete dias; um temporizador
   * rodando o tempo todo para acertar esse instante gastaria bateria à toa. Na
   * prática, ninguém fica com o app aberto atravessando a virada — e quem
   * ficar vê a mudança ao voltar.
   */
  useEffect(() => {
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setAgora(agoraEditorial());
    });

    return () => inscricao.remove();
  }, []);

  const edicao = useMemo(() => ativaEm(edicoes ?? [], agora), [edicoes, agora]);

  const conteudoId = edicao?.conteudoId ?? '';

  useEffect(() => {
    if (!conteudoId) return;

    return observarConteudo(
      conteudoId,
      (conteudo) => setLida({ conteudoId, conteudo }),
      // Conteúdo arquivado deixa de ser legível para quem não é da redação, e
      // a recusa chega aqui como erro. Isso é "sem destaque", não falha da
      // Home: a tela mostra o vazio em vez de um aviso vermelho.
      () => setLida({ conteudoId, conteudo: null }),
    );
  }, [conteudoId]);

  const aula = lida?.conteudoId === conteudoId ? lida.conteudo : null;

  const carregando = edicoes === null;

  // Só aula publicada vira destaque. Um artigo programado, ou uma aula que
  // saiu do ar depois de agendada, não abre a Home num formato que ela não
  // sabe mostrar.
  const ativa =
    edicao && aula && aula.status === 'publicado' && aula.tipo === 'aula'
      ? { edicao, aula }
      : null;

  return { ativa, carregando, erro };
}
