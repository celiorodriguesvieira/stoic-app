/**
 * Augmentation de tipos para `firebase/auth`.
 *
 * PORQUÊ: o `exports` do pacote @firebase/auth declara a chave `"types"`
 * apontando para `auth-public.d.ts` ANTES das condições de plataforma. O
 * TypeScript casa com a primeira chave e nunca chega na condição
 * `react-native` — mesmo com `customConditions: ["react-native"]` no
 * tsconfig do Expo. Resultado: `getReactNativePersistence` existe no bundle
 * que o Metro carrega (`dist/rn/index.rn.js`), mas não nos tipos.
 *
 * Esta declaração reexpõe a função com a assinatura real de
 * `dist/index.rn.d.ts`. Remover quando o Firebase corrigir o exports map.
 *
 * Referência: https://github.com/firebase/firebase-js-sdk/issues/7615
 */

import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  /** Subconjunto de AsyncStorage que o Firebase realmente usa. */
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
