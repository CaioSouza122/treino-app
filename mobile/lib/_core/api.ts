// Cliente HTTP do backend FastAPI (EXPO_PUBLIC_API_BASE_URL).
import { router } from "expo-router";

import { encerrarSessao, getToken } from "@/lib/session";

// No Render, acordar o backend (~40s), acordar a API de IA (~30s) e gerar o treino (~25s)
// somam mais de 90s no primeiro pedido; o backend dá à IA até 110s, somadas as tentativas.
const TIMEOUT_MS = 150_000;

export function getApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
}

// FastAPI responde { detail: string | [{ msg }] }; a API Flask responde { erro } ou { erros_validacao }.
function extractErrorMessage(body: any): string | null {
  if (!body || typeof body !== "object") return null;
  const { detail } = body;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join("; ") || null;
  }
  return body.erro || body.error || body.mensagem || body.message || null;
}

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await apiRequest<T>(endpoint, options)).data;
}

// Falha de rede antes de a requisição sair (ex.: "Unable to resolve host" quando o celular
// troca de Wi-Fi para dados): o servidor não recebeu nada, então repetir é seguro.
const TENTATIVAS_DE_REDE = 3;
const PAUSA_REDE_MS = 3_000;

class SemRede extends Error {}

/** Como apiCall, mas devolve também os cabeçalhos (ex.: X-Motivo-Reserva). */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T; headers: Headers }> {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await requisitar<T>(endpoint, options);
    } catch (error) {
      if (!(error instanceof SemRede) || tentativa >= TENTATIVAS_DE_REDE) throw error;
      await new Promise((resolve) => setTimeout(resolve, PAUSA_REDE_MS));
    }
  }
}

async function requisitar<T>(endpoint: string, options: RequestInit): Promise<{ data: T; headers: Headers }> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...((options.headers as Record<string, string>) || {}),
        },
        signal: controller.signal,
      });
    } catch (error) {
      // O fetch rejeita sem resposta: offline, DNS ("Unable to resolve host"), URL errada.
      // O texto varia (TypeError no RN, "fetch failed: java.net..." no Android), então
      // qualquer rejeição sem timeout conta como falta de rede.
      if (controller.signal.aborted) throw error;
      throw new SemRede(
        baseUrl
          ? "Sem conexão com o servidor. Confira a internet do celular (Wi-Fi ou dados) e tente de novo."
          : "Não foi possível conectar à API (EXPO_PUBLIC_API_BASE_URL vazia).",
      );
    }

    const text = await response.text();
    // Token vencido ou inválido numa rota protegida: sai da conta e volta para o login.
    // (Em /auth/* o 401 é só "senha errada" e a tela de login mostra a mensagem.)
    if (response.status === 401 && token && !endpoint.startsWith("/auth/")) {
      await encerrarSessao();
      router.replace("/login");
    }
    if (!response.ok) {
      let message = text;
      try {
        message = extractErrorMessage(JSON.parse(text)) || text;
      } catch {
        // Corpo não é JSON: usa o texto como veio
      }
      throw new Error(message || `Erro ${response.status} ao chamar a API.`);
    }
    return { data: (text ? JSON.parse(text) : {}) as T, headers: response.headers };
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("O servidor demorou demais para responder. Tente novamente.");
    }
    throw error instanceof Error ? error : new Error("Erro desconhecido ao chamar a API.");
  } finally {
    clearTimeout(timer);
  }
}
