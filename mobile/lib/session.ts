import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// No celular o token fica no armazenamento seguro do sistema (Keychain / Keystore).
// No navegador não existe esse cofre: fica no armazenamento local da página.
const TOKEN_KEY = "treinoai.token";
const USUARIO_KEY = "treinoai:usuario";

export type Usuario = { id: string; nome: string; email: string };

async function lerSeguro(chave: string): Promise<string | null> {
  return Platform.OS === "web" ? AsyncStorage.getItem(chave) : SecureStore.getItemAsync(chave);
}

async function gravarSeguro(chave: string, valor: string): Promise<void> {
  if (Platform.OS === "web") await AsyncStorage.setItem(chave, valor);
  else await SecureStore.setItemAsync(chave, valor);
}

async function apagarSeguro(chave: string): Promise<void> {
  if (Platform.OS === "web") await AsyncStorage.removeItem(chave);
  else await SecureStore.deleteItemAsync(chave);
}

export async function getToken(): Promise<string | null> {
  return lerSeguro(TOKEN_KEY);
}

export async function getUsuario(): Promise<Usuario | null> {
  const bruto = await AsyncStorage.getItem(USUARIO_KEY);
  try {
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}

export async function salvarSessao(token: string, usuario: Usuario): Promise<void> {
  await gravarSeguro(TOKEN_KEY, token);
  await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

/**
 * Chave do perfil de treino (altura, peso, objetivo...) de uma conta. Fica fora do prefixo
 * "treinoai" de propósito: sair da conta (ou o token vencer) não pode apagar o que o usuário
 * digitou; ao entrar de novo na mesma conta o perfil continua lá.
 */
export function chavePerfil(usuarioId: string | null): string {
  return `perfil:${usuarioId ?? "local"}`;
}

/**
 * Sai da conta e apaga os dados locais da sessão (último treino, cargas). O perfil da conta
 * é mantido, a não ser que a conta tenha sido excluída (`apagarPerfil`).
 */
export async function encerrarSessao({ apagarPerfil = false } = {}): Promise<void> {
  const usuario = apagarPerfil ? await getUsuario() : null;
  await apagarSeguro(TOKEN_KEY);
  const chaves = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(chaves.filter((chave) => chave.startsWith("treinoai")));
  if (usuario) await AsyncStorage.removeItem(chavePerfil(usuario.id));
}
