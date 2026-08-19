"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Relatorios() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "ano">("dia");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [vendas, setVendas] = useState<any[]>([]);
  const [perdas, setPerdas] = useState<any[]>([]);
  const [fiados, setFiados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    faturamento: 0,
    lucro: 0,
    totalPerdas: 0,
    margem: 0,
  });

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
    carregarDados();
  }, [periodo]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const hoje = new Date();
      let start: Date, end: Date;

      switch (periodo) {
        case "dia":
          start = new Date(hoje);
          start.setHours(0, 0, 0, 0);
          end = new Date(hoje);
          end.setHours(23, 59, 59, 999);
          break;
        case "semana":
          start = new Date(hoje);
          start.setDate(hoje.getDate() - 7);
          end = new Date(hoje);
          break;
        case "mes":
          start = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          end = new Date(hoje);
          break;
        case "ano":
          start = new Date(hoje.getFullYear(), 0, 1);
          end = new Date(hoje);
          break;
        default:
          start = new Date(hoje);
          start.setHours(0, 0, 0, 0);
          end = new Date(hoje);
      }

      // Busca vendas
      const { data: vendasData, error: errVendas } = await supabase
        .from("vendas")
        .select("*")
        .gte("data_venda", start.toISOString())
        .lte("data_venda", end.toISOString())
        .order("data_venda", { ascending: false });

      if (errVendas) throw errVendas;
      setVendas(vendasData || []);

      // Busca perdas
      const { data: perdasData, error: errPerdas } = await supabase
        .from("perdas")
        .select("*")
        .gte("data_perda", start.toISOString())
        .lte("data_perda", end.toISOString())
        .order("data_perda", { ascending: false });

      if (errPerdas) throw errPerdas;
      setPerdas(perdasData || []);

      // Busca fiados (todos)
      const { data: fiadosData, error: errFiados } = await supabase
        .from("fiados")
        .select("*")
        .order("data_criacao", { ascending: false });

      if (errFiados) throw errFiados;
      setFiados(fiadosData || []);

      // Busca clientes (todos)
      const { data: clientesData, error: errClientes } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });

      if (errClientes) throw errClientes;
      setClientes(clientesData || []);

      // Métricas
      const faturamento = vendasData?.reduce((acc, v) => acc + Number(v.total_venda || 0), 0) || 0;
      const lucro = vendasData?.reduce((acc, v) => acc + Number(v.lucro_total || 0), 0) || 0;
      const totalPerdas = perdasData?.reduce((acc, p) => acc + Number(p.custo_perda || 0), 0) || 0;
      const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

      setMetricas({ faturamento, lucro, totalPerdas, margem });
    } catch (err: any) {
      alert("Erro ao carregar dados: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  // ========== FUNÇÕES DE EXPORTAÇÃO CSV ==========
  function formatarDataISO(dataISO: string): string {
    if (!dataISO) return "";
    const d = new Date(dataISO);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatarDataHora(dataISO: string): string {
    if (!dataISO) return "";
    const d = new Date(dataISO);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function downloadCSV(filename: string, rows: any[], headers: string[], columnMap: Record<string, string>, formatadores?: Record<string, (val: any) => string>) {
    if (!rows || rows.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const linhas = rows.map(row => {
      return headers.map(header => {
        const key = columnMap[header];
        let value = row[key];
        if (value === undefined || value === null) value = '';
        
        if (formatadores && formatadores[header]) {
          value = formatadores[header](value);
        }
        
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        if (typeof value === 'number') {
          value = value.toFixed(2).replace('.', ',');
        }
        
        if (typeof value === 'string') {
          value = value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          if (value.includes(';') || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
        }
        return value;
      }).join(';');
    });

    const headerLine = headers.join(';');
    const csvContent = `${headerLine}\n${linhas.join('\n')}`;

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportarVendas() {
    const headers = ['Data', 'Cliente', 'Mesa', 'Total (R$)', 'Lucro (R$)'];
    const columnMap: Record<string, string> = {
      'Data': 'data_venda',
      'Cliente': 'cliente_nome',
      'Mesa': 'mesa_numero',
      'Total (R$)': 'total_venda',
      'Lucro (R$)': 'lucro_total',
    };
    const formatadores: Record<string, (val: any) => string> = {
      'Data': (v) => formatarDataHora(v),
      'Total (R$)': (v) => Number(v).toFixed(2).replace('.', ','),
      'Lucro (R$)': (v) => Number(v).toFixed(2).replace('.', ','),
    };
    downloadCSV(`vendas_${periodo}`, vendas, headers, columnMap, formatadores);
  }

  function exportarPerdas() {
    const headers = ['Data', 'Insumo', 'Quantidade', 'Custo (R$)'];
    const columnMap: Record<string, string> = {
      'Data': 'data_perda',
      'Insumo': 'nome_insumo',
      'Quantidade': 'quantidade',
      'Custo (R$)': 'custo_perda',
    };
    const formatadores: Record<string, (val: any) => string> = {
      'Data': (v) => formatarDataISO(v),
      'Custo (R$)': (v) => Number(v).toFixed(2).replace('.', ','),
    };
    downloadCSV(`perdas_${periodo}`, perdas, headers, columnMap, formatadores);
  }

  function exportarFiados() {
    const headers = ['Cliente', 'Data', 'Total (R$)'];
    const columnMap: Record<string, string> = {
      'Cliente': 'cliente_nome',
      'Data': 'data_criacao',
      'Total (R$)': 'total',
    };
    const formatadores: Record<string, (val: any) => string> = {
      'Data': (v) => formatarDataISO(v),
      'Total (R$)': (v) => Number(v).toFixed(2).replace('.', ','),
    };
    downloadCSV('fiados', fiados, headers, columnMap, formatadores);
  }

  function exportarClientes() {
    const headers = ['Nome', 'Telefone', 'Email', 'Nascimento', 'Data Cadastro'];
    const columnMap: Record<string, string> = {
      'Nome': 'nome',
      'Telefone': 'telefone',
      'Email': 'email',
      'Nascimento': 'data_nascimento',
      'Data Cadastro': 'created_at',
    };
    const formatadores: Record<string, (val: any) => string> = {
      'Nascimento': (v) => v ? formatarDataISO(v) : '',
      'Data Cadastro': (v) => v ? formatarDataISO(v) : '',
    };
    downloadCSV('clientes', clientes, headers, columnMap, formatadores);
  }

  // ========== FUNÇÃO WHATSAPP BOAS-VINDAS COM PROMPT ==========
  const enviarWhatsAppBoasVindas = () => {
    const numero = prompt("Digite o número do cliente para enviar as boas-vindas (apenas números, ex: 11997814149):");
    if (!numero) {
      alert("Número não informado, envio cancelado.");
      return;
    }

    const mensagem = `E aí! Tudo bem com você? 🍻🥳 \n\nSua presença aqui no Bar da Praça já é motivo pra festa! Ficamos muito felizes em ter você conosco. Pode ficar à vontade, a casa é sua! \n\nQualquer coisa, é só chamar a gente. Um grande abraço! 👋✨`;
    const link = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
  };

  // Dados para o gráfico
  const dadosGrafico = () => {
    const mapa = new Map<string, { data: string; vendas: number; perdas: number }>();

    vendas.forEach((v) => {
      const d = new Date(v.data_venda);
      const key = periodo === "dia" ? d.toLocaleTimeString() : d.toLocaleDateString();
      if (!mapa.has(key)) {
        mapa.set(key, { data: key, vendas: 0, perdas: 0 });
      }
      mapa.get(key)!.vendas += Number(v.total_venda || 0);
    });

    perdas.forEach((p) => {
      const d = new Date(p.data_perda);
      const key = periodo === "dia" ? d.toLocaleTimeString() : d.toLocaleDateString();
      if (!mapa.has(key)) {
        mapa.set(key, { data: key, vendas: 0, perdas: 0 });
      }
      mapa.get(key)!.perdas += Number(p.custo_perda || 0);
    });

    return Array.from(mapa.values()).sort((a, b) => a.data.localeCompare(b.data));
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-yellow-500 text-2xl font-black">Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 relative rounded-full overflow-hidden border border-yellow-500/30 bg-black">
            <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
          </div>
          <h1 className="text-2xl font-black text-yellow-500 uppercase italic">Relatórios</h1>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-3 rounded-2xl font-black text-sm transition-all"
        >
          ⬅ Voltar ao Salão
        </button>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
        <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
          {["dia", "semana", "mes", "ano"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p as any)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                periodo === p
                  ? "bg-yellow-500 text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {p === "dia" ? "Hoje" : p === "semana" ? "Últimos 7 dias" : p === "mes" ? "Este mês" : "Este ano"}
            </button>
          ))}
        </div>
        <button
          onClick={carregarDados}
          className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-xl font-black text-xs hover:bg-yellow-500/30 transition-all"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Botão do WhatsApp (Apenas Boas-Vindas agora) */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={enviarWhatsAppBoasVindas}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2"
        >
          📱 Enviar Boas-Vindas
        </button>
      </div>

      {/* Botões de Exportação CSV */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={exportarVendas}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2"
        >
          📥 Exportar Vendas
        </button>
        <button
          onClick={exportarPerdas}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2"
        >
          📥 Exportar Perdas
        </button>
        <button
          onClick={exportarFiados}
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2"
        >
          📥 Exportar Fiados
        </button>
        <button
          onClick={exportarClientes}
          className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl font-black text-xs uppercase transition-all shadow-lg flex items-center gap-2"
        >
          📥 Exportar Clientes
        </button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase">Faturamento</p>
          <p className="text-3xl font-black text-yellow-500">R$ {metricas.faturamento.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase">Lucro Estimado</p>
          <p className="text-3xl font-black text-green-500">R$ {metricas.lucro.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase">Margem</p>
          <p className="text-3xl font-black text-blue-400">{metricas.margem.toFixed(1)}%</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <p className="text-zinc-500 text-[10px] font-black uppercase">Perdas</p>
          <p className="text-3xl font-black text-red-500">R$ {metricas.totalPerdas.toFixed(2)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 mb-8 h-80">
        <h3 className="text-lg font-black text-zinc-300 uppercase mb-4">Evolução</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dadosGrafico()}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPerdas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="data" stroke="#71717a" fontSize={10} tick={{ fill: "#71717a" }} />
            <YAxis stroke="#71717a" fontSize={10} tick={{ fill: "#71717a" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "none",
                borderRadius: "0.75rem",
                color: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="#eab308"
              fill="url(#colorVendas)"
              strokeWidth={3}
              name="Vendas"
            />
            <Area
              type="monotone"
              dataKey="perdas"
              stroke="#ef4444"
              fill="url(#colorPerdas)"
              strokeWidth={2}
              name="Perdas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de vendas recentes */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <h3 className="p-6 text-lg font-black text-zinc-300 uppercase border-b border-zinc-800">
          Últimas vendas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase border-b border-zinc-800">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Mesa</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {vendas.slice(0, 20).map((v, idx) => (
                <tr key={idx} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 text-zinc-400 text-xs">
                    {formatarDataHora(v.data_venda)}
                  </td>
                  <td className="p-4 text-zinc-200 uppercase font-bold">{v.cliente_nome || "Consumidor"}</td>
                  <td className="p-4 text-zinc-400">{v.mesa_numero || "Avulso"}</td>
                  <td className="p-4 text-right text-yellow-500 font-black">R$ {Number(v.total_venda).toFixed(2)}</td>
                  <td className="p-4 text-right text-green-500 font-black">R$ {Number(v.lucro_total).toFixed(2)}</td>
                </tr>
              ))}
              {vendas.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-bold uppercase text-sm">
                    Nenhuma venda no período
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}