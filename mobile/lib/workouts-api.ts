import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiCall } from "@/lib/_core/api";

export type WorkoutDay = {
  dia: string;
  foco: string;
  exercicios: string;
};

export type Workout = {
  id: string;
  user_id: string;
  created_at: string;
  days: WorkoutDay[];
};

export type Mensagem = {
  id: string;
  papel: "usuario" | "ia";
  texto: string;
  /** Plano salvo no histórico quando a resposta da IA trouxe um treino. */
  treinoId?: string;
  /** Resposta de erro (IA fora do ar, sem internet): não vai de volta para a IA. */
  erro?: boolean;
};

// Prefixo "treinoai": sair da conta apaga a conversa junto com o resto da sessão
const CONVERSA_KEY = "treinoai:conversa";
// O backend só usa as últimas mensagens como contexto
const CONTEXTO = 20;

/** Envia a conversa e devolve a resposta do Coach IA. */
export async function conversar(
  conversa: Mensagem[],
): Promise<{ resposta: string; treino_id: string | null }> {
  const mensagens = conversa
    .filter((m) => !m.erro)
    .slice(-CONTEXTO)
    .map(({ papel, texto }) => ({ papel, texto }));
  return apiCall("/chat", { method: "POST", body: JSON.stringify({ mensagens }) });
}

export async function lerConversa(): Promise<Mensagem[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CONVERSA_KEY)) ?? "[]") as Mensagem[];
  } catch {
    return [];
  }
}

export async function salvarConversa(conversa: Mensagem[]): Promise<void> {
  // Guarda só o fim da conversa para o armazenamento não crescer sem limite
  await AsyncStorage.setItem(CONVERSA_KEY, JSON.stringify(conversa.slice(-100)));
}

/** No Render free o backend dorme: chamado ao abrir o app para ele acordar. Falhas são ignoradas. */
export function acordarServidores(): void {
  apiCall("/acordar").catch(() => {});
}

/** Histórico da conta logada (o backend identifica o usuário pelo token). */
export async function getWorkoutHistory(): Promise<Workout[]> {
  return apiCall<Workout[]>("/historico");
}
