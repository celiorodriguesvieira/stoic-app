import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Voltar } from '@/components/ui/Voltar';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured, useAuth } from '@/lib/auth-context';
import { minTouchTarget, spacing } from '@/theme';

/**
 * Entrar — nó `612:12` do Figma ("Login / Entrar / Inicial").
 *
 * Handoff `577:18`, seção LOGIN: autenticar por e-mail e senha; durante o envio
 * mostrar "Entrando…" e bloquear repetição; erro de credencial com mensagem
 * genérica, sem revelar se o e-mail existe; erro de rede permite nova
 * tentativa; nunca persistir senha.
 */

type Campo = 'email' | 'senha';
type Valores = Record<Campo, string>;
type Erros = Partial<Record<Campo, string>>;

const CAMPOS: readonly Campo[] = ['email', 'senha'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar({ email, senha }: Valores): Erros {
  const erros: Erros = {};

  if (!EMAIL_PATTERN.test(email.trim())) erros.email = 'Informe um e-mail válido.';
  if (!senha) erros.senha = 'Informe sua senha.';

  return erros;
}

/**
 * Credencial errada devolve sempre a mesma frase, sem dizer se o que falhou foi
 * o e-mail ou a senha — do contrário a tela vira um verificador de quem tem
 * conta no PAUSA.
 */
/**
 * Destinos que o parâmetro `?destino=` pode apontar.
 *
 * Lista fechada, e não validação por prefixo: assim `?destino=` nunca vira um
 * redirecionador aberto — bastaria um link com endereço externo para levar
 * alguém para fora do PAUSA logo depois de autenticar. Hoje só o painel precisa
 * disso (item 06: "abre Login mantendo o destino painel").
 */
const DESTINOS = ['/admin'] as const;

type Destino = (typeof DESTINOS)[number];

function destinoSeguro(bruto: unknown): Destino | null {
  return typeof bruto === 'string' && (DESTINOS as readonly string[]).includes(bruto)
    ? (bruto as Destino)
    : null;
}

function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String(erro.code) : '';

  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha não conferem.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/user-disabled':
      return 'Esta conta está desativada.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Seus dados foram mantidos. Tente de novo.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente de novo.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export default function EntrarScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { entrar } = useAuth();

  // "Entrar com outra conta encerra a sessão e abre Login mantendo o destino
  // painel" (contrato `618:18`, item 06).
  const { destino } = useLocalSearchParams<{ destino?: string }>();

  const [valores, setValores] = useState<Valores>({ email: '', senha: '' });
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  const refs = {
    email: useRef<TextInput>(null),
    senha: useRef<TextInput>(null),
  };

  function alterar(campo: Campo) {
    return (texto: string) => {
      setValores((atual) => ({ ...atual, [campo]: texto }));
      setErros((atual) => ({ ...atual, [campo]: undefined }));
      setFalha(null);
    };
  }

  async function enviar() {
    if (enviando) return;

    const encontrados = validar(valores);
    setErros(encontrados);
    setFalha(null);

    const primeiroInvalido = CAMPOS.find((campo) => encontrados[campo]);
    if (primeiroInvalido) {
      refs[primeiroInvalido].current?.focus();
      return;
    }

    if (!isFirebaseConfigured) {
      setFalha('Firebase não configurado. Preencha o .env com as credenciais do projeto.');
      return;
    }

    setEnviando(true);

    try {
      await entrar({ email: valores.email.trim(), senha: valores.senha });

      // Sucesso: a senha sai do estado. A rota normalmente é decidida pela
      // guarda; só quando veio um destino é que esta tela navega por conta.
      setValores((atual) => ({ ...atual, senha: '' }));

      const alvo = destinoSeguro(destino);
      if (alvo) router.replace(alvo);
    } catch (erro) {
      setFalha(mensagemDoErro(erro));
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

          <Voltar destino="Boas-vindas" aoVoltar={() => router.replace('/(auth)')} />

          <View style={styles.introducao}>
            <Text variant="headingLarge" accessibilityRole="header">
              ENTRE NO PAUSA
            </Text>

            <Text variant="supportSemibold">Acesse sua conta e retome suas descobertas.</Text>
          </View>

          <View style={styles.grupo}>
            <TextField
              ref={refs.email}
              label="E-mail"
              placeholder="voce@exemplo.com"
              value={valores.email}
              onChangeText={alterar('email')}
              error={erros.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => refs.senha.current?.focus()}
            />

            <TextField
              ref={refs.senha}
              label="Senha"
              placeholder="Digite sua senha"
              value={valores.senha}
              onChangeText={alterar('senha')}
              error={erros.senha}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={enviar}
            />

            <Pressable
              accessibilityRole="button"
              disabled={enviando}
              onPress={() => router.push('/recuperar-senha')}
              style={styles.link}>
              <Text variant="supportSemibold" style={styles.linkTexto}>
                Esqueci minha senha
              </Text>
            </Pressable>
          </View>

          <View style={styles.grupo}>
            {falha ? (
              <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
                {falha}
              </Text>
            ) : null}

            <Button
              label={enviando ? 'Entrando…' : 'ENTRAR'}
              size="medium"
              disabled={enviando}
              onPress={enviar}
            />

            <Link href="/criar-conta" asChild>
              <Pressable accessibilityRole="link" style={styles.rodape}>
                <Text variant="supportSemibold" style={styles.rodapeTexto}>
                  Ainda não tem conta? Criar conta
                </Text>
              </Pressable>
            </Link>
          </View>
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
  link: {
    height: 48,
    justifyContent: 'center',
  },
  linkTexto: {
    textAlign: 'right',
  },
  rodape: {
    height: Math.max(48, minTouchTarget),
    justifyContent: 'center',
  },
  rodapeTexto: {
    textAlign: 'center',
  },
});
