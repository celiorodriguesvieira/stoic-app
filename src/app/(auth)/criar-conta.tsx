import { Link, useRouter } from 'expo-router';
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

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/hooks/use-theme';
import { useAuth, isFirebaseConfigured } from '@/lib/auth-context';
import { minTouchTarget, spacing } from '@/theme';

type Campo = 'nome' | 'email' | 'senha' | 'confirmacao';
type Valores = Record<Campo, string>;
type Erros = Partial<Record<Campo, string>>;

const CAMPOS: readonly Campo[] = ['nome', 'email', 'senha', 'confirmacao'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mínimo padrão do Firebase Authentication; ajustar se a política do projeto for mais rígida.
const SENHA_MINIMA = 6;

function validar({ nome, email, senha, confirmacao }: Valores): Erros {
  const erros: Erros = {};

  if (!nome.trim()) erros.nome = 'Informe como podemos chamar você.';
  if (!EMAIL_PATTERN.test(email.trim())) erros.email = 'Informe um e-mail válido.';
  if (senha.length < SENHA_MINIMA) erros.senha = `Use pelo menos ${SENHA_MINIMA} caracteres.`;
  if (confirmacao !== senha) erros.confirmacao = 'As senhas não coincidem.';

  return erros;
}

/** Traduz o código do Firebase Authentication para uma frase que o usuário entenda. */
function mensagemDoErro(erro: unknown): string {
  const codigo = typeof erro === 'object' && erro && 'code' in erro ? String(erro.code) : '';

  switch (codigo) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já tem conta. Tente entrar.';
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.';
    case 'auth/weak-password':
      return 'Senha muito fraca para a política do projeto.';
    case 'auth/network-request-failed':
      return 'Sem conexão. Seus dados foram mantidos — tente de novo.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um momento e tente de novo.';
    default:
      return 'Não foi possível criar a conta. Tente novamente.';
  }
}

export default function CriarContaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { criarConta } = useAuth();

  const [valores, setValores] = useState<Valores>({ nome: '', email: '', senha: '', confirmacao: '' });
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  const refs = {
    nome: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    senha: useRef<TextInput>(null),
    confirmacao: useRef<TextInput>(null),
  };

  function alterar(campo: Campo) {
    return (texto: string) => {
      setValores((atual) => ({ ...atual, [campo]: texto }));
      setErros((atual) => ({ ...atual, [campo]: undefined }));
      setFalha(null);
    };
  }

  async function enviar() {
    // Impede envio duplicado enquanto a requisição está em voo.
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
      await criarConta({
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        senha: valores.senha,
      });

      // Contrato item 01: Cadastro → Verificação de e-mail → Onboarding → Home.
      // A senha nunca fica guardada.
      setValores((atual) => ({ ...atual, senha: '', confirmacao: '' }));
      router.replace('/verificar-email');
    } catch (erro) {
      // Falha de rede mantém nome e e-mail para nova tentativa; a senha permanece
      // apenas no estado do componente, nunca em log ou no Firestore.
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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text variant="labelButton" color="wine">
            PAUSA
          </Text>

          <View style={styles.introducao}>
            <Text variant="headingLarge" accessibilityRole="header">
              CRIE SUA CONTA
            </Text>

            <Text variant="supportSemibold">
              Salve suas descobertas e continue de onde parou em outros aparelhos.
            </Text>
          </View>

          <View style={styles.grupo}>
            <TextField
              ref={refs.nome}
              label="Nome"
              placeholder="Como podemos chamar você?"
              value={valores.nome}
              onChangeText={alterar('nome')}
              onEndEditing={() => setValores((atual) => ({ ...atual, nome: atual.nome.trim() }))}
              error={erros.nome}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => refs.email.current?.focus()}
            />

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
              placeholder="Crie uma senha"
              value={valores.senha}
              onChangeText={alterar('senha')}
              error={erros.senha}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => refs.confirmacao.current?.focus()}
            />

            <TextField
              ref={refs.confirmacao}
              label="Confirmar senha"
              placeholder="Repita sua senha"
              value={valores.confirmacao}
              onChangeText={alterar('confirmacao')}
              error={erros.confirmacao}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
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
              label={enviando ? 'Criando conta…' : 'CRIAR CONTA'}
              size="medium"
              disabled={enviando}
              onPress={enviar}
            />

            <Link href="/entrar" asChild>
              <Pressable accessibilityRole="link" style={styles.entrar}>
                <Text variant="supportSemibold" style={styles.entrarTexto}>
                  Já tem conta? Entrar
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
  entrar: {
    minHeight: Math.max(48, minTouchTarget),
    justifyContent: 'center',
  },
  entrarTexto: {
    textAlign: 'center',
  },
});
