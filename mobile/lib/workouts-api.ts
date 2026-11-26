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

export type Conversa = { id: string; titulo: string; atualizado: number; mensagens: Mensagem[] };

// Prefixo "treinoai": sair da conta apaga as conversas junto com o resto da sessão
const CONVERSAS_KEY = "treinoai:conversas";
// Versão anterior guardava uma conversa só
const CONVERSA_ANTIGA_KEY = "treinoai:conversa";
const MAX_CONVERSAS = 30;
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

export function novaConversa(): Conversa {
  return { id: `c-${Date.now()}`, titulo: "Nova conversa", atualizado: Date.now(), mensagens: [] };
}

/** Conversas guardadas no aparelho, da mais recente para a mais antiga. */
export async function listarConversas(): Promise<Conversa[]> {
  try {
    const bruto = await AsyncStorage.getItem(CONVERSAS_KEY);
    if (bruto) return JSON.parse(bruto) as Conversa[];
    const antiga = JSON.parse((await AsyncStorage.getItem(CONVERSA_ANTIGA_KEY)) ?? "[]") as Mensagem[];
    return antiga.length ? [{ ...novaConversa(), titulo: tituloDe(antiga), mensagens: antiga }] : [];
  } catch {
    return [];
  }
}

function tituloDe(mensagens: Mensagem[]): string {
  const primeira = mensagens.find((m) => m.papel === "usuario")?.texto.trim() ?? "Nova conversa";
  return primeira.length > 48 ? `${primeira.slice(0, 47)}…` : primeira;
}

/** Grava a conversa (nova ou existente) no topo da lista e devolve a lista atualizada. */
export async function salvarConversa(conversa: Conversa): Promise<Conversa[]> {
  const atualizada: Conversa = {
    ...conversa,
    titulo: tituloDe(conversa.mensagens),
    atualizado: Date.now(),
    // Só o fim de cada conversa, para o armazenamento não crescer sem limite
    mensagens: conversa.mensagens.slice(-100),
  };
  const lista = [atualizada, ...(await listarConversas()).filter((c) => c.id !== conversa.id)].slice(0, MAX_CONVERSAS);
  await AsyncStorage.setItem(CONVERSAS_KEY, JSON.stringify(lista));
  await AsyncStorage.removeItem(CONVERSA_ANTIGA_KEY);
  return lista;
}

export async function apagarConversa(id: string): Promise<Conversa[]> {
  const lista = (await listarConversas()).filter((c) => c.id !== id);
  await AsyncStorage.setItem(CONVERSAS_KEY, JSON.stringify(lista));
  return lista;
}

/** No Render free o backend dorme: chamado ao abrir o app para ele acordar. Falhas são ignoradas. */
export function acordarServidores(): void {
  apiCall("/acordar").catch(() => {});
}

/** Histórico da conta logada (o backend identifica o usuário pelo token). */
export async function getWorkoutHistory(): Promise<Workout[]> {
  return apiCall<Workout[]>("/historico");
}
