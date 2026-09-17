import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { salvarPreferencias } from '@/lib/perfil';
import { minTouchTarget, radius, spacing } from '@/theme';

/** Largura do painel (item 11): `min(342px, 100vw)`. */
const LARGURA = 342;

const NIVEIS = [
  { id: 'leigo', rotulo: 'Leigo' },
  { id: 'curioso', rotulo: 'Curioso' },
  { id: 'estudioso', rotulo: 'Estudioso' },
  { id: 'erudito', rotulo: 'Erudito' },
] as const;

type Saida = { estado: 'ocioso' } | { estado: 'saindo' } | { estado: 'erro' };

/**
 * Menu "Seu espaço" — contrato `649:987`, cenário visual `645:977`.
 *
 * Diálogo modal sobreposto, painel à direita, fechando pelo X, por toque fora,
 * por Escape e pelo Voltar do aparelho (item 11).
 */
export function MenuSeuEspaco({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, perfil, sair } = useAuth();

  const [semMovimento, setSemMovimento] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSemMovimento)
      .catch(() => {});
  }, []);

  // Escape fecha. O Modal trata o Voltar do Android por `onRequestClose`, mas
  // na web quem escuta o teclado é a página.
  useEffect(() => {
    if (Platform.OS !== 'web' || !aberto) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };

    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, aoFechar]);

  const nome = perfil?.nome || user?.displayName || '';

  /** Sai do menu antes de navegar: o item 12 não quer menu dentro de menu. */
  function irPara(rota: '/perfil' | '/preferencias') {
    aoFechar();
    router.push(rota);
  }

  return (
    <Modal
      visible={aberto}
      transparent
      animationType={semMovimento ? 'none' : 'fade'}
      onRequestClose={aoFechar}
      accessibilityViewIsModal
      statusBarTranslucent>
      <View style={styles.cena}>
        {/* Fundo escurecido; tocar fora fecha (item 01). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          onPress={aoFechar}
          style={styles.fundo}
        />

        <View
          style={[
            styles.painel,
            {
              backgroundColor: colors.surface,
              paddingTop: insets.top + spacing['2xl'],
              paddingBottom: insets.bottom + spacing['2xl'],
            },
          ]}>
          <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
            <View style={styles.cabecalho}>
              <Text variant="headingLarge" accessibilityRole="header">
                SEU ESPAÇO
              </Text>

              <BotaoFechar aoFechar={aoFechar} />
            </View>

            <View style={styles.identidade}>
              <Avatar nome={nome} avatarId={perfil?.avatarId ?? null} tamanho={64} />

              <View style={styles.identidadeTexto}>
                <Text>{nome || 'Sua conta'}</Text>
                <Text variant="bodySmall" color="textSecondary">
                  Sua conta PAUSA.
                </Text>
              </View>
            </View>

            <Button
              label="EDITAR PERFIL"
              type="secondary"
              size="medium"
              shape="rounded"
              onPress={() => irPara('/perfil')}
            />

            <NivelDeLeitura
              uid={user?.uid ?? null}
              atual={perfil?.preferencias?.nivel ?? null}
              interesses={perfil?.preferencias?.interesses ?? []}
            />

            <Button
              label="MAIS PREFERÊNCIAS →"
              type="secondary"
              size="medium"
              shape="rounded"
              onPress={() => irPara('/preferencias')}
            />

            <View style={styles.apoio}>
              <Text variant="bodySmall" color="textSecondary">
                Rotina e acessibilidade
              </Text>
              <Text variant="bodySmall" color="textSecondary">
                Suas preferências ficam vinculadas à sua conta.
              </Text>
            </View>

            {/*
              Não há entrada para o painel aqui, e isso é decisão de desenho,
              não esquecimento: "abrir o endereço /admin diretamente no
              navegador; não há botão, escudo ou link para o painel dentro do
              menu do aplicativo" (`646:103`), com o aceite "menu do app sem
              entrada administrativa em todas as contas".

              O mesmo handoff avisa que esconder o item não é proteção — quem
              barra é `admin/_layout.tsx` com o papel do servidor, e as Security
              Rules com os dados. Tirar o botão só deixa de anunciar o painel
              para quem não vai usá-lo no celular.
            */}
            <SairDaConta
              aoSair={sair}
              aoFechar={aoFechar}
              irParaLogin={() => router.replace('/entrar')}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function BotaoFechar({ aoFechar }: { aoFechar: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fechar menu"
      onPress={aoFechar}
      style={styles.alvo}>
      <View style={styles.xis}>
        <View style={[styles.barraXis, styles.barraDireita, { backgroundColor: colors.text }]} />
        <View style={[styles.barraXis, styles.barraEsquerda, { backgroundColor: colors.text }]} />
      </View>
    </Pressable>
  );
}

/**
 * Seletor de nível (item 03): escolha única, salva na hora.
 *
 * Falha restaura a seleção anterior e oferece nova tentativa (item 10) — em vez
 * de deixar na tela um nível que o servidor não aceitou.
 */
function NivelDeLeitura({
  uid,
  atual,
  interesses,
}: {
  uid: string | null;
  atual: string | null;
  /**
   * Vão junto na gravação de propósito: `salvarPreferencias` escreve o objeto
   * `preferencias` inteiro, então mandar uma lista vazia aqui apagaria os
   * interesses escolhidos no onboarding.
   */
  interesses: string[];
}) {
  const { colors } = useTheme();

  /**
   * A escolha em andamento é um desvio do que o perfil diz, e carrega a versão
   * do perfil em que nasceu. Quando o servidor responde e `atual` muda, o
   * desvio deixa de valer sozinho — sem efeito sincronizando dois estados.
   */
  const [desvio, setDesvio] = useState<{ base: string | null; valor: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const escolhido = desvio && desvio.base === atual ? desvio.valor : atual;

  async function escolher(nivel: string) {
    if (!uid || nivel === escolhido) return;

    setDesvio({ base: atual, valor: nivel });
    setErro(null);

    try {
      await salvarPreferencias(uid, { nivel, interesses });
    } catch {
      setDesvio(null);
      setErro('Não foi possível salvar o nível. Tente novamente.');
    }
  }

  return (
    <View style={styles.apoio}>
      <Text variant="supportSemibold">NÍVEL DE LEITURA</Text>

      <View style={[styles.niveis, { borderColor: colors.border }]}>
        {NIVEIS.map((nivel) => {
          const ativo = nivel.id === escolhido;

          return (
            <Pressable
              key={nivel.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={nivel.rotulo}
              onPress={() => escolher(nivel.id)}
              style={[styles.nivel, ativo && { backgroundColor: colors.selected }]}>
              <Text variant="bodySmall" color={ativo ? 'text' : 'textSecondary'}>
                {nivel.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        variant="bodySmall"
        color={erro ? 'error' : 'textSecondary'}
        accessibilityLiveRegion="polite">
        {erro ?? 'Você pode mudar seu nível a qualquer momento.'}
      </Text>
    </View>
  );
}

/**
 * Sair da conta (item 09).
 *
 * Durante o envio o botão fica desabilitado, para não disparar duas saídas. Em
 * caso de falha a sessão continua de pé e a mensagem convida a repetir — nunca
 * se anuncia saída que não aconteceu.
 */
function SairDaConta({
  aoSair,
  aoFechar,
  irParaLogin,
}: {
  aoSair: () => Promise<void>;
  aoFechar: () => void;
  irParaLogin: () => void;
}) {
  const [saida, setSaida] = useState<Saida>({ estado: 'ocioso' });

  async function sair() {
    if (saida.estado === 'saindo') return;

    setSaida({ estado: 'saindo' });

    try {
      await aoSair();
      setSaida({ estado: 'ocioso' });
      aoFechar();
      irParaLogin();
    } catch {
      setSaida({ estado: 'erro' });
    }
  }

  return (
    <View style={styles.apoio}>
      <Button
        label={saida.estado === 'saindo' ? 'SAINDO…' : 'SAIR DA CONTA'}
        type="secondary"
        size="medium"
        shape="rounded"
        disabled={saida.estado === 'saindo'}
        onPress={sair}
        accessibilityLabel="Sair da conta"
      />

      {saida.estado === 'erro' ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="assertive">
          Não foi possível sair. Tente novamente.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cena: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fundo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(23, 21, 21, 0.45)',
  },
  painel: {
    width: '100%',
    maxWidth: LARGURA,
    height: '100%',
    paddingHorizontal: spacing['2xl'],
  },
  conteudo: {
    gap: spacing['2xl'],
    paddingBottom: spacing['2xl'],
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  identidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identidadeTexto: {
    flex: 1,
    gap: spacing.xs,
  },
  apoio: {
    gap: spacing.sm,
  },
  niveis: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  nivel: {
    flex: 1,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  alvo: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.md,
  },
  xis: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraXis: {
    position: 'absolute',
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  barraDireita: {
    transform: [{ rotate: '45deg' }],
  },
  barraEsquerda: {
    transform: [{ rotate: '-45deg' }],
  },
});
