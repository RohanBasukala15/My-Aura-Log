/**
 * React Native persistence for Firebase Auth.
 * Augments firebase/auth with getReactNativePersistence and initializeAuth (RN bundle has these at runtime).
 * We re-export the base auth module so existing exports (Auth, signInWithCustomToken, etc.) remain available.
 */
declare module "firebase/auth" {
  import type { FirebaseApp } from "firebase/app";

  export * from "@firebase/auth";

  export interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }

  export interface Persistence {
    readonly type: string;
  }

  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence;

  export function initializeAuth(
    app: FirebaseApp,
    deps: { persistence: Persistence }
  ): import("@firebase/auth").Auth;
}
