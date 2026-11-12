import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

/** Mantém a tela ligada (ex.: durante a geração ou o treino). Falhas são ignoradas. */
export function manterTelaAcesa(tag: string): void {
  activateKeepAwakeAsync(tag).catch(() => {});
}

/** Libera a tela. Lança se a tela nunca chegou a ficar acesa (no navegador), daí o try. */
export function liberarTela(tag: string): void {
  try {
    deactivateKeepAwake(tag).catch(() => {});
  } catch {}
}
