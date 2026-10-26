// Palavras que identificam cada objetivo no texto livre do usuário (sem acento, minúsculo).
// Espelha _PALAVRAS_OBJETIVO de backend/services/ia_service.py: o que o app aceita aqui é o
// que o backend (e a IA) reconhecem como objetivo.
const PALAVRAS_OBJETIVO = [
  "emagrec",
  "perder peso",
  "perda de peso",
  "gordura",
  "secar",
  "definir",
  "forca",
  "resist",
  "condicion",
  "cardio",
  "folego",
  "hipertrof",
  "massa",
  "musculo",
  "crescer",
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** "gere" -> false; "quero emagrecer" -> true; "Força" -> true. */
export function ehObjetivo(texto: string): boolean {
  const normal = semAcento(texto);
  return PALAVRAS_OBJETIVO.some((palavra) => normal.includes(palavra));
}
