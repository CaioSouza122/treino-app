// Cliente HTTP do backend FastAPI (EXPO_PUBLIC_API_BASE_URL).

// Render acorda o serviço em ~20s e o Gemini leva outros ~20s para gerar o treino
const TIMEOUT_MS = 90_000;

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
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      let message = text;
      try {
        message = extractErrorMessage(JSON.parse(text)) || text;
      } catch {
        // Corpo não é JSON: usa o texto como veio
      }
      throw new Error(message || `Erro ${response.status} ao chamar a API.`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("O servidor demorou demais para responder. Tente novamente.");
    }
    // fetch rejeita com TypeError quando não alcança o servidor (URL errada, offline, CORS)
    if (error instanceof TypeError) {
      throw new Error(`Não foi possível conectar à API em ${baseUrl || "(EXPO_PUBLIC_API_BASE_URL vazia)"}.`);
    }
    throw error instanceof Error ? error : new Error("Erro desconhecido ao chamar a API.");
  } finally {
    clearTimeout(timer);
  }
}
