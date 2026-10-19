import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

import { preferencias } from "@/lib/preferences";

// Sem vibração no navegador nem quando o usuário desligou nas Configurações
const ativa = () => Platform.OS !== "web" && preferencias().vibracao;

export const haptic = {
  light: () => {
    if (ativa()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  medium: () => {
    if (ativa()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  success: () => {
    if (ativa()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};
