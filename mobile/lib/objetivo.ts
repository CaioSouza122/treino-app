// Decide se o texto livre do chat é um objetivo de treino. Quem interpreta o pedido é a
// IA (ela recebe o texto como veio: "quero pular mais alto" vira um plano de potência);
// aqui só se barra o que claramente não é um objetivo, como "gere" ou "oi".

// Trechos (sem acento, minúsculo) que indicam um objetivo. Inclui os de
// _PALAVRAS_OBJETIVO em backend/services/ia_service.py, e mais partes do corpo,
// capacidades físicas e esportes.
const PALAVRAS_OBJETIVO = [
  // emagrecimento
  "emagrec", "perder peso", "perda de peso", "gordura", "secar", "definir", "definicao", "barriga", "magr",
  // força e potência
  "forca", "forte", "fortalec", "potencia", "explos", "pular", "salto", "saltar", "impuls",
  // resistência e condicionamento
  "resist", "condicion", "cardio", "folego", "corrida", "correr", "velocidade", "agilidade",
  "energia", "disposicao", "maratona",
  // hipertrofia
  "hipertrof", "massa", "musculo", "muscula", "crescer", "engordar", "ganhar peso", "tonific", "shape", "sarad",
  // saúde e mobilidade
  "saude", "postura", "mobilidade", "flexibilidade", "alongar", "alongamento", "equilibrio", "coluna", "joelho",
  // partes do corpo
  "perna", "gluteo", "bumbum", "braco", "biceps", "triceps", "peito", "costas", "ombro", "abdom", "abdomen",
  "panturrilha", "coxa", "quadril",
  // esportes
  "esporte", "futebol", "basquete", "volei", "luta", "jiu", "boxe", "natacao", "nadar", "ciclismo", "bike", "tenis",
];

// Começos de frase que expressam uma meta ("quero ...", "melhorar ..."), mesmo sem uma das
// palavras acima: exigem pelo menos mais uma palavra depois
const INTENCOES = [
  "quero", "queria", "gostaria", "preciso", "pretendo", "meu objetivo", "minha meta",
  "melhorar", "aumentar", "ganhar", "perder", "ficar", "treinar", "desenvolver", "evoluir",
  "reduzir", "diminuir", "manter", "voltar a", "ter mais", "conseguir",
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** "gere" -> false; "quero pular mais alto" -> true; "Força" -> true; "oi" -> false. */
export function ehObjetivo(texto: string): boolean {
  const normal = semAcento(texto);
  // O backend exige pelo menos 3 letras
  if (normal.length < 3) return false;
  if (PALAVRAS_OBJETIVO.some((palavra) => normal.includes(palavra))) return true;
  return INTENCOES.some(
    (intencao) => normal.startsWith(`${intencao} `) && normal.slice(intencao.length).trim().length >= 3,
  );
}
