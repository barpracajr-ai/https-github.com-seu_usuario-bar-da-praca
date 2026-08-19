"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function CaixaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  // Dados do Caixa
  const [dataCaixa, setDataCaixa] = useState("");
  const [totalDinheiro, setTotalDinheiro] = useState(0);
  const [totalPix, setTotalPix] = useState(0);
  const [totalDebito, setTotalDebito] = useState(0);
  const [totalCredito, setTotalCredito] = useState(0);
  const [totalPerdas, setTotalPerdas] = useState(0);
  const [totalFiadosRecebidos, setTotalFiadosRecebidos] = useState(0);
  const [jaFechadoHoje, setJaFechadoHoje] = useState(false);
  const [fechando, setFechando] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (!user) {
      router.push("/");
      return;
    }
    const userData = JSON.parse(user);
    if (userData.role !== "gerente") {
      alert("Acesso restrito a gerentes.");
      router.push("/dashboard");
      return;
    }
    setUsuario(userData);
    carregarDadosCaixa();
  }, []);

  async function carregarDadosCaixa() {
    setCarregando(true);
    try {
      const hoje = new Date();
      const hojeStr = hoje.toISOString().split("T")[0];
      setDataCaixa(hoje.toLocaleDateString("pt-BR"));

      // 1. Verificar se o caixa de hoje já foi fechado
      const { data: fechamentoHoje } = await supabase
        .from("fechamentos_caixa")
        .select("id")
        .eq("data", hojeStr)
        .maybeSingle();
      
      if (fechamentoHoje) {
        setJaFechadoHoje(true);
      }

      // 2. Buscar as vendas de hoje
      const startDate = new Date(hoje);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(hoje);
      endDate.setHours(23, 59, 59, 999);

      const { data: vendas, error: errVendas } = await supabase
        .from("vendas")
        .select("*")
        .gte("data_venda", startDate.toISOString())
        .lte("data_venda", endDate.toISOString());

      if (errVendas) throw errVendas;

      let dinheiro = 0, pix = 0, debito = 0, credito = 0;
      let fiadosRecebidos = 0;

      (vendas || []).forEach((v) => {
        // Se a venda for de "Fiado Pago", adicionamos em uma categoria separada
        if (v.cliente_nome && v.cliente_nome.includes("Fiado Pago")) {
          fiadosRecebidos += Number(v.total_venda);
        } else if (v.pagamentos && Array.isArray(v.pagamentos)) {
          v.pagamentos.forEach((p: any) => {
            const valor = Number(p.valor) || 0;
            switch (p.metodo) {
              case "dinheiro": dinheiro += valor; break;
              case "pix": pix += valor; break;
              case "debito": debito += valor; break;
              case "credito": credito += valor; break;
            }
          });
        }
      });

      setTotalDinheiro(dinheiro);
      setTotalPix(pix);
      setTotalDebito(debito);
      setTotalCredito(credito);
      setTotalFiadosRecebidos(fiadosRecebidos);

      // 3. Buscar as perdas de hoje
      const { data: perdas, error: errPerdas } = await supabase
        .from("perdas")
        .select("custo_perda")
        .gte("data_perda", startDate.toISOString())
        .lte("data_perda", endDate.toISOString());

      if (errPerdas) throw errPerdas;

      const totalPerdasDia = (perdas || []).reduce((acc, p) => acc + Number(p.custo_perda), 0);
      setTotalPerdas(totalPerdasDia);

    } catch (err: any) {
      alert("Erro ao carregar dados do caixa: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function fecharCaixa() {
    if (jaFechadoHoje) {
      alert("O caixa de hoje já foi fechado anteriormente.");
      return;
    }

    if (!confirm("Deseja realmente fechar o caixa do dia " + dataCaixa + "? Esta ação não poderá ser desfeita.")) return;

    setFechando(true);
    try {
      const totalGeral = totalDinheiro + totalPix + totalDebito + totalCredito + totalFiadosRecebidos;

      const { error } = await supabase.from("fechamentos_caixa").insert([{
        data: new Date().toISOString().split("T")[0],
        usuario_id: usuario.id,
        total_dinheiro: totalDinheiro,
        total_pix: totalPix,
        total_debito: totalDebito,
        total_credito: totalCredito,
        total_perdas: totalPerdas,
        total_fiados_recebidos: totalFiadosRecebidos,
        total_geral: totalGeral,
      }]);

      if (error) throw error;

      alert("Caixa fechado com sucesso! O registro foi salvo.");
      setJaFechadoHoje(true);
    } catch (err: any) {
      alert("Erro ao fechar o caixa: " + err.message);
    } finally {
      setFechando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-yellow-500 text-2xl font-black">Carregando dados do caixa...</p>
      </div>
    );
  }

  const totalVendas = totalDinheiro + totalPix + totalDebito + totalCredito;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-yellow-500 uppercase italic">Fechamento de Caixa</h1>
            <p className="text-zinc-400 text-sm font-bold uppercase">Data: {dataCaixa}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-2xl font-black text-sm transition-all"
          >
            ⬅ Voltar ao Salão
          </button>
        </div>

        {/* Informações do Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-black text-zinc-300 uppercase mb-4 border-b border-zinc-800 pb-2">Resumo das Vendas (Por Forma de Pagamento)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] font-black uppercase">Dinheiro</p>
                <p className="text-2xl font-black text-green-400">R$ {totalDinheiro.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] font-black uppercase">PIX</p>
                <p className="text-2xl font-black text-emerald-400">R$ {totalPix.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] font-black uppercase">Débito</p>
                <p className="text-2xl font-black text-blue-400">R$ {totalDebito.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                <p className="text-zinc-500 text-[10px] font-black uppercase">Crédito</p>
                <p className="text-2xl font-black text-purple-400">R$ {totalCredito.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <p className="text-zinc-500 text-[10px] font-black uppercase">Total de Vendas (Bruto)</p>
            <p className="text-3xl font-black text-yellow-500">R$ {totalVendas.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/20 shadow-lg shadow-red-500/5">
            <p className="text-zinc-500 text-[10px] font-black uppercase">Total de Perdas</p>
            <p className="text-3xl font-black text-red-500">R$ {totalPerdas.toFixed(2)}</p>
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-orange-500/20 shadow-lg shadow-orange-500/5">
            <p className="text-zinc-500 text-[10px] font-black uppercase">Recebido de Fiados</p>
            <p className="text-3xl font-black text-orange-400">R$ {totalFiadosRecebidos.toFixed(2)}</p>
          </div>
        </div>

        {/* Botão de Fechamento */}
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-zinc-800">
          {jaFechadoHoje ? (
            <p className="text-green-500 font-black text-lg italic">✅ Caixa já foi fechado hoje.</p>
          ) : (
            <button
              onClick={fecharCaixa}
              disabled={fechando}
              className="w-full max-w-md bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-2xl text-2xl uppercase italic transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fechando ? "Fechando..." : "🔒 Fechar Caixa Agora"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}