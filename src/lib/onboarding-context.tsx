import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Onboarding aparece uma única vez, logo depois do cadastro (com ou sem conta).
const ONBOARDING_KEY = 'pausa:onboarding-concluido';
const PREFERENCIAS_KEY = 'pausa:preferencias';

export type PreferenciasOnboarding = {
  nivel: string | null;
  interesses: string[];
};

type OnboardingState = {

  initializing: boolean;

  onboardingDone: boolean;

  finishOnboarding: (preferencias: PreferenciasOnboarding) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState>({
  initializing: true,
  onboardingDone: false,
  finishOnboarding: async () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setOnboardingDone(value === 'true'))
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  const finishOnboarding = useCallback(async (preferencias: PreferenciasOnboarding) => {
    setOnboardingDone(true);
    try {
      await AsyncStorage.multiSet([
        [PREFERENCIAS_KEY, JSON.stringify(preferencias)],
        [ONBOARDING_KEY, 'true'],
      ]);
    } catch {
      // Sem persistência o onboarding volta a aparecer na próxima abertura.
    }
  }, []);

  const value = useMemo<OnboardingState>(
    () => ({ initializing, onboardingDone, finishOnboarding }),
    [initializing, onboardingDone, finishOnboarding],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingState {
  return useContext(OnboardingContext);
}
