import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/**
 * Verificação de e-mail — nó `626:18` do Figma.
 *
 * Contrato `618:18`, item 06:
 *   "Já verifiquei deve consultar o estado atualizado da autenticação;
 *    confirmado, retomar onboarding/Home; pendente, informar que o e-mail ainda
 *    não foi confirmado. Reenviar deve informar envio, limitar repetição e
 *    permitir nova tentativa em falha de rede. Voltar ao Login encerra a sessão
 *    pendente."
 *
 * O item 02 manda retomar esta etapa numa abertura seguinte, sem apagar
 * progresso — por isso a pendência fica no armazenamento, não só em memória.
 */

/** Espera entre reenvios. Sem isto, o botão vira um gerador de e-mails. */
const ESPERA_REENVIO_S = 60;

type Estado =
  | { tipo: 'ocioso' }
  | { tipo: 'conferindo' }
  | { tipo: 'reenviando' }
  | { tipo: 'aviso'; mensagem: string }
  | { tipo: 'erro'; mensagem: string };

export default function VerificarEmailScreen() {
  const { colors } = useTheme();
  const { user, reenviarVerificacao, concluirVerificacao, sair } = useAuth();

  const [estado, setEstado] = useState<Estado>({ tipo: 'ocioso' });
  const [esperaReenvio, setEsperaReenvio] = useState(0);

  const ocupado = estado.tipo === 'conferindo' || estado.tipo === 'reenviando';

  // Contagem regressiva do bloqueio de reenvio: um passo por segundo.
  useEffect(() => {
    if (esperaReenvio <= 0) return;

    const passo = setTimeout(() => setEsperaReenvio(esperaReenvio - 1), 1000);
    return () => clearTimeout(passo);
  }, [esperaReenvio]);

  async function conferir() {
    if (ocupado || !user) return;

    setEstado({ tipo: 'conferindo' });

    try {
      // `emailVerified` só muda no cliente depois de recarregar o usuário.
      await user.reload();

      if (user.emailVerified) {
        await concluirVerificacao();
        return;
      }

      setEstado({
        tipo: 'aviso',
        mensagem: 'Ainda não confirmamos. Abra o link do e-mail e toque de novo aqui.',
      });
    } catch {
      setEstado({
        tipo: 'erro',
        mensagem: 'Não foi possível conferir agora. Tente de novo em instantes.',
      });
    }
  }

  async function reenviar() {
    if (ocupado || esperaReenvio > 0) return;

    setEstado({ tipo: 'reenviando' });

    try {
      await reenviarVerificacao();
      setEstado({ tipo: 'aviso', mensagem: 'Enviamos outro link. Confira também o spam.' });
      setEsperaReenvio(ESPERA_REENVIO_S);
    } catch {
      // Falha não inicia a espera: o contrato manda permitir nova tentativa.
      setEstado({
        tipo: 'erro',
        mensagem: 'Não foi possível reenviar. Aguarde um momento e tente de novo.',
      });
    }
  }

  /**
   * "Voltar ao Login encerra a sessão pendente" (item 06).
   *
   * A conta continua criada e o e-mail continua por confirmar — dá para voltar
   * e retomar esta etapa a qualquer momento. Nada é apagado.
   */
  async function voltarAoLogin() {
    if (ocupado) return;

    try {
      await concluirVerificacao();
      await sair();
    } catch {
      setEstado({ tipo: 'erro', mensagem: 'Não foi possível sair agora. Tente de novo.' });
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="labelButton" color="wine">
          PAUSA
        </Text>

        <View style={styles.introducao}>
          <Text variant="headingLarge" accessibilityRole="header">
            VERIFIQUE SEU E-MAIL
          </Text>

          <Text variant="supportSemibold">
            Enviamos um link para o e-mail do seu cadastro. Abra a mensagem e confirme seu
            endereço para continuar. Confira também a pasta de spam.
          </Text>
        </View>

        <View style={styles.acoes}>
          {estado.tipo === 'aviso' ? (
            <Text variant="bodySmall" color="textAccent" accessibilityLiveRegion="polite">
              {estado.mensagem}
            </Text>
          ) : null}

          {estado.tipo === 'erro' ? (
            <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
              {estado.mensagem}
            </Text>
          ) : null}

          <Button
            label={estado.tipo === 'conferindo' ? 'Conferindo…' : 'JÁ VERIFIQUEI MEU E-MAIL'}
            size="medium"
            disabled={ocupado}
            onPress={conferir}
          />

          <Button
            label={
              estado.tipo === 'reenviando'
                ? 'Reenviando…'
                : esperaReenvio > 0
                  ? `REENVIAR EM ${esperaReenvio}s`
                  : 'REENVIAR E-MAIL'
            }
            type="secondary"
            size="medium"
            disabled={ocupado || esperaReenvio > 0}
            onPress={reenviar}
          />

          <Button
            label="VOLTAR AO LOGIN"
            type="secondary"
            size="medium"
            disabled={ocupado}
            onPress={voltarAoLogin}
          />
        </View>

        <Text variant="bodySmall" color="textSecondary">
          Sua conta já foi criada. Voltar ao login não apaga nada — você pode confirmar o e-mail
          e entrar depois.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing['2xl'],
    gap: spacing['2xl'],
  },
  introducao: {
    gap: spacing.sm,
  },
  acoes: {
    gap: spacing.lg,
  },
});
