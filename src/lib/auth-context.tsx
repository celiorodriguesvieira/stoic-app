import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
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
  type Papel,
  type PerfilUsuario,
} from '@/lib/perfil';

const authBypass = __DEV__ && process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

// Visitante: usa o app sem conta; progresso e preferências ficam só no aparelho.
const GUEST_KEY = 'pausa:visitante';

type AuthState = {

  user: User | null;

  initializing: boolean;

  isGuest: boolean;

  isSignedIn: boolean;

  /** Perfil do Firestore. `null` para visitante ou enquanto carrega. */
  perfil: PerfilUsuario | null;

  /** Papel efetivo. Visitante e desconhecido não têm papel. */
  papel: Papel | null;

  /** Entra no painel admin (editor ou administrador). */
  podeEditar: boolean;

  /** Mexe em pessoas e permissões (só administrador). */
  podeAdministrar: boolean;

  continueAsGuest: () => Promise<void>;

  /**
   * Cria a conta, grava o perfil e dispara a verificação de e-mail.
   *
   * O perfil nasce com papel `usuario` — o cliente não escolhe papel
   * (handoff `600:75`). Se a conta for criada e o perfil falhar, a conta NÃO é
   * refeita numa nova tentativa: `criarPerfil` é idempotente e a etapa
   * pendente pode ser retomada.
   */
  criarConta: (dados: { nome: string; email: string; senha: string }) => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  initializing: true,
  isGuest: false,
  isSignedIn: false,
  perfil: null,
  papel: null,
  podeEditar: false,
  podeAdministrar: false,
  continueAsGuest: async () => {},
  criarConta: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [isGuest, setIsGuest] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [perfilLido, setPerfilLido] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(GUEST_KEY)
      .then((value) => setIsGuest(value === 'true'))
      .catch(() => {})
      .finally(() => setGuestReady(true));
  }, []);

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
    if (!user) return;

    return observarPerfil(user.uid, setPerfilLido);
  }, [user]);

  // Deriva em vez de limpar por efeito: assim o perfil de uma sessão anterior
  // nunca vaza para o usuário seguinte durante o intervalo entre os dois.
  const perfil = user && perfilLido?.uid === user.uid ? perfilLido : null;

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true);
    try {
      await AsyncStorage.setItem(GUEST_KEY, 'true');
    } catch {
      // Sem persistência o visitante segue nesta sessão e volta ao cadastro na próxima.
    }
  }, []);

  const criarConta = useCallback(
    async ({ nome, email, senha }: { nome: string; email: string; senha: string }) => {
      const credencial = await createUserWithEmailAndPassword(requireAuth(), email, senha);

      await updateProfile(credencial.user, { displayName: nome });
      await criarPerfil(credencial.user.uid, { nome, email });
      await sendEmailVerification(credencial.user);
    },
    [],
  );

  // Atalho de desenvolvimento: sem Firebase configurado não há perfil, então o
  // bypass também abre o painel — do contrário não haveria como vê-lo rodando.
  const papel: Papel | null = perfil?.papel ?? (authBypass ? 'administrador' : null);

  const value = useMemo<AuthState>(
    () => ({
      user,
      initializing: !authReady || !guestReady,
      isGuest,
      isSignedIn: authBypass || user !== null || isGuest,
      perfil,
      papel,
      podeEditar: podeEditarConteudo(papel),
      podeAdministrar: podeGerenciarUsuarios(papel),
      continueAsGuest,
      criarConta,
    }),
    [user, authReady, guestReady, isGuest, perfil, papel, continueAsGuest, criarConta],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export { isFirebaseConfigured };
