import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheObject {
  value: unknown;
  createdAt: number;
  cacheTimeout: number;
}

type ErrorCallback = (error?: Error | null) => void;

function prepareObject(value?: unknown, ignoreDataProcessing?: boolean): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (ignoreDataProcessing) {
    return value?.toString();
  }
  // eslint-disable-next-line no-useless-escape
  return typeof value === "string" ? `\"${value}\"` : JSON.stringify(value);
}

function prepareCached<I>(rawData: string | null, defaultValue?: I, ignoreDataProcessing?: boolean): I | null {
  if (rawData === null) {
    return null;
  }
  if (ignoreDataProcessing) {
    return (rawData ?? defaultValue) as I;
  }
  try {
    return JSON.parse(rawData);
  } catch (e) {
    return defaultValue ?? null;
  }
}

class Storage {
  public static getItem<I>(
    key: string,
    defaultValue: I | null = null,
    options?: { ignoreDataProcessing?: boolean }
  ): Promise<I | null> {
    return AsyncStorage.getItem(key).then((raw) => prepareCached(raw, defaultValue, options?.ignoreDataProcessing));
  }

  public static setItem(
    key: string,
    value: object | string | boolean | number | null | undefined,
    callback?: ErrorCallback,
    options?: { ignoreDataProcessing?: boolean }
  ): Promise<void> {
    return AsyncStorage.setItem(key, prepareObject(value, options?.ignoreDataProcessing), callback);
  }

  public static async setTimeoutItem<T>(
    key: string,
    value: T,
    cacheTimeout = 0,
    callback: ErrorCallback | undefined = undefined
  ): Promise<void> {
    const cacheObject: CacheObject = {
      value,
      cacheTimeout,
      createdAt: Date.now(),
    };
    return this.setItem(key, cacheObject, callback);
  }

  public static async getTimeoutItem<T>(key: string, shouldReturnExpired = false): Promise<T | null> {
    try {
      const cacheObject = await this.getItem<CacheObject>(key);
      const { cacheTimeout, createdAt, value } = cacheObject || {};
      if (cacheTimeout !== undefined && createdAt !== undefined) {
        if (shouldReturnExpired) {
          return value as T;
        }
        const now = Date.now();
        if (now - createdAt <= cacheTimeout) {
          return value as T;
        }
        // clear the expired item
        await AsyncStorage.removeItem(key);
        return null;
      }
      return (cacheObject?.value ?? cacheObject) as T;
    } catch (e) {
      return null;
    }
  }

  public static removeItem(key: string, callback?: ErrorCallback): Promise<void> {
    return AsyncStorage.removeItem(key, callback);
  }
}

class SecureStorage {
  public static isAvailable(): Promise<boolean> {
    return SecureStore.isAvailableAsync();
  }

  public static async getItem<I>(
    key: string,
    defaultValue: I | null = null,
    options: SecureStore.SecureStoreOptions = {}
  ): Promise<I | null> {
    const isAvailable = await SecureStorage.isAvailable();
    if (!isAvailable) {
      return Storage.getItem(key, defaultValue);
    }
    const raw = await SecureStore.getItemAsync(key, options);
    return prepareCached(raw, defaultValue);
  }

  public static async setItem(
    key: string,
    value: object | string | boolean | number | null | undefined,
    options: SecureStore.SecureStoreOptions = {}
  ): Promise<void> {
    const isAvailable = await SecureStorage.isAvailable();
    if (!isAvailable) {
      return Storage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, prepareObject(value), options);
  }

  public static async removeItem(key: string, options: SecureStore.SecureStoreOptions = {}): Promise<void> {
    const isAvailable = await SecureStorage.isAvailable();
    if (!isAvailable) {
      return Storage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key, options);
  }
}

export { Storage, SecureStorage };
