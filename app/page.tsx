"use client"; 

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modoCadastro, setModoCadastro] = useState(false);
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [emailRecuperar, setEmailRecuperar] = useState("");

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senhaLimpa,
      });

      if (authError) {
        alert("Email ou senha incorretos.");
        setCarregando(false);
        return;
      }

      const { data: perfil, error: perfilError } = await supabase
        .from("usuarios")
        .select("id, nome, role")
        .ilike("email", emailLimpo)
        .maybeSingle();

      if (perfilError || !perfil) {
        alert("Perfil não encontrado. Contate o administrador.");
        setCarregando(false);
        return;
      }

      localStorage.setItem("usuario", JSON.stringify(perfil));
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCadastro || !emailCadastro || !senhaCadastro || !confirmarSenha) {
      alert("Preencha todos os campos.");
      return;
    }
    if (senhaCadastro !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }
    if (senhaCadastro.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      // Cria o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailCadastro.trim().toLowerCase(),
        password: senhaCadastro,
      });

      if (authError) throw authError;

      // Cria o perfil na tabela usuarios
      const { error: perfilError } = await supabase
        .from("usuarios")
        .insert([{
          nome: nomeCadastro.trim(),
          email: emailCadastro.trim().toLowerCase(),
          role: "gerente",
        }]);

      if (perfilError) throw perfilError;

      alert("Conta criada com sucesso! Agora faça login.");
      setModoCadastro(false);
      setNomeCadastro("");
      setEmailCadastro("");
      setSenhaCadastro("");
      setConfirmarSenha("");
    } catch (err: any) {
      alert("Erro ao criar conta: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRecuperar) {
      alert("Digite seu email.");
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailRecuperar.trim().toLowerCase(),
        { redirectTo: window.location.origin + "/reset-password" }
      );
      if (error) throw error;
      alert("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setModoRecuperar(false);
      setEmailRecuperar("");
    } catch (err: any) {
      alert("Erro ao enviar email de recuperação: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="h-28 w-28 relative rounded-full overflow-hidden border border-yellow-500/30 bg-black flex items-center justify-center mb-6">
            <Image src="/logo.png" alt="Logo" fill className="object-contain p-2" />
          </div>
          <h1 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter">Bar da Praça</h1>
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-2">Sistema de Gestão</p>
        </div>

        {/* Login */}
        {!modoCadastro && !modoRecuperar && (
          <form onSubmit={fazerLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Email de Acesso</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 transition-colors outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 transition-colors outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-4 bg-yellow-500 text-zinc-950 font-black py-4 rounded-2xl text-lg italic uppercase shadow-xl hover:bg-yellow-400 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {carregando ? "Entrando..." : "Entrar no Sistema"}
            </button>

            <div className="flex justify-between text-xs font-black uppercase mt-4">
              <button
                type="button"
                onClick={() => setModoRecuperar(true)}
                className="text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                Esqueci a senha
              </button>
              <button
                type="button"
                onClick={() => setModoCadastro(true)}
                className="text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                Criar conta (gerente)
              </button>
            </div>
          </form>
        )}

        {/* Cadastro de Gerente */}
        {modoCadastro && (
          <form onSubmit={criarConta} className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Nome do Gerente</label>
              <input
                type="text"
                value={nomeCadastro}
                onChange={(e) => setNomeCadastro(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Email</label>
              <input
                type="email"
                value={emailCadastro}
                onChange={(e) => setEmailCadastro(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Senha</label>
              <input
                type="password"
                value={senhaCadastro}
                onChange={(e) => setSenhaCadastro(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Confirmar Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite novamente"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-yellow-500 text-zinc-950 font-black py-4 rounded-2xl text-lg italic uppercase shadow-xl hover:bg-yellow-400 active:scale-95 transition-all"
            >
              {carregando ? "Criando..." : "Criar Conta"}
            </button>
            <button
              type="button"
              onClick={() => setModoCadastro(false)}
              className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase mt-2 transition-colors"
            >
              Voltar para o login
            </button>
          </form>
        )}

        {/* Recuperar senha */}
        {modoRecuperar && (
          <form onSubmit={recuperarSenha} className="space-y-4 animate-in fade-in">
            <div className="space-y-2">
              <label className="text-zinc-500 font-black uppercase text-[10px] ml-2 tracking-widest">Email cadastrado</label>
              <input
                type="email"
                value={emailRecuperar}
                onChange={(e) => setEmailRecuperar(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 h-14 rounded-2xl text-zinc-50 font-bold px-6 focus:border-yellow-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-yellow-500 text-zinc-950 font-black py-4 rounded-2xl text-lg italic uppercase shadow-xl hover:bg-yellow-400 active:scale-95 transition-all"
            >
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>
            <button
              type="button"
              onClick={() => setModoRecuperar(false)}
              className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-bold uppercase mt-2 transition-colors"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
