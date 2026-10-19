import AsyncStorage from "@react-native-async-storage/async-storage";

// Preferências do aparelho. A chave fica fora do prefixo "treinoai" de propósito:
// sair da conta apaga os dados do usuário, mas não as preferências do aparelho.
const KEY = "app:preferencias";

export type Preferencias = {
  /** Vibração ao tocar em botões e concluir exercícios. */
  vibracao: boolean;
  /** Impede a tela de apagar enquanto o treino está aberto. */
  telaLigada: boolean;
};

const PADRAO: Preferencias = { vibracao: true, telaLigada: true };

// Cópia em memória: a vibração é lida a cada toque e não pode esperar o AsyncStorage
let atuais: Preferencias = PADRAO;

export function preferencias(): Preferencias {
  return atuais;
}

export async function carregarPreferencias(): Promise<Preferencias> {
  try {
    const bruto = await AsyncStorage.getItem(KEY);
    atuais = { ...PADRAO, ...(bruto ? (JSON.parse(bruto) as Partial<Preferencias>) : {}) };
  } catch {
    atuais = PADRAO;
  }
  return atuais;
}

export async function salvarPreferencia<K extends keyof Preferencias>(chave: K, valor: Preferencias[K]): Promise<Preferencias> {
  atuais = { ...atuais, [chave]: valor };
  await AsyncStorage.setItem(KEY, JSON.stringify(atuais));
  return atuais;
}
