import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, isFirebaseConfigured } from '@/lib/firebase';

const authBypass = __DEV__ && process.env.EXPO_PUBLIC_AUTH_BYPASS === 'true';

type AuthState = {

  user: User | null;

  initializing: boolean;

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
