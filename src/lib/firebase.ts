/**
 * PAUSA — Inicialização do Firebase
 *
 * As chaves do Firebase Web não são segredo: elas são embarcadas no app e
 * ficam visíveis para qualquer usuário. Quem protege os dados são as
 * Security Rules do Firestore (`firestore.rules`), não estas chaves.
 * Usamos variáveis de ambiente para trocar de projeto (dev/produção) sem
 * editar código.
 *
 * O módulo NÃO lança erro quando o .env está ausente. Isso é proposital:
 * permite trabalhar nas telas antes de o projeto Firebase existir. O acesso
 * ao Firestore passa por `requireDb()`, que aí sim falha com mensagem clara.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(env)
  .filter(([, value]) => !value)
  .map(([key]) => key);

/** `true` quando todas as variáveis EXPO_PUBLIC_FIREBASE_* estão preenchidas. */
export const isFirebaseConfigured = missing.length === 0;

if (!isFirebaseConfigured && __DEV__) {
  console.warn(
    `[PAUSA] Firebase não configurado — faltam: ${missing.join(', ')}.\n` +
      `O app roda, mas login e Firestore ficam indisponíveis.\n` +
      `Copie .env.example para .env e preencha com as credenciais do Console do Firebase ` +
      `(Configurações do projeto > Seus apps > Web > Configuração do SDK).`,
  );
}

/**
 * Sem `getReactNativePersistence`, a sessão vive só em memória e o usuário é
 * deslogado toda vez que fecha o app. `initializeAuth` só roda uma vez por
 * app; no Fast Refresh caímos no `getAuth` da instância já existente.
 */
function createAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

function init() {
  if (!isFirebaseConfigured) {
    return { app: null, auth: null, db: null };
  }
  // `getApps()` evita reinicializar a cada Fast Refresh.
  const app = getApps().length === 0 ? initializeApp(env as FirebaseOptions) : getApp();
  return { app, auth: createAuth(app), db: getFirestore(app) };
}

const services = init();

export const firebaseApp: FirebaseApp | null = services.app;
export const auth: Auth | null = services.auth;
export const db: Firestore | null = services.db;

const NOT_CONFIGURED =
  'Firebase não configurado. Crie o arquivo .env a partir de .env.example ' +
  'com as credenciais do seu projeto no Console do Firebase.';

/** Use nas telas que dependem de autenticação. Falha com mensagem clara. */
export function requireAuth(): Auth {
  if (!auth) throw new Error(NOT_CONFIGURED);
  return auth;
}

/** Use nas telas que leem ou escrevem no Firestore. Falha com mensagem clara. */
export function requireDb(): Firestore {
  if (!db) throw new Error(NOT_CONFIGURED);
  return db;
}
