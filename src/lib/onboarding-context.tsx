import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/lib/auth-context';
import { salvarPreferencias } from '@/lib/perfil';

/**
 * Estado do onboarding, guardado por usuário.
 *
 * Contrato `618:18`, item 03: "Vincular perfil, preferências e progresso ao UID
 * autenticado. Cache local deve ser separado por usuário. A remoção do modo
 * visitante não autoriza apagar dados locais existentes."
 *
 * Daí as chaves levarem o UID: duas pessoas no mesmo aparelho não compartilham
 * onboarding nem preferências.
 */

const PREFIXO = 'pausa';

function chave(uid: string, nome: string) {
  return `${PREFIXO}:${uid}:${nome}`;
}

const CONCLUIDO = 'onboarding-concluido';
const PREFERENCIAS = 'preferencias';
const PARCIAL = 'onboarding-parcial';

/**
 * Chaves globais da época do modo visitante.
 *
 * São **lidas e copiadas, nunca apagadas** — o contrato é explícito quanto a
 * isso. Só a primeira conta que abrir o app no aparelho as adota, para que a
 * segunda pessoa não herde o onboarding da primeira.
 */
const LEGADO = {
  [CONCLUIDO]: `${PREFIXO}:${CONCLUIDO}`,
  [PREFERENCIAS]: `${PREFIXO}:${PREFERENCIAS}`,
  [PARCIAL]: `${PREFIXO}:${PARCIAL}`,
} as const;

const ADOTADO_POR = `${PREFIXO}:cache-adotado-por`;

export type PreferenciasOnboarding = {
  nivel: string | null;
  interesses: string[];
};

export type ParcialOnboarding = {
  etapa: number;
  nivel: string | null;
  interesses: string[];
};

type Estado = {
  uid: string | null;
  onboardingDone: boolean;
  parcial: ParcialOnboarding | null;
};

type OnboardingState = {
  initializing: boolean;
  onboardingDone: boolean;
  /** Etapa e escolhas de uma sessão interrompida. `null` se não houver. */
  parcial: ParcialOnboarding | null;
  /** Grava o andamento a cada passo, para poder retomar. */
  salvarParcial: (parcial: ParcialOnboarding) => void;
  finishOnboarding: (preferencias: PreferenciasOnboarding) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState>({
  initializing: true,
  onboardingDone: false,
  parcial: null,
  salvarParcial: () => {},
  finishOnboarding: async () => {},
});

function lerParcial(bruto: string | null): ParcialOnboarding | null {
  if (!bruto) return null;

  try {
    const lido = JSON.parse(bruto) as ParcialOnboarding;
    return {
      etapa: typeof lido.etapa === 'number' ? lido.etapa : 0,
      nivel: typeof lido.nivel === 'string' ? lido.nivel : null,
      interesses: Array.isArray(lido.interesses) ? lido.interesses : [],
    };
  } catch {
    // Rascunho corrompido: recomeça do zero, sem derrubar o app.
    return null;
  }
}

/** Copia o cache da era do visitante para a primeira conta do aparelho. */
async function adotarCacheAntigo(uid: string): Promise<void> {
  const dono = await AsyncStorage.getItem(ADOTADO_POR);
  if (dono) return;

  const antigos = await AsyncStorage.multiGet(Object.values(LEGADO));
  const encontrados = antigos.filter(([, valor]) => valor != null);

  if (encontrados.length === 0) {
    // Nada a adotar, mas marca assim mesmo: evita reler a cada abertura.
    await AsyncStorage.setItem(ADOTADO_POR, uid);
    return;
  }

  const paraGravar: [string, string][] = [];
  for (const [nome, chaveAntiga] of Object.entries(LEGADO)) {
    const valor = antigos.find(([k]) => k === chaveAntiga)?.[1];
    if (valor != null) paraGravar.push([chave(uid, nome), valor]);
  }

  paraGravar.push([ADOTADO_POR, uid]);
  await AsyncStorage.multiSet(paraGravar);
  // As chaves antigas ficam onde estão, de propósito.
}

async function carregar(uid: string | null): Promise<Estado> {
  if (!uid) {
    return { uid: null, onboardingDone: false, parcial: null };
  }

  try {
    await adotarCacheAntigo(uid);
  } catch {
    // Falhar a adoção só faz o onboarding reaparecer; nada é perdido.
  }

  const [[, concluido], [, parcial]] = await AsyncStorage.multiGet([
    chave(uid, CONCLUIDO),
    chave(uid, PARCIAL),
  ]);

  return { uid, onboardingDone: concluido === 'true', parcial: lerParcial(parcial) };
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  // O provedor de autenticação envolve este, então `user` já está disponível.
  const { user, perfil, perfilCarregado } = useAuth();
  const uid = user?.uid ?? null;

  const [estado, setEstado] = useState<Estado | null>(null);

  /**
   * Preferências gravadas no perfil provam que o onboarding foi concluído.
   *
   * Antes, só o AsyncStorage respondia por isso — e o aparelho é justamente o
   * que não acompanha a pessoa. Entrar noutro navegador, numa aba anônima ou
   * depois de limpar os dados do site fazia o app pedir o onboarding de novo,
   * com as respostas já salvas no banco. Era a promessa do cadastro
   * ("continue de onde parou em outros aparelhos") sendo quebrada.
   */
  const preferenciasNoPerfil =
    !!uid &&
    perfil?.uid === uid &&
    !!perfil.preferencias &&
    (perfil.preferencias.nivel !== null || perfil.preferencias.interesses.length > 0);

  // Enquanto o estado carregado não for o do usuário atual, ainda é "carregando" —
  // é o que impede a rota de ser decidida com o onboarding de outra sessão.
  const localPronto = estado !== null && estado.uid === uid;

  /*
    Quando o aparelho diz "não concluído", a resposta ainda não está fechada: o
    perfil pode dizer que sim. Esperar a leitura evita mandar para o onboarding
    quem já o fez — e evita o pisca-pisca de ir e voltar.
  */
  const initializing =
    !localPronto || (uid !== null && !estado?.onboardingDone && !perfilCarregado);

  const concluido = (estado?.onboardingDone ?? false) || preferenciasNoPerfil;

  useEffect(() => {
    let vivo = true;

    carregar(uid)
      .then((proximo) => {
        if (vivo) setEstado(proximo);
      })
      .catch(() => {
        if (vivo) setEstado({ uid, onboardingDone: false, parcial: null });
      });

    return () => {
      vivo = false;
    };
  }, [uid]);

  /**
   * Sobe para o perfil o que só existe no aparelho.
   *
   * Serve a quem usou o app antes desta versão, quando o modo visitante ainda
   * existia. Só grava quando o perfil não tem preferências — não sobrescreve o
   * que já está no servidor.
   */
  const sincronizado = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !perfil || perfil.uid !== uid || perfil.preferencias) return;
    if (sincronizado.current === uid) return;

    sincronizado.current = uid;

    AsyncStorage.getItem(chave(uid, PREFERENCIAS))
      .then((salvo) => {
        if (!salvo) return;

        const local = JSON.parse(salvo) as PreferenciasOnboarding;
        if (!local.nivel && (local.interesses ?? []).length === 0) return;

        return salvarPreferencias(uid, {
          nivel: local.nivel ?? null,
          interesses: local.interesses ?? [],
        });
      })
      .catch(() => {
        // Nada é apagado: tenta de novo na próxima entrada.
        sincronizado.current = null;
      });
  }, [uid, perfil]);

  /**
   * Caminho inverso do efeito acima: o perfil prova que o onboarding foi feito,
   * mas este aparelho não sabe. Anota a marca local para que a próxima abertura
   * não precise da rede para decidir a rota.
   */
  const marcadoLocalmente = useRef<string | null>(null);

  useEffect(() => {
    if (!uid || !preferenciasNoPerfil) return;
    if (estado?.uid !== uid || estado.onboardingDone) return;
    if (marcadoLocalmente.current === uid) return;

    marcadoLocalmente.current = uid;

    AsyncStorage.setItem(chave(uid, CONCLUIDO), 'true').catch(() => {
      // Sem a marca, a decisão continua saindo do perfil na próxima entrada.
      marcadoLocalmente.current = null;
    });
  }, [uid, preferenciasNoPerfil, estado]);

  // Grava sem bloquear a interação: perder o último passo é aceitável, travar não.
  const salvarParcial = useCallback(
    (proximo: ParcialOnboarding) => {
      if (!uid) return;

      setEstado((atual) => (atual ? { ...atual, parcial: proximo } : atual));
      AsyncStorage.setItem(chave(uid, PARCIAL), JSON.stringify(proximo)).catch(() => {});
    },
    [uid],
  );

  const finishOnboarding = useCallback(
    async (preferencias: PreferenciasOnboarding) => {
      if (!uid) return;

      setEstado((atual) => (atual ? { ...atual, onboardingDone: true, parcial: null } : atual));

      // O aparelho vem primeiro: é o que faz o app seguir funcionando offline.
      try {
        await AsyncStorage.multiSet([
          [
            chave(uid, PREFERENCIAS),
            JSON.stringify({ ...preferencias, atualizadoEm: Date.now() }),
          ],
          [chave(uid, CONCLUIDO), 'true'],
        ]);
        // O rascunho perde a razão de existir assim que o onboarding termina.
        await AsyncStorage.removeItem(chave(uid, PARCIAL));
      } catch {
        // Sem persistência o onboarding volta a aparecer na próxima abertura.
      }

      // E sobe para o perfil — é o que permite recomendar conteúdo, continuar em
      // outro aparelho e cruzar perfil com desempenho na avaliação do TCC.
      try {
        await salvarPreferencias(uid, preferencias);
      } catch {
        // Falha de rede não trava o onboarding; sobe na entrada seguinte.
      }
    },
    [uid],
  );

  const value = useMemo<OnboardingState>(
    () => ({
      initializing,
      onboardingDone: concluido,
      parcial: estado?.parcial ?? null,
      salvarParcial,
      finishOnboarding,
    }),
    [initializing, concluido, estado, salvarParcial, finishOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingState {
  return useContext(OnboardingContext);
}
