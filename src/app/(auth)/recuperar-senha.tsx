import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured, useAuth } from '@/lib/auth-context';
import { spacing } from '@/theme';

/**
 * Recuperar senha — nós `613:14` (solicitar link) e `613:43` (confirmação
 * neutra) do Figma.
 *
 * São dois estados da mesma rota, e não duas rotas: "Tentar outro e-mail" volta
 * ao formulário com o campo limpo. A confirmação é **neutra de propósito** —
 * responde igual exista ou não conta com aquele e-mail, para que a tela não
 * vire um verificador de quem tem cadastro no PAUSA. Quem garante isso é o
 * `redefinirSenha` no contexto de autenticação, que engole `user-not-found`.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String(erro.code) : '';

  switch (codigo) {
    case 'auth/network-request-failed':
      return 'Sem conexão. Seu e-mail foi mantido. Tente de novo.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente de novo.';
    default:
      return 'Não foi possível enviar as instruções. Tente novamente.';
  }
}

export default function RecuperarSenhaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { redefinirSenha } = useAuth();

  const [email, setEmail] = useState('');
  const [erro, setErro] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const campo = useRef<TextInput>(null);

  function voltarAoLogin() {
    router.replace('/entrar');
  }

  async function enviar() {
    if (enviando) return;

    if (!EMAIL_PATTERN.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      campo.current?.focus();
      return;
    }

    setErro(undefined);
    setFalha(null);

    if (!isFirebaseConfigured) {
      setFalha('Firebase não configurado. Preencha o .env com as credenciais do projeto.');
      return;
    }

    setEnviando(true);

    try {
      await redefinirSenha(email.trim());
      setEnviado(true);
    } catch (falhou) {
      // O e-mail continua na tela para nova tentativa.
      setFalha(mensagemDoErro(falhou));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="labelButton" color="wine">
            PAUSA
          </Text>

          {enviado ? (
            <>
              <View style={styles.introducao}>
                <Text variant="headingLarge" accessibilityRole="header">
                  CONFIRA SEU E-MAIL
                </Text>

                <Text variant="supportSemibold" accessibilityLiveRegion="polite">
                  Se houver uma conta com o e-mail informado, você receberá as instruções para
                  redefinir sua senha. Confira também a pasta de spam.
                </Text>
              </View>

              <View style={styles.grupo}>
                <Button
                  label="TENTAR OUTRO E-MAIL"
                  type="secondary"
                  size="medium"
                  onPress={() => {
                    setEnviado(false);
                    setEmail('');
                    setFalha(null);
                  }}
                />

                <Button label="VOLTAR AO LOGIN" size="medium" onPress={voltarAoLogin} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.introducao}>
                <Text variant="headingLarge" accessibilityRole="header">
                  RECUPERAR SENHA
                </Text>

                <Text variant="supportSemibold">
                  Informe seu e-mail para receber as instruções de redefinição.
                </Text>
              </View>

              <View style={styles.grupo}>
                <TextField
                  ref={campo}
                  label="E-mail"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChangeText={(texto) => {
                    setEmail(texto);
                    setErro(undefined);
                    setFalha(null);
                  }}
                  error={erro}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={enviar}
                />
              </View>

              <View style={styles.grupo}>
                {falha ? (
                  <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
                    {falha}
                  </Text>
                ) : null}

                <Button
                  label={enviando ? 'Enviando…' : 'ENVIAR INSTRUÇÕES'}
                  size="medium"
                  disabled={enviando}
                  onPress={enviar}
                />

                <Button
                  label="VOLTAR AO LOGIN"
                  type="secondary"
                  size="medium"
                  disabled={enviando}
                  onPress={voltarAoLogin}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing['2xl'],
    gap: spacing['2xl'],
  },
  introducao: {
    gap: spacing.sm,
  },
  grupo: {
    gap: spacing.lg,
  },
});
