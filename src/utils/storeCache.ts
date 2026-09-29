import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Read a JSON value from AsyncStorage.
 * Returns null if the key doesn't exist or parsing fails.
 */
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a JSON value to AsyncStorage. Silently ignores storage errors.
 */
export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently ignore
  }
}
