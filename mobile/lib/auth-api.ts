import { apiCall } from "@/lib/_core/api";
import { getProfile, saveProfile } from "@/lib/profile";
import { salvarSessao, type Usuario } from "@/lib/session";

type Sessao = { token: string; usuario: Usuario };

async function iniciar(sessao: Sessao): Promise<Usuario> {
  await salvarSessao(sessao.token, sessao.usuario);
  // O nome da conta aparece na saudação da tela inicial
  const perfil = await getProfile();
  await saveProfile({ ...perfil, name: sessao.usuario.nome });
  return sessao.usuario;
}

export async function entrar(email: string, senha: string): Promise<Usuario> {
  return iniciar(await apiCall<Sessao>("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }));
}

export async function criarConta(nome: string, email: string, senha: string): Promise<Usuario> {
  return iniciar(
    await apiCall<Sessao>("/auth/cadastro", { method: "POST", body: JSON.stringify({ nome, email, senha }) }),
  );
}
