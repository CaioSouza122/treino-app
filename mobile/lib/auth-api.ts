import { apiCall } from "@/lib/_core/api";
import { getProfile, saveProfile, sincronizarPerfil } from "@/lib/profile";
import { encerrarSessao, getToken, salvarSessao, type Usuario } from "@/lib/session";

type Sessao = { token: string; usuario: Usuario };

async function iniciar(sessao: Sessao): Promise<Usuario> {
  await salvarSessao(sessao.token, sessao.usuario);
  // Traz o perfil da conta (altura, peso, objetivo...) antes de qualquer tela pedir os dados
  await sincronizarPerfil();
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

export async function atualizarNome(nome: string): Promise<Usuario> {
  const usuario = await apiCall<Usuario>("/auth/me", { method: "PATCH", body: JSON.stringify({ nome }) });
  const token = await getToken();
  if (token) await salvarSessao(token, usuario);
  const perfil = await getProfile();
  await saveProfile({ ...perfil, name: usuario.nome });
  return usuario;
}

export async function trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  await apiCall<void>("/auth/senha", {
    method: "POST",
    body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
  });
}

/** Apaga a conta no servidor e encerra a sessão neste aparelho. */
export async function excluirConta(senha: string): Promise<void> {
  await apiCall<void>("/auth/conta", { method: "DELETE", body: JSON.stringify({ senha }) });
  await encerrarSessao({ apagarPerfil: true });
}
