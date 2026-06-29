import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const URL_KEY = 'krypt_gateway_url';
const TOKEN_KEY = 'krypt_gateway_token';

// expo-secure-store has no web implementation (there's no OS keychain to back
// it); skip persistence there instead of throwing on every call.
const SUPPORTED = Platform.OS !== 'web';

export type SavedConnection = { url: string; token: string };

export async function loadConnection(): Promise<SavedConnection | null> {
  if (!SUPPORTED) return null;
  const [url, token] = await Promise.all([
    SecureStore.getItemAsync(URL_KEY),
    SecureStore.getItemAsync(TOKEN_KEY),
  ]);
  if (!url || !token) return null;
  return { url, token };
}

export async function saveConnection(url: string, token: string): Promise<void> {
  if (!SUPPORTED) return;
  await Promise.all([SecureStore.setItemAsync(URL_KEY, url), SecureStore.setItemAsync(TOKEN_KEY, token)]);
}

export async function clearConnection(): Promise<void> {
  if (!SUPPORTED) return;
  await Promise.all([SecureStore.deleteItemAsync(URL_KEY), SecureStore.deleteItemAsync(TOKEN_KEY)]);
}
