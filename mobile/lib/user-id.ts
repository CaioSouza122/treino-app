import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "treinoai:user-id";

let cached: string | null = null;

function randomId(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  // Fallback sem crypto nativo: 128 bits aleatórios em hexadecimal
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, "0")).join("-");
}

/**
 * ID anônimo deste aparelho, usado para separar o histórico de treinos no backend.
 * EXPO_PUBLIC_TREINO_USER_ID força um ID fixo (útil só em desenvolvimento).
 */
export async function getUserId(): Promise<string> {
  const fixed = process.env.EXPO_PUBLIC_TREINO_USER_ID;
  if (fixed) return fixed;
  if (cached) return cached;

  const stored = await AsyncStorage.getItem(USER_ID_KEY);
  if (stored) {
    cached = stored;
    return stored;
  }

  const created = randomId();
  await AsyncStorage.setItem(USER_ID_KEY, created);
  cached = created;
  return created;
}
