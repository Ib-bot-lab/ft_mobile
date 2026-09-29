import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Base URL for the FashionTally backend.
 * Change this to your production URL before deploying.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://backend.fashiontally.com/api";

export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";

/** Save JWT + user object to AsyncStorage after login */
export async function saveSession(token: string, user: object): Promise<void> {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [AUTH_USER_KEY, JSON.stringify(user)],
  ]);
}

/** Clear JWT + user from AsyncStorage on logout */
export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}

/** Read the stored JWT */
export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

/** Read the stored user object */
export async function getStoredUser<T = unknown>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Thin fetch wrapper that automatically attaches the Bearer token.
 * Throws an Error whose message comes from the backend `error` field
 * when success === false.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = `${API_BASE_URL}${path}`;
  console.log("[apiFetch]", options.method ?? "GET", fullUrl);
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok || data.success === false) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data as T;
}
