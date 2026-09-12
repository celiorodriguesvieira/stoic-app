/**
 * Estado de autenticação do PAUSA.
 *
 * `onAuthStateChanged` dispara uma primeira vez assim que o Firebase termina
 * de restaurar a sessão do AsyncStorage. Enquanto isso não acontece,
 * `initializing` fica `true` — sem esse estado, o app mostraria a tela de
 * login por um instante antes de reconhecer o usuário já logado.
 */

import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, isFirebaseConfigured } from '@/lib/firebase';

/**
 * Atalho de desenvolvimento: com EXPO_PUBLIC_AUTH_BYPASS=true no .env, o app
 * entra direto nas abas sem login. Serve para trabalhar nas telas antes de o
 * projeto Firebase existir. Nunca ativar em build de produção.
 */
const authBypass = __DEV__ && process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

type AuthState = {
  /** Usuário logado, ou `null` quando não há sessão. */
  user: User | null;
  /** `true` enquanto o Firebase restaura a sessão salva. */
  initializing: boolean;
  /** `true` quando há sessão válida — ou quando o bypass de dev está ativo. */
  isSignedIn: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  initializing: true,
  isSignedIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Sem Firebase configurado não há sessão a restaurar: liberamos a UI
    // imediatamente em vez de deixar o app preso na tela de carregamento.
    if (!auth) {
      setInitializing(false);
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, initializing, isSignedIn: authBypass || user !== null }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export { isFirebaseConfigured };
