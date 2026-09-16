import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth, isFirebaseConfigured, requireAuth } from '@/lib/firebase';
import {
  criarPerfil,
  observarPerfil,
  podeEditarConteudo,
  podeGerenciarUsuarios,
  type LeituraPerfil,
  type Papel,
  type PerfilUsuario,
} from '@/lib/perfil';

const authBypass = __DEV__ && process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

/**
 * UID cuja verificação de e-mail ficou pendente.
 *
 * Persistido porque o contrato (`618:18`, item 02) manda retomar a verificação
 * numa abertura seguinte, em vez de deixar a pessoa a meio caminho. Guarda o
 * UID, e não um booleano, para que a pendência de uma conta não vaze para outra.
 */
const VERIFICACAO_KEY = 'pausa:verificacao-pendente';

type AuthState = {

  user: User | null;

  initializing: boolean;

  isSignedIn: boolean;

  /** Perfil do Firestore. `null` enquanto carrega ou se a leitura falhar. */
  perfil: PerfilUsuario | null;

  /** Papel efetivo. Visitante e desconhecido não têm papel. */
  papel: Papel | null;

  /** Entra no painel admin (editor ou administrador). */
  podeEditar: boolean;

  /** Mexe em pessoas e permissões (só administrador). */
  podeAdministrar: boolean;

  /**
   * Cria a conta, grava o perfil e dispara a verificação de e-mail.
   *
   * O perfil nasce com papel `usuario` — o cliente não escolhe papel
   * (handoff `600:75`). Se a conta for criada e o perfil falhar, a conta NÃO é
   * refeita numa nova tentativa: `criarPerfil` é idempotente e a etapa
   * pendente pode ser retomada.
   */
  criarConta: (dados: { nome: string; email: string; senha: string }) => Promise<void>;

  /** `true` enquanto o perfil ainda não foi lido ou a leitura falhou. */
  papelIndefinido: boolean;

  /** Mensagem da falha ao ler o perfil, quando houver. */
  erroDePerfil: string | null;

  /**
   * `false` enquanto a primeira leitura do perfil não voltou — por sucesso ou
   * por erro. Quem decide rota precisa disso: sem perfil ainda lido, "não tem
   * preferências" é indistinguível de "ainda não sei", e as duas coisas levam a
   * telas diferentes.
   */
  perfilCarregado: boolean;

  /** Cadastro feito e verificação de e-mail ainda não confirmada. */
  verificacaoPendente: boolean;

  /** Reenvia o e-mail de verificação. */
  reenviarVerificacao: () => Promise<void>;

  /** Sai da etapa de verificação e segue para o onboarding. */
  concluirVerificacao: () => Promise<void>;

  /** Encerra a sessão. O progresso local não é apagado. */
  sair: () => Promise<void>;

  /** Entra numa conta existente. A troca de rota vem de `onAuthStateChanged`. */
  entrar: (dados: { email: string; senha: string }) => Promise<void>;

  /**
   * Envia o e-mail de redefinição de senha.
   *
   * Resolve mesmo quando o e-mail não existe: dizer "esta conta não existe"
   * revelaria quem tem cadastro no PAUSA para quem só está testando endereços.
   */
  redefinirSenha: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  initializing: true,
  isSignedIn: false,
  perfil: null,
  papel: null,
  podeEditar: false,
  podeAdministrar: false,
  papelIndefinido: true,
  erroDePerfil: null,
  perfilCarregado: false,
  verificacaoPendente: false,
  reenviarVerificacao: async () => {},
  concluirVerificacao: async () => {},
  sair: async () => {},
  criarConta: async () => {},
  entrar: async () => {},
  redefinirSenha: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [leitura, setLeitura] = useState<LeituraPerfil>({ estado: 'carregando' });
  const [uidVerificando, setUidVerificando] = useState<string | null>(null);
  const [verificacaoPronta, setVerificacaoPronta] = useState(false);

  useEffect(() => {

    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(VERIFICACAO_KEY)
      .then(setUidVerificando)
      .catch(() => {})
      .finally(() => setVerificacaoPronta(true));
  }, []);

  useEffect(() => {
    if (!user) return;

    return observarPerfil(user.uid, setLeitura);
  }, [user]);

  // Deriva em vez de limpar por efeito: assim o perfil de uma sessão anterior
  // nunca vaza para o usuário seguinte durante o intervalo entre os dois.
  const lido = leitura.estado === 'pronto' ? leitura.perfil : null;
  const perfil = user && lido?.uid === user.uid ? lido : null;

  const criarConta = useCallback(
    async ({ nome, email, senha }: { nome: string; email: string; senha: string }) => {
      const credencial = await createUserWithEmailAndPassword(requireAuth(), email, senha);

      await updateProfile(credencial.user, { displayName: nome });
      await criarPerfil(credencial.user.uid, { nome, email });
      await sendEmailVerification(credencial.user);

      setUidVerificando(credencial.user.uid);
      try {
        await AsyncStorage.setItem(VERIFICACAO_KEY, credencial.user.uid);
      } catch {
        // Sem persistência a verificação some ao fechar o app; a conta continua criada.
      }
    },
    [],
  );

  const reenviarVerificacao = useCallback(async () => {
    const atual = requireAuth().currentUser;
    if (atual) await sendEmailVerification(atual);
  }, []);

  const concluirVerificacao = useCallback(async () => {
    setUidVerificando(null);
    try {
      await AsyncStorage.removeItem(VERIFICACAO_KEY);
    } catch {
      // Falhar aqui só faz a etapa reaparecer numa próxima abertura.
    }
  }, []);

  const sair = useCallback(async () => {
    await signOut(requireAuth());
  }, []);

  const entrar = useCallback(async ({ email, senha }: { email: string; senha: string }) => {
    await signInWithEmailAndPassword(requireAuth(), email, senha);
  }, []);

  const redefinirSenha = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(requireAuth(), email);
    } catch (erro) {
      const codigo = typeof erro === 'object' && erro && 'code' in erro ? String(erro.code) : '';

      // E-mail desconhecido não vira erro: a tela responde igual nos dois casos.
      if (codigo !== 'auth/user-not-found' && codigo !== 'auth/invalid-email') {
        throw erro;
      }
    }
  }, []);

  // Atalho de desenvolvimento: sem Firebase configurado não há perfil, então o
  // bypass também abre o painel — do contrário não haveria como vê-lo rodando.
  const papel: Papel | null = perfil?.papel ?? (authBypass ? 'administrador' : null);

  // "Ainda não sei" é diferente de "não tem": o contrato proíbe tratar falha de
  // rede como ausência de permissão.
  const papelIndefinido =
    !authBypass && user !== null && (leitura.estado === 'carregando' || leitura.estado === 'erro');

  const erroDePerfil = leitura.estado === 'erro' ? leitura.mensagem : null;

  // Sem usuário não há perfil a esperar; com bypass não há leitura nenhuma.
  const perfilCarregado = authBypass || user === null || leitura.estado !== 'carregando';

  // A pendência só vale para a conta que está logada agora.
  const verificacaoPendente =
    user !== null && uidVerificando === user.uid && !user.emailVerified;

  const value = useMemo<AuthState>(
    () => ({
      user,
      initializing: !authReady || !verificacaoPronta,
      // "Não existe entrada sem cadastro" (contrato `618:18`, item 06).
      isSignedIn: authBypass || user !== null,
      perfil,
      papel,
      podeEditar: podeEditarConteudo(papel),
      podeAdministrar: podeGerenciarUsuarios(papel),
      papelIndefinido,
      erroDePerfil,
      perfilCarregado,
      verificacaoPendente,
      reenviarVerificacao,
      concluirVerificacao,
      sair,
      criarConta,
      entrar,
      redefinirSenha,
    }),
    [
      user,
      authReady,
      verificacaoPronta,
      perfil,
      papel,
      papelIndefinido,
      erroDePerfil,
      perfilCarregado,
      verificacaoPendente,
      reenviarVerificacao,
      concluirVerificacao,
      sair,
      criarConta,
      entrar,
      redefinirSenha,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export { isFirebaseConfigured };
