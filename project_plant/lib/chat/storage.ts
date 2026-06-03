import * as SecureStore from "expo-secure-store";

const SECRET_KEY_KEY = "chat_secret_key";
const PUBLIC_KEY_KEY = "chat_public_key";

interface KeyPair {
  publicKey: string;
  secretKey: string;
}

export async function saveKeyPair(kp: KeyPair): Promise<void> {
  await SecureStore.setItemAsync(SECRET_KEY_KEY, kp.secretKey);
  await SecureStore.setItemAsync(PUBLIC_KEY_KEY, kp.publicKey);
}

export async function loadKeyPair(): Promise<KeyPair | null> {
  const secretKey = await SecureStore.getItemAsync(SECRET_KEY_KEY);
  const publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_KEY);
  if (!secretKey || !publicKey) return null;
  return { secretKey, publicKey };
}
