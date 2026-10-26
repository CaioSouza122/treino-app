import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiCall } from "@/lib/_core/api";
import { chavePerfil, getUsuario } from "@/lib/session";

export type UserProfile = {
  name: string;
  altura: number;
  peso: number;
  idade: number;
  vezes_por_semana: number;
  objetivo: string;
  nivel: string;
  tempo: number;
};

// Chave antiga (global, apagada ao sair da conta): só lida uma vez para migrar o perfil
const PERFIL_ANTIGO_KEY = "treinoai:user-profile";

export const defaultProfile: UserProfile = {
  name: "Usuário",
  altura: 175,
  peso: 75,
  idade: 30,
  vezes_por_semana: 4,
  objetivo: "hipertrofia",
  nivel: "intermediario",
  tempo: 60,
};

/** O perfil é guardado por conta: quem entra de novo encontra os dados que já digitou. */
async function chaveAtual(): Promise<string> {
  return chavePerfil((await getUsuario())?.id ?? null);
}

function ler(raw: string): UserProfile | null {
  try {
    return { ...defaultProfile, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<UserProfile> {
  const chave = await chaveAtual();
  const raw = await AsyncStorage.getItem(chave);
  if (raw) return ler(raw) ?? defaultProfile;

  // Quem já usava o app antes: leva o perfil da chave antiga para a da conta
  const antigo = await AsyncStorage.getItem(PERFIL_ANTIGO_KEY);
  const migrado = antigo ? ler(antigo) : null;
  if (!migrado) return defaultProfile;
  await AsyncStorage.setItem(chave, JSON.stringify(migrado));
  await AsyncStorage.removeItem(PERFIL_ANTIGO_KEY);
  return migrado;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(await chaveAtual(), JSON.stringify(profile));
}

/** Guarda o perfil na conta (servidor): sobrevive a desinstalar o app e a trocar de celular. */
export async function enviarPerfil(profile: UserProfile): Promise<void> {
  const { name: _nome, ...dados } = profile;
  await apiCall<void>("/perfil", { method: "PUT", body: JSON.stringify(dados) });
}

/**
 * Ao entrar: se a conta já tem perfil no servidor, ele vale mais que o do aparelho (que pode
 * ser o padrão de uma instalação nova). Sem perfil no servidor, fica o que há no aparelho.
 * Falha de rede não impede o login: o app segue com os dados locais.
 */
export async function sincronizarPerfil(): Promise<void> {
  try {
    const remoto = await apiCall<Omit<UserProfile, "name"> | null>("/perfil");
    if (!remoto) return;
    await saveProfile({ ...(await getProfile()), ...remoto });
  } catch {
    // Sem rede ou servidor acordando: usa o perfil local
  }
}
