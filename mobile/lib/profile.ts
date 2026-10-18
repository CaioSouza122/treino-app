import AsyncStorage from "@react-native-async-storage/async-storage";

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

const PROFILE_KEY = "treinoai:user-profile";

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

export async function getProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return defaultProfile;
  try {
    return { ...defaultProfile, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
