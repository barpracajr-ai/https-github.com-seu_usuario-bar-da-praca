"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ComandaTermica from "@/components/ComandaTermica";

function tocarSomAlerta() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.5;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 880;
      gain2.gain.value = 0.5;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.15);
    }, 250);
  } catch (e) {}
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [mesas, setMesas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [pedidosCozinha, setPedidosCozinha] = useState<any[]>([]);
  const [fiados, setFiados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [garcons, setGarcons] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  const [processando, setProcessando] = useState(false);

  // Estados dos modais principais
  const [modalAberto, setModalAberto] = useState(false);
  const [numeroMesa, setNumeroMesa] = useState("");
  const [clienteMesa, setClienteMesa] = useState("");
  const [fichaAberta, setFichaAberta] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState<any>(null);
  const [cardapioAberto, setCardapioAberto] = useState(false);
  const [pedidoAtual, setPedidoAtual] = useState<any[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [cozinhaAberta, setCozinhaAberta] = useState(false);

  // Estados de Juntar Mesas
  const [modalJuntarAberto, setModalJuntarAberto] = useState(false);
  const [mesaParaJuntar, setMesaParaJuntar] = useState("");

  // Estados do checkout
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([
    { id: 1, metodo: "dinheiro", valor: 0, clienteFiado: "" },
  ]);
  const [totalPago, setTotalPago] = useState(0);
  const [saldoRestante, setSaldoRestante] = useState(0);
  const [troco, setTroco] = useState(0);
  const [fiadoAutomatico, setFiadoAutomatico] = useState(false);
  const [clienteNomeFiado, setClienteNomeFiado] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [dividirIgual, setDividirIgual] = useState(false);

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaClienteModal, setBuscaClienteModal] = useState(""); 
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteForm, setNovoClienteForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_nascimento: "",
  });
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([]);

  // Estados do gerenciador de fiados
  const [fiadosAberto, setFiadosAberto] = useState(false);
  const [fiadoSelecionado, setFiadoSelecionado] = useState<any>(null);
  const [itensSelecionadosFiado, setItensSelecionadosFiado] = useState<number[]>([]);
  const [pagamentosFiado, setPagamentosFiado] = useState<any[]>([
    { id: 1, metodo: "dinheiro", valor: 0 },
  ]);
  const [fiadoModalAberto, setFiadoModalAberto] = useState(false);
  const [valorPagamentoFiado, setValorPagamentoFiado] = useState(0);

  // Estados para impressão
  const [comandaAberta, setComandaAberta] = useState(false);
  const [dadosComanda, setDadosComanda] = useState<any>(null);

  // Estados para gerenciamento de estoque
  const [estoqueAberto, setEstoqueAberto] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState<any>(null);
  const [formInsumo, setFormInsumo] = useState({
    nome: "",
    unidade: "UN",
    estoque: "",
    custo_unidade: "",
  });
  const [modalInsumoAberto, setModalInsumoAberto] = useState(false);

  // Estados para gerenciamento de produtos
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<any>(null);
  const [formProduto, setFormProduto] = useState({
    nome: "",
    categoria: "Bebidas",
    preco: "",
  });
  const [receitaTemp, setReceitaTemp] = useState<any[]>([]);
  const [ingredienteTemp, setIngredienteTemp] = useState({ insumo_id: "", qtd: "" });

  // Estados para adicionar garçom
  const [modalGarcomAberto, setModalGarcomAberto] = useState(false);
  const [modalGarcomFormAberto, setModalGarcomFormAberto] = useState(false); 
  const [formGarcom, setFormGarcom] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  // Estados para gerenciamento de clientes
  const [modalClientesAberto, setModalClientesAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [formCliente, setFormCliente] = useState({
    nome: "",
    telefone: "",
    email: "",
    data_nascimento: "",
  });
  const [modalClienteFormAberto, setModalClienteFormAberto] = useState(false);

  // Estado para aniversariantes
  const [modalAniversariantesAberto, setModalAniversariantesAberto] = useState(false);
  const [mesAniversario, setMesAniversario] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (!user) {
      router.push("/");
      return;
    }
    try {
      setUsuario(JSON.parse(user));
    } catch (e) {
      localStorage.removeItem("usuario");
      router.push("/");
      return;
    }
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: mesasData, error: errMesas } = await supabase.from("mesas").select("*").eq("status", "ocupada").order("numero", { ascending: true });
      if (errMesas) throw new Error(errMesas.message);
      setMesas(mesasData || []);

      const { data: produtosData, error: errProdutos } = await supabase.from("produtos").select("*").order("nome");
      if (errProdutos) throw new Error(errProdutos.message);
      setProdutos(produtosData || []);

      const { data: insumosData, error: errInsumos } = await supabase.from("insumos").select("*").order("nome");
      if (errInsumos) throw new Error(errInsumos.message);
      setInsumos(insumosData || []);

      const { data: cozinhaData, error: errCozinha } = await supabase.from("pedidos_cozinha").select("*").order("created_at", { ascending: true });
      if (errCozinha) throw new Error(errCozinha.message);
      setPedidosCozinha(cozinhaData || []);

      const { data: fiadosData, error: errFiados } = await supabase.from("fiados").select("*").order("data_criacao", { ascending: false });
      if (errFiados) throw new Error(errFiados.message);
      setFiados(fiadosData || []);

      const { data: clientesData, error: errClientes } = await supabase.from("clientes").select("*").order("nome", { ascending: true });
      if (errClientes) throw new Error(errClientes.message);
      setClientes(clientesData || []);
      setClientesFiltrados(clientesData || []);

      const { data: garconsData, error: errGarcons } = await supabase.from("usuarios").select("*").eq("role", "colaborador").order("nome", { ascending: true });
      if (errGarcons) throw new Error(errGarcons.message);
      setGarcons(garconsData || []);

    } catch (err: any) {
      alert("Erro ao carregar dados: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  // ========== REALTIME SSOT ==========
  useEffect(() => {
    if (!usuario) return;

    const canal = supabase
      .channel("bar-praca-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mesas" }, (payload) => {
          setMesas((prev) => {
            const map = new Map((prev || []).map(m => [String(m.id), m]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (payload.new.status === 'ocupada') {
                map.set(String(payload.new.id), payload.new);
              } else {
                map.delete(String(payload.new.id));
              }
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            return Array.from(map.values()).sort((a, b) => (Number(a.numero) || 0) - (Number(b.numero) || 0));
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_cozinha" }, (payload) => {
          setPedidosCozinha((prev) => {
            const map = new Map((prev || []).map(p => [String(p.id), p]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              if (payload.eventType === 'INSERT' && !map.has(String(payload.new.id)) && usuario.role === "gerente") {
                tocarSomAlerta();
              }
              map.set(String(payload.new.id), payload.new);
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            return Array.from(map.values());
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fiados" }, (payload) => {
          setFiados((prev) => {
            const map = new Map((prev || []).map(f => [String(f.id), f]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              map.set(String(payload.new.id), payload.new);
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            return Array.from(map.values()).sort((a, b) => new Date(b.data_criacao || 0).getTime() - new Date(a.data_criacao || 0).getTime());
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "insumos" }, (payload) => {
          setInsumos((prev) => {
            const map = new Map((prev || []).map(i => [String(i.id), i]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              map.set(String(payload.new.id), payload.new);
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            return Array.from(map.values()).sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, (payload) => {
          setProdutos((prev) => {
            const map = new Map((prev || []).map(p => [String(p.id), p]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              map.set(String(payload.new.id), payload.new);
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            return Array.from(map.values()).sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, (payload) => {
          setClientes((prev) => {
            const map = new Map((prev || []).map(c => [String(c.id), c]));
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              map.set(String(payload.new.id), payload.new);
            } else if (payload.eventType === 'DELETE') {
              map.delete(String(payload.old.id));
            }
            const novos = Array.from(map.values()).sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
            setClientesFiltrados(novos);
            return novos;
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario]);

  useEffect(() => {
    if (mesaSelecionada) {
      const atualizada = (mesas || []).find(m => String(m.id) === String(mesaSelecionada.id));
      if (atualizada) setMesaSelecionada(atualizada);
      else {
        setMesaSelecionada(null);
        setFichaAberta(false);
        setCheckoutAberto(false);
        setModalJuntarAberto(false);
      }
    }
  }, [mesas]);

  useEffect(() => {
    if (fiadoSelecionado) {
      const atualizado = (fiados || []).find(f => String(f.id) === String(fiadoSelecionado.id));
      if (atualizado) {
        if (atualizado.total !== fiadoSelecionado.total || JSON.stringify(atualizado.itens) !== JSON.stringify(fiadoSelecionado.itens)) {
          const itensDesmembrados: any[] = [];
          if (atualizado.itens && Array.isArray(atualizado.itens)) {
            atualizado.itens.forEach((item: any) => {
              for (let i = 0; i < (Number(item.quantidade) || 1); i++) {
                itensDesmembrados.push({ ...item, quantidade: 1, _id: Date.now() + Math.random() });
              }
            });
          }
          setFiadoSelecionado({ ...atualizado, itensDesmembrados });
        }
      } else {
        setFiadoSelecionado(null);
      }
    }
  }, [fiados]);

  useEffect(() => {
    if (!buscaCliente.trim()) {
      setClientesFiltrados(clientes || []);
    } else {
      const filtrados = (clientes || []).filter(c =>
        String(c?.nome || "").toLowerCase().includes(buscaCliente.toLowerCase())
      );
      setClientesFiltrados(filtrados);
    }
  }, [buscaCliente, clientes]);

  // ========== FUNÇÕES DE NEGÓCIO ==========

  async function abrirNovaMesa(e: React.FormEvent) {
    e.preventDefault();
    if (processando) return;
    if (!numeroMesa || !clienteMesa) {
      alert("Preencha todos os campos.");
      return;
    }
    const num = parseInt(numeroMesa);
    if (isNaN(num) || num <= 0) {
      alert("Número de mesa inválido.");
      return;
    }

    setProcessando(true);
    try {
      const { data: mesaExistente, error: errBusca } = await supabase.from("mesas").select("*").eq("numero", num).maybeSingle();
      if (errBusca) throw errBusca;

      if (mesaExistente) {
        if (mesaExistente.status === "ocupada") {
          alert("Esta mesa já está ocupada. Escolha outro número ou adicione os itens na mesa existente.");
          setProcessando(false);
          return;
        }
        const { error: errUpdate } = await supabase.from("mesas").update({ status: "ocupada", cliente: clienteMesa, total: 0, itens: [] }).eq("id", mesaExistente.id);
        if (errUpdate) throw errUpdate;
      } else {
        const { error: errInsert } = await supabase.from("mesas").insert([{ numero: num, status: "ocupada", cliente: clienteMesa, total: 0, itens: [] }]);
        if (errInsert) throw errInsert;
      }
      
      setModalAberto(false);
      setNumeroMesa("");
      setClienteMesa("");
    } catch (err: any) {
      alert("Erro ao abrir mesa: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function abrirFicha(mesa: any) {
    if (mesa?.status === "livre") {
      setNumeroMesa(String(mesa.numero || ""));
      setClienteMesa("");
      setModalAberto(true);
      return;
    }
    setMesaSelecionada(mesa);
    setFichaAberta(true);
  }

  async function confirmarJuntarMesa() {
    if (!mesaParaJuntar || !mesaSelecionada) return;
    setProcessando(true);

    try {
      const mesaB = mesas.find(m => String(m.id) === String(mesaParaJuntar));
      if (!mesaB) throw new Error("A mesa selecionada não foi encontrada ou já foi fechada.");

      const itensA = Array.isArray(mesaSelecionada.itens) ? mesaSelecionada.itens : [];
      const itensB = Array.isArray(mesaB.itens) ? mesaB.itens : [];

      const itensBMapeados = itensB.map((i: any) => ({
        ...i,
        nome: `${i.nome} (Mesa ${mesaB.numero})`
      }));

      const novosItens = [...itensA, ...itensBMapeados];
      const novoTotal = Number(mesaSelecionada.total || 0) + Number(mesaB.total || 0);

      const { error: errA } = await supabase.from("mesas").update({ total: novoTotal, itens: novosItens }).eq("id", mesaSelecionada.id);
      if (errA) throw errA;

      const { error: errB } = await supabase.from("mesas").delete().eq("id", mesaB.id);
      if (errB) throw errB;

      setMesaSelecionada({ ...mesaSelecionada, total: novoTotal, itens: novosItens });
      setModalJuntarAberto(false);
      setMesaParaJuntar("");
      alert("Mesas juntadas com sucesso!");
    } catch (err: any) {
      alert("Erro ao juntar mesas: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function adicionarItem(produto: any) {
    setPedidoAtual((prev) => {
      const existente = (prev || []).find((i) => String(i.id) === String(produto?.id));
      if (existente) {
        return prev.map((i) =>
          String(i.id) === String(produto.id) ? { ...i, quantidade: Number(i.quantidade || 0) + 1 } : i
        );
      }
      return [...(prev || []), { ...produto, quantidade: 1 }];
    });
  }

  function removerItem(id: string) {
    setPedidoAtual((prev) => {
      const existente = (prev || []).find((i) => String(i.id) === String(id));
      if (existente && Number(existente.quantidade || 0) > 1) {
        return prev.map((i) =>
          String(i.id) === String(id) ? { ...i, quantidade: Number(i.quantidade || 0) - 1 } : i
        );
      }
      return (prev || []).filter((i) => String(i.id) !== String(id));
    });
  }

  async function enviarPedido() {
    if (!mesaSelecionada || !pedidoAtual || pedidoAtual.length === 0) return;
    if (processando) return;

    let faltaEstoque = false;
    for (const item of pedidoAtual) {
      const produto = (produtos || []).find((p) => String(p.id) === String(item.id));
      if (!produto || !produto.receita || !Array.isArray(produto.receita) || produto.receita.length === 0) continue;

      for (const ing of produto.receita) {
        const insumo = (insumos || []).find((i) => String(i.id) === String(ing.insumo_id));
        if (!insumo) continue;
        const qtdNecessaria = parseFloat(ing.qtd || "0") * Number(item.quantidade || 0);
        if (Number(insumo.estoque || 0) < qtdNecessaria) {
          faltaEstoque = true;
          alert(`⚠️ Estoque insuficiente para "${produto.nome}".\nInsumo: ${insumo.nome} (disponível: ${insumo.estoque}, necessário: ${qtdNecessaria})\nO pedido será enviado mesmo assim.`);
        }
      }
    }

    if (faltaEstoque) {
      const continuar = confirm("Há itens com estoque insuficiente. Deseja continuar com o pedido?");
      if (!continuar) return;
    }

    setProcessando(true);
    try {
      const totalRemessa = pedidoAtual.reduce((acc, i) => acc + Number(i.preco || 0) * Number(i.quantidade || 0), 0);
      const totalNovo = Number(mesaSelecionada.total || 0) + totalRemessa;
      const itensAntigos = Array.isArray(mesaSelecionada.itens) ? mesaSelecionada.itens : [];
      let itensAtualizados = [...itensAntigos];

      pedidoAtual.forEach((itemNovo: any) => {
        const index = itensAtualizados.findIndex((i: any) => String(i.id) === String(itemNovo.id) && i.nome === itemNovo.nome);
        if (index >= 0) {
          itensAtualizados[index].quantidade = Number(itensAtualizados[index].quantidade || 0) + Number(itemNovo.quantidade || 0);
        } else {
          itensAtualizados.push({ ...itemNovo });
        }
      });

      const pedidoCozinha = {
        id: Date.now().toString(),
        mesa: String(mesaSelecionada.numero || ""),
        cliente: mesaSelecionada.cliente || "",
        itens: pedidoAtual,
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      const { error: errMesa } = await supabase.from("mesas").update({ total: totalNovo, itens: itensAtualizados }).eq("id", mesaSelecionada.id);
      if (errMesa) throw errMesa;

      const { error: errCozinha } = await supabase.from("pedidos_cozinha").insert([pedidoCozinha]);
      if (errCozinha) throw errCozinha;

      for (const item of pedidoAtual) {
        const produto = (produtos || []).find((p) => String(p.id) === String(item.id));
        if (!produto || !produto.receita || !Array.isArray(produto.receita) || produto.receita.length === 0) continue;

        for (const ing of produto.receita) {
          const insumo = (insumos || []).find((i) => String(i.id) === String(ing.insumo_id));
          if (!insumo) continue;
          const qtdUsada = parseFloat(ing.qtd || "0") * Number(item.quantidade || 0);
          const novoEstoque = Number(insumo.estoque || 0) - qtdUsada;

          const { error: errEstoque } = await supabase.from("insumos").update({ estoque: novoEstoque }).eq("id", insumo.id);
          if (errEstoque) throw errEstoque;
        }
      }

      setPedidoAtual([]);
      setCardapioAberto(false);
      
    } catch (err: any) {
      alert("Erro ao enviar pedido: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function finalizarPedidoCozinha(id: string) {
    if (processando) return;
    setProcessando(true);
    try {
      const { error } = await supabase.from("pedidos_cozinha").delete().eq("id", id);
      if (error) throw error;
    } catch (err: any) {
      alert("Erro ao finalizar pedido: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function removerItemDaMesa(mesaId: string, indexItem: number, itemRemovido: any) {
    if (!confirm(`Tem certeza que deseja excluir ${itemRemovido.quantidade}x ${itemRemovido.nome} desta comanda?\nO valor será descontado e os insumos devolvidos ao estoque.`)) return;
    if (processando) return;

    setProcessando(true);
    try {
      const mesa = (mesas || []).find(m => String(m.id) === String(mesaId));
      if (!mesa) throw new Error("Mesa não encontrada.");

      const produto = (produtos || []).find((p) => String(p.id) === String(itemRemovido.id));
      if (produto && produto.receita && Array.isArray(produto.receita) && produto.receita.length > 0) {
        for (const ing of produto.receita) {
          const insumo = (insumos || []).find((i) => String(i.id) === String(ing.insumo_id));
          if (insumo) {
            const qtdDevolver = parseFloat(ing.qtd || "0") * Number(itemRemovido.quantidade || 0);
            const novoEstoque = Number(insumo.estoque || 0) + qtdDevolver;

            const { error: errEstoque } = await supabase.from("insumos").update({ estoque: novoEstoque }).eq("id", insumo.id);
            if (errEstoque) throw errEstoque;
          }
        }
      }

      const novosItens = [...(mesa.itens || [])];
      novosItens.splice(indexItem, 1);
      const novoTotal = novosItens.reduce((acc, i) => acc + (Number(i.preco || 0) * Number(i.quantidade || 0)), 0);

      const { error: errUpdate } = await supabase.from("mesas").update({ total: novoTotal, itens: novosItens }).eq("id", mesaId);
      if (errUpdate) throw errUpdate;

      alert("Item excluído da comanda com sucesso!");

    } catch (err: any) {
      alert("Erro ao excluir item: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function abrirCheckout(mesa: any) {
    setMesaSelecionada(mesa);
    setPagamentos([{ id: 1, metodo: "dinheiro", valor: 0, clienteFiado: "" }]);
    setTotalPago(0);
    setSaldoRestante(Number(mesa.total || 0));
    setTroco(0);
    setFiadoAutomatico(false);
    setClienteNomeFiado(mesa.cliente || "Consumidor");
    setNumeroPessoas(1);
    setDividirIgual(false);
    setClienteSelecionadoId("");
    setBuscaCliente("");
    setMostrarNovoCliente(false);
    setNovoClienteForm({ nome: "", telefone: "", email: "", data_nascimento: "" });
    setClientesFiltrados(clientes || []);
    setCheckoutAberto(true);
  }

  function selecionarCliente(id: string, nome: string) {
    setClienteSelecionadoId(id);
    setBuscaCliente(nome);
    setClientesFiltrados(clientes || []);
    setMostrarNovoCliente(false);
  }

  function adicionarPagamento() {
    const novoId = pagamentos.length > 0 ? Math.max(...pagamentos.map(p => p.id)) + 1 : 1;
    setPagamentos([...pagamentos, { id: novoId, metodo: "dinheiro", valor: 0, clienteFiado: "" }]);
  }

  function removerPagamento(id: number) {
    if (pagamentos.length <= 1) {
      alert("Deve haver pelo menos uma forma de pagamento.");
      return;
    }
    setPagamentos(pagamentos.filter(p => String(p.id) !== String(id)));
    recalcularTotais(pagamentos.filter(p => String(p.id) !== String(id)));
  }

  function atualizarValorPagamento(id: number, valor: number) {
    const novosPagamentos = pagamentos.map(p =>
      String(p.id) === String(id) ? { ...p, valor: Math.max(0, valor) } : p
    );
    setPagamentos(novosPagamentos);
    recalcularTotais(novosPagamentos);
  }

  function atualizarMetodoPagamento(id: number, metodo: string) {
    setPagamentos(pagamentos.map(p =>
      String(p.id) === String(id) ? { ...p, metodo } : p
    ));
  }

  function atualizarClienteFiado(id: number, nome: string) {
    setPagamentos(pagamentos.map(p =>
      String(p.id) === String(id) ? { ...p, clienteFiado: nome } : p
    ));
  }

  function recalcularTotais(pagamentosAtuais: any[]) {
    const soma = pagamentosAtuais.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    const totalMesa = Number(mesaSelecionada?.total || 0);
    setTotalPago(soma);
    if (soma >= totalMesa) {
      setSaldoRestante(0);
      setTroco(soma - totalMesa);
    } else {
      setSaldoRestante(totalMesa - soma);
      setTroco(0);
    }
  }

  function dividirIgualmente() {
    const total = Number(mesaSelecionada?.total || 0);
    if (numeroPessoas <= 0) {
      alert("Número de pessoas inválido.");
      return;
    }
    if (numeroPessoas > 20) {
      alert("Máximo de 20 pessoas.");
      return;
    }

    const valorPorPessoa = Math.floor((total / numeroPessoas) * 100) / 100;
    const resto = total - (valorPorPessoa * numeroPessoas);
    const ultimoValor = parseFloat((valorPorPessoa + resto).toFixed(2));

    const novosPagamentos = Array.from({ length: numeroPessoas }).map((_, i) => ({
      id: i + 1,
      metodo: "dinheiro",
      valor: i === numeroPessoas - 1 ? ultimoValor : valorPorPessoa,
      clienteFiado: "",
    }));

    setPagamentos(novosPagamentos);
    recalcularTotais(novosPagamentos);
    setDividirIgual(true);
  }

  async function pagarParcela(id: number) {
    if (!mesaSelecionada) return;
    if (processando) return;

    const pagamento = pagamentos.find(p => String(p.id) === String(id));
    if (!pagamento) return;
    const valorPago = Number(pagamento.valor || 0);
    if (valorPago <= 0) {
      alert("Informe um valor para este pagamento.");
      return;
    }

    if (pagamento.metodo === "fiado" && !(pagamento.clienteFiado || "").trim()) {
      alert("Informe o nome do cliente no campo para pendurar este valor no fiado.");
      return;
    }

    const totalMesa = Number(mesaSelecionada.total || 0);
    if (valorPago > totalMesa + 0.05) { 
      alert("O valor não pode ser maior que o total da mesa.");
      return;
    }

    setProcessando(true);
    try {
      if (pagamento.metodo === "fiado") {
        const nomeFiado = pagamento.clienteFiado.trim().toUpperCase();
        const { data: fiadoExistente } = await supabase.from("fiados").select("*").ilike("cliente_nome", nomeFiado).maybeSingle();

        const itemResumo = { id: 'parcial', nome: `Pagamento Parcial Mesa ${mesaSelecionada.numero}`, quantidade: 1, preco: valorPago };

        if (fiadoExistente) {
          const novoTotalFiado = Number(fiadoExistente.total || 0) + valorPago;
          const itensAtuais = Array.isArray(fiadoExistente.itens) ? fiadoExistente.itens : [];
          itensAtuais.push(itemResumo);
          
          const { error: errUpFiado } = await supabase.from("fiados").update({ total: novoTotalFiado, itens: itensAtuais }).eq("id", fiadoExistente.id);
          if (errUpFiado) throw errUpFiado;
        } else {
          const { error: errInsert } = await supabase.from("fiados").insert([{
              cliente_nome: nomeFiado,
              total: valorPago,
              itens: [itemResumo],
          }]);
          if (errInsert) throw errInsert;
        }
      } else {
        const custoEstimado = valorPago * 0.4;
        const lucroEstimado = valorPago * 0.6;
        const { error: errVenda } = await supabase.from("vendas").insert([{
            total_venda: valorPago,
            custo_total: custoEstimado,
            lucro_total: lucroEstimado,
            cliente_nome: `${mesaSelecionada.cliente || ""} (Parcial)`,
            mesa_numero: mesaSelecionada.numero,
            itens: [{ id: 'parcial', nome: `Pagamento parcial Mesa ${mesaSelecionada.numero}`, quantidade: 1, preco: valorPago }],
            pagamentos: [pagamento],
        }]);
        if (errVenda) throw errVenda;
      }

      const novoTotal = parseFloat((totalMesa - valorPago).toFixed(2));

      if (novoTotal <= 0.01) {
        await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
        setMesaSelecionada(null);
        setFichaAberta(false);
        setCheckoutAberto(false);
        alert(`Pagamento de R$ ${valorPago.toFixed(2)} realizado com sucesso. Mesa encerrada.`);
      } else {
        const { error: errUpdate } = await supabase.from("mesas").update({ total: novoTotal }).eq("id", mesaSelecionada.id);
        if (errUpdate) throw errUpdate;

        const novosPagamentos = pagamentos.filter(p => String(p.id) !== String(id));
        setPagamentos(novosPagamentos);
        recalcularTotais(novosPagamentos);
        alert(`Pagamento parcial de R$ ${valorPago.toFixed(2)} registrado. Saldo restante: R$ ${novoTotal.toFixed(2)}`);
      }
    } catch (err: any) {
      alert("Erro ao registrar pagamento parcial: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function criarClienteRapido() {
    if (processando) return;
    const { nome, telefone, email, data_nascimento } = novoClienteForm;
    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }
    setProcessando(true);
    try {
      const { data, error } = await supabase.from("clientes").insert([{
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          data_nascimento: data_nascimento || null,
        }]).select().single();

      if (error) throw error;

      setClienteSelecionadoId(data.id);
      setBuscaCliente(data.nome);
      setMostrarNovoCliente(false);
      setNovoClienteForm({ nome: "", telefone: "", email: "", data_nascimento: "" });
      alert("Cliente cadastrado e vinculado à conta!");
    } catch (err: any) {
      alert("Erro ao criar cliente: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function finalizarCheckout() {
    if (!mesaSelecionada) return;
    if (processando) return;

    const totalMesa = Number(mesaSelecionada.total || 0);
    const somaPago = totalPago;

    if (totalMesa === 0) {
      setProcessando(true);
      await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
      setMesaSelecionada(null);
      setFichaAberta(false);
      setCheckoutAberto(false);
      setProcessando(false);
      alert("Mesa vazia removida com sucesso!");
      return;
    }

    const temPagamento = pagamentos.some(p => Number(p.valor || 0) > 0);
    if (!temPagamento && !fiadoAutomatico) {
      alert("Informe pelo menos um valor de pagamento ou marque a opção de fiado.");
      return;
    }

    let valorFiado = 0;
    if (fiadoAutomatico) {
      valorFiado = totalMesa - somaPago;
      if (valorFiado < 0) valorFiado = 0;
    }

    if (fiadoAutomatico && somaPago === 0) {
      valorFiado = totalMesa;
    }

    setProcessando(true);
    try {
      const itensVenda = Array.isArray(mesaSelecionada.itens) ? mesaSelecionada.itens : [];

      if (somaPago > 0) {
        const custoEstimado = somaPago * 0.4;
        const lucroEstimado = somaPago * 0.6;
        const clienteId = clienteSelecionadoId || null;

        const pagamentosReais = pagamentos.filter(p => Number(p.valor || 0) > 0 && p.metodo !== 'fiado');

        if (pagamentosReais.length > 0) {
           const { error: errVenda } = await supabase.from("vendas").insert([{
               total_venda: somaPago,
               custo_total: custoEstimado,
               lucro_total: lucroEstimado,
               cliente_nome: mesaSelecionada.cliente || "Consumidor",
               mesa_numero: mesaSelecionada.numero,
               itens: itensVenda,
               pagamentos: pagamentosReais,
               cliente_id: clienteId,
             }]);
           if (errVenda) throw errVenda;
        }
      }

      if (valorFiado > 0.01) {
        const nomeFiado = clienteNomeFiado.trim().toUpperCase();
        const { data: fiadoExistente } = await supabase.from("fiados").select("*").ilike("cliente_nome", nomeFiado).maybeSingle();

        if (fiadoExistente) {
          const novoTotal = Number(fiadoExistente.total || 0) + valorFiado;
          let itensAtuais = Array.isArray(fiadoExistente.itens) ? fiadoExistente.itens : [];
          itensVenda.forEach((itemNovo: any) => {
            const existente = itensAtuais.find((i: any) => String(i.id) === String(itemNovo.id) && i.nome === itemNovo.nome);
            if (existente) {
              existente.quantidade = Number(existente.quantidade || 0) + Number(itemNovo.quantidade || 0);
            } else {
              itensAtuais.push({ ...itemNovo });
            }
          });
          const { error: errUpFiado } = await supabase.from("fiados").update({ total: novoTotal, itens: itensAtuais }).eq("id", fiadoExistente.id);
          if (errUpFiado) throw errUpFiado;
        } else {
          const { error: errInsert } = await supabase.from("fiados").insert([{
              cliente_nome: nomeFiado,
              total: valorFiado,
              itens: itensVenda,
            }]);
          if (errInsert) throw errInsert;
        }
      }

      await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
      setMesaSelecionada(null);
      setFichaAberta(false);
      setCheckoutAberto(false);
      alert("Conta finalizada com sucesso!");
      
    } catch (err: any) {
      alert("Erro ao finalizar conta: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function abrirFiados() {
    setFiadosAberto(true);
  }

  function selecionarFiado(fiado: any) {
    const itensDesmembrados: any[] = [];
    if (fiado?.itens && Array.isArray(fiado.itens)) {
      fiado.itens.forEach((item: any) => {
        for (let i = 0; i < (Number(item.quantidade) || 1); i++) {
          itensDesmembrados.push({ ...item, quantidade: 1, _id: Date.now() + Math.random() });
        }
      });
    }
    setFiadoSelecionado({ ...fiado, itensDesmembrados });
    setItensSelecionadosFiado([]);
    setPagamentosFiado([{ id: 1, metodo: "dinheiro", valor: 0 }]);
    setValorPagamentoFiado(0);
    setFiadoModalAberto(true);
  }

  function alternarItemFiado(idx: number) {
    setItensSelecionadosFiado((prev) =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }

  function selecionarTodosFiado() {
    if (!fiadoSelecionado) return;
    const totalItens = Array.isArray(fiadoSelecionado.itensDesmembrados) ? fiadoSelecionado.itensDesmembrados.length : 0;
    if (itensSelecionadosFiado.length === totalItens) {
      setItensSelecionadosFiado([]);
    } else {
      setItensSelecionadosFiado(Array.from({ length: totalItens }, (_, i) => i));
    }
  }

  async function excluirItemFiado(idx: number) {
    if (!fiadoSelecionado) return;
    const item = fiadoSelecionado.itensDesmembrados[idx];
    if (!item) return;

    if (!confirm(`Remover "${item.nome}" (R$ ${Number(item.preco || 0).toFixed(2)}) do fiado?`)) return;
    if (processando) return;

    setProcessando(true);
    try {
      const novosDesmembrados = fiadoSelecionado.itensDesmembrados.filter((_: any, i: number) => i !== idx);
      const itensAgrupados: any[] = [];
      novosDesmembrados.forEach((i: any) => {
        const existente = itensAgrupados.find((x: any) => String(x.id) === String(i.id) && x.nome === i.nome);
        if (existente) {
          existente.quantidade = Number(existente.quantidade || 0) + 1;
        } else {
          itensAgrupados.push({ ...i, quantidade: 1 });
        }
      });
      const novoTotal = itensAgrupados.reduce((acc: any, i: any) => acc + (Number(i.preco || 0) * Number(i.quantidade || 0)), 0);

      const { error } = await supabase.from("fiados").update({ itens: itensAgrupados, total: novoTotal }).eq("id", fiadoSelecionado.id);
      if (error) throw error;
      
      setItensSelecionadosFiado([]);
      alert("Item removido do fiado.");
    } catch (err: any) {
      alert("Erro ao excluir item: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function adicionarPagamentoFiado() {
    const novoId = pagamentosFiado.length > 0 ? Math.max(...pagamentosFiado.map(p => p.id)) + 1 : 1;
    setPagamentosFiado([...pagamentosFiado, { id: novoId, metodo: "dinheiro", valor: 0 }]);
  }

  function removerPagamentoFiado(id: number) {
    if (pagamentosFiado.length <= 1) {
      alert("Deve haver pelo menos uma forma de pagamento.");
      return;
    }
    setPagamentosFiado(pagamentosFiado.filter(p => String(p.id) !== String(id)));
  }

  function atualizarValorPagamentoFiado(id: number, valor: number) {
    setPagamentosFiado(prev => prev.map(p =>
      String(p.id) === String(id) ? { ...p, valor: Math.max(0, valor) } : p
    ));
    const soma = pagamentosFiado.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
    setValorPagamentoFiado(soma);
  }

  function atualizarMetodoPagamentoFiado(id: number, metodo: string) {
    setPagamentosFiado(prev => prev.map(p =>
      String(p.id) === String(id) ? { ...p, metodo } : p
    ));
  }

  async function receberFiado() {
    if (!fiadoSelecionado) return;
    if (processando) return;

    const totalPendente = Number(fiadoSelecionado.total || 0);
    const somaPago = pagamentosFiado.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);

    if (somaPago === 0) {
      alert("Informe o valor a ser pago.");
      return;
    }

    if (somaPago > totalPendente) {
      alert(`O valor pago (R$ ${somaPago.toFixed(2)}) não pode ser maior que o total pendente (R$ ${totalPendente.toFixed(2)}).`);
      return;
    }

    setProcessando(true);
    try {
      const custoEstimado = somaPago * 0.4;
      const lucroEstimado = somaPago * 0.6;

      const { error: errVenda } = await supabase.from("vendas").insert([{
          total_venda: somaPago,
          custo_total: custoEstimado,
          lucro_total: lucroEstimado,
          cliente_nome: `Fiado Pago: ${fiadoSelecionado.cliente_nome}`,
          mesa_numero: 0,
          itens: [],
          pagamentos: pagamentosFiado,
        }]);

      if (errVenda) throw errVenda;

      const novoTotal = parseFloat((totalPendente - somaPago).toFixed(2));

      if (novoTotal <= 0.01) {
        const { error: errDel } = await supabase.from("fiados").delete().eq("id", fiadoSelecionado.id);
        if (errDel) throw errDel;
      } else {
        const { error: errUpdate } = await supabase.from("fiados").update({ total: novoTotal }).eq("id", fiadoSelecionado.id);
        if (errUpdate) throw errUpdate;
      }

      setFiadoModalAberto(false);
      setFiadoSelecionado(null);
      setItensSelecionadosFiado([]);
      setPagamentosFiado([{ id: 1, metodo: "dinheiro", valor: 0 }]);
      alert(`Pagamento de R$ ${somaPago.toFixed(2)} recebido com sucesso!`);
    } catch (err: any) {
      alert("Erro ao receber fiado: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function imprimirComandaCozinha(mesa: any) {
    if (!mesa || !mesa.itens || mesa.itens.length === 0) {
      alert("Não há itens para imprimir.");
      return;
    }
    setDadosComanda({
      tipo: "cozinha",
      mesa: mesa.numero,
      cliente: mesa.cliente,
      itens: mesa.itens,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    });
    setComandaAberta(true);
  }

  function imprimirComandaCliente(mesa: any, pagamentosRealizados?: any[]) {
    if (!mesa) return;
    setDadosComanda({
      tipo: "cliente",
      mesa: mesa.numero,
      cliente: mesa.cliente,
      itens: mesa.itens || [],
      total: Number(mesa.total || 0),
      pagamentos: pagamentosRealizados || [],
    });
    setComandaAberta(true);
  }

  function abrirEstoque() {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem gerenciar o estoque.");
      return;
    }
    setEstoqueAberto(true);
  }

  function abrirFormInsumo(insumo?: any) {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem gerenciar o estoque.");
      return;
    }
    if (insumo) {
      setInsumoEditando(insumo);
      setFormInsumo({
        nome: insumo.nome || "",
        unidade: insumo.unidade || "UN",
        estoque: String(insumo.estoque || ""),
        custo_unidade: String(insumo.custo_unidade || ""),
      });
    } else {
      setInsumoEditando(null);
      setFormInsumo({ nome: "", unidade: "UN", estoque: "", custo_unidade: "" });
    }
    setModalInsumoAberto(true);
  }

  async function salvarInsumo() {
    if (processando) return;
    const { nome, unidade, estoque, custo_unidade } = formInsumo;
    if (!nome || !unidade) {
      alert("Nome e unidade são obrigatórios.");
      return;
    }
    const estoqueNum = parseFloat(estoque) || 0;
    const custoNum = parseFloat(custo_unidade) || 0;

    setProcessando(true);
    try {
      if (insumoEditando) {
        const { error } = await supabase.from("insumos").update({ nome, unidade, estoque: estoqueNum, custo_unidade: custoNum }).eq("id", insumoEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("insumos").insert([{ nome, unidade, estoque: estoqueNum, custo_unidade: custoNum }]);
        if (error) throw error;
      }
      setModalInsumoAberto(false);
      alert("Insumo enviado para o banco com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar insumo: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluirInsumo(id: string) {
    if (!confirm("Deseja realmente excluir este insumo?")) return;
    if (processando) return;
    setProcessando(true);
    try {
      const { error } = await supabase.from("insumos").delete().eq("id", id);
      if (error) throw error;
    } catch (err: any) {
      alert("Erro ao excluir insumo: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function abrirNovoProduto() {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem criar produtos.");
      return;
    }
    setProdutoEditando(null);
    setFormProduto({ nome: "", categoria: "Bebidas", preco: "" });
    setReceitaTemp([]);
    setModalProdutoAberto(true);
  }

  function abrirEdicaoProduto(produto: any) {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem editar produtos.");
      return;
    }
    setProdutoEditando(produto);
    setFormProduto({
      nome: produto.nome || "",
      categoria: produto.categoria || "Bebidas",
      preco: String(produto.preco || ""),
    });
    setReceitaTemp(Array.isArray(produto.receita) ? produto.receita : []);
    setModalProdutoAberto(true);
  }

  function adicionarIngrediente() {
    if (usuario?.role !== "gerente") return;
    if (!ingredienteTemp.insumo_id || !ingredienteTemp.qtd) {
      alert("Selecione um insumo e informe a quantidade.");
      return;
    }
    const insumo = (insumos || []).find(i => String(i.id) === String(ingredienteTemp.insumo_id));
    if (!insumo) return;
    const qtd = parseFloat(ingredienteTemp.qtd);
    if (isNaN(qtd) || qtd <= 0) {
      alert("Quantidade inválida.");
      return;
    }
    const existe = receitaTemp.find(r => String(r.insumo_id) === String(insumo.id));
    if (existe) {
      if (!confirm(`O insumo "${insumo.nome}" já está na receita. Deseja adicionar mais?`)) return;
      setReceitaTemp(prev =>
        prev.map(r =>
          String(r.insumo_id) === String(insumo.id) ? { ...r, qtd: Number(r.qtd || 0) + qtd } : r
        )
      );
    } else {
      setReceitaTemp(prev => [
        ...prev,
        {
          insumo_id: insumo.id,
          nome: insumo.nome,
          unidade: insumo.unidade,
          qtd: qtd,
        },
      ]);
    }
    setIngredienteTemp({ insumo_id: "", qtd: "" });
  }

  function removerIngrediente(index: number) {
    if (usuario?.role !== "gerente") return;
    setReceitaTemp(prev => prev.filter((_, i) => i !== index));
  }

  async function salvarProduto() {
    if (processando) return;
    const { nome, categoria, preco } = formProduto;
    if (!nome || !preco) {
      alert("Preencha nome e preço.");
      return;
    }
    const precoNum = parseFloat(preco) || 0;
    const dados = {
      nome,
      categoria,
      preco: precoNum,
      receita: receitaTemp,
    };

    setProcessando(true);
    try {
      if (produtoEditando) {
        const { error } = await supabase.from("produtos").update(dados).eq("id", produtoEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("produtos").insert([dados]);
        if (error) throw error;
      }
      setModalProdutoAberto(false);
      alert("Produto salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluirProduto(id: string) {
    if (!confirm("Deseja realmente excluir este produto? Todos os dados de receita associados também serão removidos.")) return;
    if (processando) return;
    setProcessando(true);
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      alert("Produto excluído com sucesso!");
    } catch (err: any) {
      alert("Erro ao excluir produto: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function adicionarGarcom(e: React.FormEvent) {
    e.preventDefault();
    if (processando) return;
    const { nome, email, senha, confirmarSenha } = formGarcom;
    if (!nome || !email || !senha || !confirmarSenha) {
      alert("Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setProcessando(true);
    try {
      const { data: usuarioExistente } = await supabase.from("usuarios").select("id").ilike("email", email.trim().toLowerCase()).maybeSingle();

      if (usuarioExistente) {
        alert("Este email já está cadastrado no sistema.");
        setProcessando(false);
        return;
      }

      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (authError) {
        alert("Erro ao criar usuário na base Auth: " + authError.message);
        setProcessando(false);
        return;
      }

      const { error: perfilError } = await supabase.from("usuarios").insert([{
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          role: "colaborador",
        }]);

      if (perfilError) {
        alert("Erro ao criar perfil de usuário: " + perfilError.message);
        setProcessando(false);
        return;
      }

      alert("Garçom cadastrado com sucesso!");
      setModalGarcomFormAberto(false);
      setModalGarcomAberto(true);
      setFormGarcom({ nome: "", email: "", senha: "", confirmarSenha: "" });
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluirGarcom(id: string) {
    if (!confirm("Deseja realmente excluir este garçom? O acesso dele será revogado da tela do sistema.")) return;
    if (processando) return;
    setProcessando(true);
    try {
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) throw error;
      alert("Garçom removido com sucesso!");
    } catch (err: any) {
      alert("Erro ao excluir garçom: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  function abrirClientes() {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem gerenciar clientes.");
      return;
    }
    setBuscaClienteModal(""); 
    setModalClientesAberto(true);
  }

  function abrirFormCliente(cliente?: any) {
    if (cliente) {
      setClienteEditando(cliente);
      setFormCliente({
        nome: cliente.nome || "",
        telefone: cliente.telefone || "",
        email: cliente.email || "",
        data_nascimento: cliente.data_nascimento || "",
      });
    } else {
      setClienteEditando(null);
      setFormCliente({ nome: "", telefone: "", email: "", data_nascimento: "" });
    }
    setModalClientesAberto(false);
    setModalClienteFormAberto(true);
  }

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();
    if (processando) return;
    const { nome, telefone, email, data_nascimento } = formCliente;
    if (!nome.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    setProcessando(true);
    try {
      if (clienteEditando) {
        const { error } = await supabase.from("clientes").update({
            nome: nome.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            data_nascimento: data_nascimento || null,
          }).eq("id", clienteEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert([{
            nome: nome.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            data_nascimento: data_nascimento || null,
          }]);
        if (error) throw error;
      }
      setModalClienteFormAberto(false);
      setModalClientesAberto(true);
      setClienteEditando(null);
      setFormCliente({ nome: "", telefone: "", email: "", data_nascimento: "" });
      alert("Cliente salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar cliente: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluirCliente(id: string) {
    if (!confirm("Deseja realmente excluir este cliente?")) return;
    if (processando) return;
    setProcessando(true);
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    } catch (err: any) {
      alert("Erro ao excluir cliente: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  async function excluirMesa(mesa: any) {
    if (!confirm("Tem certeza que deseja excluir esta mesa?\nOs itens lançados serão devolvidos ao estoque e não poderão ser recuperados.")) return;
    if (processando) return;
    setProcessando(true);
    try {
      const itensMesa = Array.isArray(mesa.itens) ? mesa.itens : [];
      for (const item of itensMesa) {
        const produto = (produtos || []).find((p) => String(p.id) === String(item.id));
        if (!produto || !produto.receita || !Array.isArray(produto.receita) || produto.receita.length === 0) continue;

        for (const ing of produto.receita) {
          const insumo = (insumos || []).find((i) => String(i.id) === String(ing.insumo_id));
          if (!insumo) continue;
          const qtdDevolver = parseFloat(ing.qtd || "0") * Number(item.quantidade || 0);
          const novoEstoque = Number(insumo.estoque || 0) + qtdDevolver;

          const { error: errEstoque } = await supabase.from("insumos").update({ estoque: novoEstoque }).eq("id", insumo.id);
          if (errEstoque) throw errEstoque;
        }
      }

      const { error: errDelete } = await supabase.from("mesas").delete().eq("id", mesa.id);
      if (errDelete) throw errDelete;

      alert("Mesa excluída e itens devolvidos ao estoque com sucesso!");
    } catch (err: any) {
      alert("Erro ao excluir a mesa: " + err.message);
    } finally {
      setProcessando(false);
    }
  }

  const aniversariantesFiltrados = (clientes || []).filter(c => {
    if (!c?.data_nascimento) return false;
    let month = "0";
    if (String(c.data_nascimento).includes('-')) month = String(c.data_nascimento).split('-')[1];
    else if (String(c.data_nascimento).includes('/')) month = String(c.data_nascimento).split('/')[1];
    return parseInt(month || "0", 10) === mesAniversario;
  }).sort((a, b) => {
    let dayA = 0, dayB = 0;
    if (String(a?.data_nascimento || "").includes('-')) dayA = parseInt(String(a.data_nascimento).split('-')[2] || "0", 10);
    else if (String(a?.data_nascimento || "").includes('/')) dayA = parseInt(String(a.data_nascimento).split('/')[0] || "0", 10);
    if (String(b?.data_nascimento || "").includes('-')) dayB = parseInt(String(b.data_nascimento).split('-')[2] || "0", 10);
    else if (String(b?.data_nascimento || "").includes('/')) dayB = parseInt(String(b.data_nascimento).split('/')[0] || "0", 10);
    return dayA - dayB;
  });

  const mesesAno = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const clientesFiltradosModal = (clientes || []).filter(c => {
    const termo = String(buscaClienteModal || "").toLowerCase();
    const nomeBate = String(c?.nome || "").toLowerCase().includes(termo);
    const telefoneBate = c?.telefone ? String(c.telefone).includes(termo) : false;
    return nomeBate || telefoneBate;
  });

  const categorias = ["Todas", "Bebidas", "Drinks", "Porções", "Lanches"];
  const produtosFiltrados = (produtos || []).filter((p) => {
    const matchBusca = String(p?.nome || "").toLowerCase().includes(String(buscaProduto || "").toLowerCase());
    const matchCat = categoriaAtiva === "Todas" || p?.categoria === categoriaAtiva;
    return matchBusca && matchCat;
  });

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-yellow-500 text-2xl font-black">Carregando...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const isGerente = usuario?.role === "gerente";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden">
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 md:px-6 md:py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 backdrop-blur-md sticky top-0 z-10 w-full">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 relative rounded-full overflow-hidden border border-yellow-500/30 bg-black flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-yellow-500 italic uppercase leading-none">
                Bar da Praça <span className="text-[10px] text-zinc-500 ml-1">v10.0</span>
              </h1>
              <p className="text-[10px] md:text-xs text-zinc-400 mt-1">Bem-vindo, {usuario?.nome || "Usuário"}</p>
            </div>
          </div>
          <div className="lg:hidden flex flex-col items-end">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">{usuario?.role || ""}</span>
            <button onClick={() => { localStorage.removeItem("usuario"); router.push("/"); }} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase transition-colors">Sair</button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {isGerente && (
            <>
              <button onClick={() => router.push("/relatorios")} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">📊 Relatórios</button>
              <button onClick={() => setModalAniversariantesAberto(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">🎉 Aniversários</button>
              <button onClick={() => router.push("/caixa")} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">💰 Caixa</button>
              <button onClick={abrirClientes} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">👤 Clientes ({(clientes || []).length})</button>
              <button onClick={() => setModalGarcomAberto(true)} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">👤 Garçons ({(garcons || []).length})</button>
              <button onClick={abrirFiados} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">📒 Fiados ({(fiados || []).length})</button>
              <button onClick={abrirEstoque} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all shadow-xl whitespace-nowrap">📦 Estoque</button>
              <button onClick={() => setCozinhaAberta(true)} className={`relative px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs transition-all shadow-xl whitespace-nowrap ${(pedidosCozinha || []).length > 0 ? "bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-yellow-500"}`}>
                <span>🍳 Cozinha</span>
                {(pedidosCozinha || []).length > 0 && <span className="bg-white text-red-600 rounded-full px-2 py-0.5 text-[10px] font-black">{(pedidosCozinha || []).length}</span>}
              </button>
            </>
          )}
          <div className="hidden lg:flex items-center gap-4 ml-2">
            <span className="text-xs font-bold text-zinc-500 uppercase">{usuario?.role || ""}</span>
            <button onClick={() => { localStorage.removeItem("usuario"); router.push("/"); }} className="text-xs text-red-500 hover:text-red-400 font-bold uppercase transition-colors">Sair</button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-black uppercase italic">Salão</h2>
          <button onClick={() => { setNumeroMesa(""); setClienteMesa(""); setModalAberto(true); }} className="bg-yellow-500 text-zinc-950 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-black text-xs md:text-sm hover:bg-yellow-400 transition-all shadow-xl">+ Nova Mesa</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {(mesas || []).length === 0 ? (
            <p className="text-zinc-500 col-span-full text-center py-12 font-bold uppercase text-sm">Nenhuma mesa ocupada no momento.</p>
          ) : (
            (mesas || []).map((mesa) => {
              const temPedidoCozinha = (pedidosCozinha || []).some(p => String(p.mesa) === String(mesa.numero) && p.cliente === mesa.cliente);
              return (
                <div key={mesa.id} className="relative p-4 md:p-6 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 h-40 md:h-48 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/5" onClick={() => abrirFicha(mesa)}>
                  <div className="flex justify-between items-start w-full">
                    <span className="text-3xl md:text-4xl font-black italic text-yellow-500 leading-none">{String(mesa.numero || "").padStart(2, "0")}</span>
                    <div className="flex flex-col md:flex-row items-end md:items-start gap-1 md:gap-2">
                      <span className="bg-yellow-500 text-zinc-950 text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md uppercase text-right md:text-left truncate max-w-[80px] md:max-w-[120px]">{mesa.cliente}</span>
                      <button onClick={(e) => { e.stopPropagation(); excluirMesa(mesa); }} disabled={processando} className="text-red-500 hover:text-red-400 p-1 bg-zinc-900 rounded-full transition-colors disabled:opacity-50" title="Excluir mesa">🗑️</button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest text-yellow-500">R$ {Number(mesa.total || 0).toFixed(2)}</p>
                    <button onClick={(e) => { e.stopPropagation(); setMesaSelecionada(mesa); setCozinhaAberta(true); }} className={`w-full text-white py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all shadow-lg ${temPedidoCozinha ? "bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]" : "bg-yellow-600 hover:bg-yellow-500"}`}>
                      {temPedidoCozinha ? "⏳ Pendente" : "🟡 Ver Cozinha"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {modalAniversariantesAberto && isGerente && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-indigo-500 uppercase italic">🎉 Aniversariantes</h3>
              <button onClick={() => setModalAniversariantesAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <span className="text-zinc-400 font-bold uppercase text-xs tracking-widest">Filtrar por Mês:</span>
                <select value={mesAniversario} onChange={(e) => setMesAniversario(parseInt(e.target.value))} className="bg-zinc-900 border border-zinc-700 text-white text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-indigo-500 w-full sm:w-auto">
                  {mesesAno.map((mes, index) => (<option key={index} value={index + 1}>{mes}</option>))}
                </select>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[50vh]">
                {(aniversariantesFiltrados || []).length === 0 ? (
                  <p className="text-zinc-500 text-center py-8 font-bold uppercase text-sm">Nenhum cliente faz aniversário neste mês.</p>
                ) : (
                  (aniversariantesFiltrados || []).map(cliente => {
                    const dia = String(cliente?.data_nascimento || "").includes('-') ? String(cliente.data_nascimento).split('-')[2] : String(cliente.data_nascimento).split('/')[0];
                    const hoje = new Date().getDate();
                    const mesAtual = new Date().getMonth() + 1;
                    const ehHoje = (parseInt(dia || "0") === hoje && mesAniversario === mesAtual);

                    return (
                      <div key={cliente.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${ehHoje ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-900 border-zinc-800'}`}>
                        <div><p className="font-black text-zinc-100 uppercase">{cliente.nome}</p><p className="text-xs text-zinc-400 mt-1">Contato: {cliente.telefone || 'Não informado'}</p></div>
                        <div className="flex flex-col items-end"><span className={`text-2xl font-black italic ${ehHoje ? 'text-indigo-400' : 'text-zinc-500'}`}>Dia {dia}</span>{ehHoje && <span className="text-[10px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded mt-1 uppercase animate-pulse">Hoje!</span>}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalClientesAberto && isGerente && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-xl md:text-2xl font-black text-pink-500 uppercase italic">👤 Clientes</h3>
              <button onClick={() => setModalClientesAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative"><input type="text" placeholder="Buscar cliente por nome ou telefone..." value={buscaClienteModal} onChange={(e) => setBuscaClienteModal(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50 font-bold focus:border-pink-500 outline-none" /></div>
                <button onClick={() => abrirFormCliente()} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-3 rounded-xl text-xs font-black uppercase transition-all w-full sm:w-auto shrink-0 shadow-xl">+ Novo Cliente</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase border-b border-zinc-800">
                    <tr><th className="p-3">Nome</th><th className="p-3">Telefone</th><th className="p-3">Email</th><th className="p-3">Nascimento</th><th className="p-3 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {(clientesFiltradosModal || []).length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-zinc-500 font-bold uppercase text-sm">Nenhum cliente encontrado.</td></tr>
                    ) : (
                      (clientesFiltradosModal || []).map((c) => (
                        <tr key={c.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                          <td className="p-3 font-bold uppercase">{c.nome}</td><td className="p-3 text-zinc-400">{c.telefone || "-"}</td><td className="p-3 text-zinc-400">{c.email || "-"}</td><td className="p-3 text-zinc-400">{c.data_nascimento ? new Date(c.data_nascimento).toLocaleDateString() : "-"}</td>
                          <td className="p-3 text-center space-x-2"><button onClick={() => abrirFormCliente(c)} className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase">Editar</button><button onClick={() => excluirCliente(c.id)} disabled={processando} className="text-red-500 hover:text-red-400 text-xs font-black uppercase disabled:opacity-50">Excluir</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalClienteFormAberto && isGerente && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-black text-pink-500 uppercase italic mb-6">{clienteEditando ? "Editar Cliente" : "Novo Cliente"}</h3>
            <form onSubmit={salvarCliente} className="space-y-4">
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Nome *</label><input type="text" value={formCliente.nome} onChange={(e) => setFormCliente({ ...formCliente, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-pink-500 outline-none" required /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Telefone</label><input type="text" value={formCliente.telefone} onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-pink-500 outline-none" /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Email</label><input type="email" value={formCliente.email} onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-pink-500 outline-none" /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Data de Nascimento</label><input type="date" value={formCliente.data_nascimento} onChange={(e) => setFormCliente({ ...formCliente, data_nascimento: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-pink-500 outline-none" /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setModalClienteFormAberto(false); setModalClientesAberto(true); setClienteEditando(null); }} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 bg-pink-600 hover:bg-pink-500 text-white font-black py-3 rounded-xl text-sm uppercase tracking-widest transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalGarcomAberto && isGerente && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-cyan-500 uppercase italic">👤 Garçons Cadastrados</h3>
              <button onClick={() => setModalGarcomAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <div className="p-4 md:p-6">
              <button onClick={() => { setFormGarcom({ nome: "", email: "", senha: "", confirmarSenha: "" }); setModalGarcomAberto(false); setModalGarcomFormAberto(true); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-3 rounded-xl text-xs font-black uppercase transition-all mb-6 w-full sm:w-auto shadow-xl">+ Novo Garçom</button>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase border-b border-zinc-800">
                    <tr><th className="p-3">Nome</th><th className="p-3">Email (Login)</th><th className="p-3 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {(garcons || []).length === 0 ? (
                      <tr><td colSpan={3} className="p-8 text-center text-zinc-500 font-bold uppercase text-sm">Nenhum garçom cadastrado.</td></tr>
                    ) : (
                      (garcons || []).map((g) => (
                        <tr key={g.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                          <td className="p-3 font-bold uppercase">{g.nome}</td><td className="p-3 text-zinc-400">{g.email}</td>
                          <td className="p-3 text-center"><button onClick={() => excluirGarcom(g.id)} disabled={processando} className="text-red-500 hover:text-red-400 text-xs font-black uppercase disabled:opacity-50">🗑️ Excluir Acesso</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalGarcomFormAberto && isGerente && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-black text-cyan-500 uppercase italic mb-6">👤 Novo Garçom</h3>
            <form onSubmit={adicionarGarcom} className="space-y-4">
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Nome</label><input type="text" value={formGarcom.nome} onChange={(e) => setFormGarcom({ ...formGarcom, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-cyan-500 outline-none" required /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Email (login)</label><input type="email" value={formGarcom.email} onChange={(e) => setFormGarcom({ ...formGarcom, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-cyan-500 outline-none" required /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Senha</label><input type="password" value={formGarcom.senha} onChange={(e) => setFormGarcom({ ...formGarcom, senha: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-cyan-500 outline-none" required /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Confirmar Senha</label><input type="password" value={formGarcom.confirmarSenha} onChange={(e) => setFormGarcom({ ...formGarcom, confirmarSenha: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-cyan-500 outline-none" required /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => { setModalGarcomFormAberto(false); setModalGarcomAberto(true); }} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3 rounded-xl text-sm uppercase tracking-widest transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGerente && fiadosAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-orange-500 uppercase italic">📒 Fiados Pendentes</h3>
              <button onClick={() => setFiadosAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
              {(fiados || []).length === 0 ? (
                <p className="text-zinc-500 text-center py-8 font-bold uppercase text-sm">Nenhum fiado pendente.</p>
              ) : (
                (fiados || []).map((fiado) => (
                  <div key={fiado.id} className="bg-zinc-950 border border-orange-500/30 rounded-2xl overflow-hidden shadow-lg shadow-orange-500/5">
                    <div className="bg-orange-500/10 p-4 border-b border-orange-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <span className="text-orange-500 font-black uppercase text-sm">{fiado.cliente_nome}</span>
                        <p className="text-xs text-zinc-400">{new Date(fiado.data_criacao).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span className="text-orange-500 font-black text-lg">R$ {Number(fiado.total || 0).toFixed(2)}</span>
                        <button onClick={() => selecionarFiado(fiado)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all">Receber</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isGerente && fiadoModalAberto && fiadoSelecionado && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-orange-500 uppercase italic">Receber Fiado</h3>
              <button onClick={() => setFiadoModalAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <p className="text-zinc-400 text-sm mb-4">Cliente: <span className="font-bold text-white">{fiadoSelecionado.cliente_nome}</span></p>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6">
              <p className="text-zinc-400 text-sm">Total pendente: <span className="font-bold text-orange-500 text-xl">R$ {Number(fiadoSelecionado.total || 0).toFixed(2)}</span></p>
            </div>
            <div className="mb-4">
              <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block mb-2">Valor a pagar (R$)</label>
              <input type="number" step="0.01" min="0" value={valorPagamentoFiado || ""} onChange={(e) => { const val = parseFloat(e.target.value) || 0; setValorPagamentoFiado(val); if (pagamentosFiado.length > 0) { const novos = pagamentosFiado.map((p, i) => i === 0 ? { ...p, valor: val } : p); setPagamentosFiado(novos); } }} placeholder="0,00" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 font-bold text-right outline-none focus:border-orange-500" />
            </div>
            <div className="space-y-4 mb-6">
              <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block">Formas de Pagamento</label>
              {(pagamentosFiado || []).map((pag) => (
                <div key={pag.id} className="flex flex-col md:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <select value={pag.metodo} onChange={(e) => atualizarMetodoPagamentoFiado(pag.id, e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-xs w-full md:w-32 outline-none focus:border-orange-500">
                    <option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="debito">Cartão Débito</option><option value="credito">Cartão Crédito</option>
                  </select>
                  <div className="flex w-full gap-2 items-center">
                    <input type="number" step="0.01" min="0" value={pag.valor || ""} onChange={(e) => { const val = parseFloat(e.target.value) || 0; atualizarValorPagamentoFiado(pag.id, val); }} placeholder="0,00" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold w-full md:w-28 text-right outline-none focus:border-orange-500" />
                    {(pagamentosFiado || []).length > 1 && (<button onClick={() => removerPagamentoFiado(pag.id)} className="text-red-500 hover:text-red-400 text-lg font-black shrink-0 px-2">✕</button>)}
                  </div>
                </div>
              ))}
              <button onClick={adicionarPagamentoFiado} className="text-orange-500 hover:text-orange-400 text-xs font-black uppercase transition-colors">+ Adicionar outra forma</button>
            </div>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 mb-6">
              <div className="flex justify-between"><span className="text-zinc-400 text-sm">Total Pendente:</span><span className="font-bold text-orange-500">R$ {Number(fiadoSelecionado.total || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400 text-sm">Total Pago:</span><span className="font-bold text-green-500">R$ {pagamentosFiado.reduce((acc, p) => acc + (Number(p.valor) || 0), 0).toFixed(2)}</span></div>
              {pagamentosFiado.reduce((acc, p) => acc + (Number(p.valor) || 0), 0) > 0 && (<div className="flex justify-between"><span className="text-zinc-400 text-sm">Saldo Restante:</span><span className="font-bold text-blue-400">R$ {(Number(fiadoSelecionado.total || 0) - pagamentosFiado.reduce((acc, p) => acc + (Number(p.valor) || 0), 0)).toFixed(2)}</span></div>)}
            </div>
            <button onClick={receberFiado} disabled={processando} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl text-lg uppercase italic transition-all shadow-xl disabled:opacity-50">{processando ? "Aguarde..." : "Confirmar Recebimento"}</button>
          </div>
        </div>
      )}

      {/* ========== MODAL ESTOQUE ========== */}
      {isGerente && estoqueAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-emerald-500 uppercase italic">📦 Estoque</h3>
              <button onClick={() => setEstoqueAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <button onClick={() => abrirFormInsumo()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all mb-4 w-full md:w-auto">+ Adicionar Insumo</button>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-zinc-950 text-zinc-500 text-[10px] font-black uppercase border-b border-zinc-800">
                    <tr><th className="p-3">Nome</th><th className="p-3">Unidade</th><th className="p-3 text-right">Estoque</th><th className="p-3 text-right">Custo Unit.</th><th className="p-3 text-center">Ações</th></tr>
                  </thead>
                  <tbody>
                    {(insumos || []).map((i) => (
                      <tr key={i.id} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                        <td className="p-3 font-bold uppercase">{i.nome}</td><td className="p-3 text-zinc-400">{i.unidade}</td><td className="p-3 text-right text-yellow-500 font-black">{i.estoque}</td><td className="p-3 text-right text-zinc-400">R$ {Number(i.custo_unidade || 0).toFixed(2)}</td>
                        <td className="p-3 text-center space-x-2">
                          <button onClick={() => abrirFormInsumo(i)} className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase">Editar</button>
                          <button onClick={() => excluirInsumo(i.id)} disabled={processando} className="text-red-500 hover:text-red-400 text-xs font-black uppercase disabled:opacity-50">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGerente && modalInsumoAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full shadow-2xl p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-black text-emerald-500 uppercase italic mb-6">{insumoEditando ? "Editar Insumo" : "Novo Insumo"}</h3>
            <form onSubmit={(e) => { e.preventDefault(); salvarInsumo(); }} className="space-y-4">
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Nome</label><input type="text" value={formInsumo.nome} onChange={(e) => setFormInsumo({ ...formInsumo, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-emerald-500 outline-none" required /></div>
              <div>
                <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Unidade</label>
                <select value={formInsumo.unidade} onChange={(e) => setFormInsumo({ ...formInsumo, unidade: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-emerald-500 outline-none">
                  <option value="UN">Unidade (UN)</option><option value="KG">Quilograma (KG)</option><option value="G">Grama (G)</option><option value="L">Litro (L)</option><option value="ML">Mililitro (ML)</option>
                </select>
              </div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Estoque Atual</label><input type="number" step="0.01" value={formInsumo.estoque} onChange={(e) => setFormInsumo({ ...formInsumo, estoque: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-emerald-500 outline-none" required /></div>
              <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Custo por Unidade (R$)</label><input type="number" step="0.01" value={formInsumo.custo_unidade} onChange={(e) => setFormInsumo({ ...formInsumo, custo_unidade: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-emerald-500 outline-none" required /></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalInsumoAberto(false)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-sm uppercase tracking-widest transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL PRODUTOS ========== */}
      {isGerente && modalProdutoAberto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 md:p-6">
            <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase italic mb-6">{produtoEditando ? "Editar Produto" : "Novo Produto"}</h3>
            <form onSubmit={(e) => { e.preventDefault(); salvarProduto(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Nome</label><input type="text" value={formProduto.nome} onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none" required /></div>
                <div>
                  <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Categoria</label>
                  <select value={formProduto.categoria} onChange={(e) => setFormProduto({ ...formProduto, categoria: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none">
                    {categorias.filter(c => c !== "Todas").map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div><label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Preço (R$)</label><input type="number" step="0.01" value={formProduto.preco} onChange={(e) => setFormProduto({ ...formProduto, preco: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none" required /></div>
                <div className="flex items-end"><span className="text-xs text-zinc-500 font-bold">Custo estimado: R$ {receitaTemp.reduce((acc, i) => acc + (Number(i.qtd || 0) * Number((insumos || []).find(inss => String(inss.id) === String(i.insumo_id))?.custo_unidade || 0)), 0).toFixed(2)}</span></div>
              </div>

              <div className="border-t border-zinc-800 pt-4 mt-4">
                <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block mb-2">Composição (Receita)</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <select value={ingredienteTemp.insumo_id} onChange={(e) => setIngredienteTemp({ ...ingredienteTemp, insumo_id: e.target.value })} className="flex-1 bg-zinc-950 border border-zinc-800 h-10 rounded-xl px-3 text-zinc-50 font-bold text-sm focus:border-yellow-500 outline-none">
                    <option value="">Selecione o insumo...</option>
                    {(insumos || []).map(i => (<option key={i.id} value={i.id}>{i.nome} ({i.unidade})</option>))}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" placeholder="Qtd" value={ingredienteTemp.qtd} onChange={(e) => setIngredienteTemp({ ...ingredienteTemp, qtd: e.target.value })} className="w-24 bg-zinc-950 border border-zinc-800 h-10 rounded-xl px-3 text-zinc-50 font-bold text-sm text-center focus:border-yellow-500 outline-none" />
                    <button type="button" onClick={adicionarIngrediente} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 h-10 rounded-xl font-black text-xs uppercase transition-all">Add</button>
                  </div>
                </div>
                {receitaTemp.length > 0 ? (
                  <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto space-y-1">
                    {receitaTemp.map((ing, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-zinc-300">{ing.nome}</span>
                        <span className="text-zinc-400">{ing.qtd} {ing.unidade}</span>
                        <button type="button" onClick={() => removerIngrediente(idx)} className="text-red-500 hover:text-red-400 text-xs font-black px-2">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-xs italic">Nenhum insumo adicionado.</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalProdutoAberto(false)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-black py-3 rounded-xl text-sm uppercase tracking-widest transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Salvar Produto"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== CARDÁPIO (Mesa) ========== */}
      {cardapioAberto && (
        <div className="fixed inset-0 bg-black/60 z-40 flex justify-start">
          <div className="bg-zinc-950 w-full md:max-w-md h-full overflow-y-auto border-r border-zinc-800 p-4 md:p-6 animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl md:text-2xl font-black text-yellow-500 uppercase italic">Cardápio</h2>
              <div className="flex gap-2">
                {isGerente && <button onClick={abrirNovoProduto} className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all">+ Novo</button>}
                <button onClick={() => { setCardapioAberto(false); setPedidoAtual([]); }} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
              </div>
            </div>

            <div className="relative mb-4 shrink-0">
              <input type="text" value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Buscar produto..." className="w-full bg-zinc-900 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto mb-6 pb-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categorias.map((cat) => (
                <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all uppercase whitespace-nowrap ${categoriaAtiva === cat ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-lg" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pb-20">
              {(produtosFiltrados || []).length === 0 ? (
                <p className="text-zinc-500 text-center py-8 font-bold text-sm">Nenhum produto encontrado.</p>
              ) : (
                (produtosFiltrados || []).map((prod) => {
                  const qtd = (pedidoAtual || []).find((i) => String(i.id) === String(prod.id))?.quantidade || 0;
                  return (
                    <div key={prod.id} className={`p-4 rounded-xl border transition-all flex justify-between items-center ${qtd > 0 ? "border-yellow-500/40 bg-yellow-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                      <div>
                        <p className="font-black uppercase tracking-tighter text-zinc-100">{prod.nome}</p>
                        <p className="text-yellow-500 font-black text-sm italic">R$ {Number(prod.preco || 0).toFixed(2)}</p>
                        {isGerente && (
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => abrirEdicaoProduto(prod)} className="text-blue-400 hover:text-blue-300 text-[10px] font-black uppercase p-1 -ml-1">Editar</button>
                            <span className="text-zinc-600 text-[10px]">|</span>
                            <button onClick={() => excluirProduto(prod.id)} disabled={processando} className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase flex items-center gap-1 p-1 disabled:opacity-50">🗑️ Excluir</button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                        <button onClick={() => removerItem(prod.id)} className="h-8 w-8 md:h-7 md:w-7 rounded-lg bg-zinc-900 text-red-500 flex items-center justify-center hover:bg-red-500/10 text-lg font-black">-</button>
                        <span className="font-black text-lg italic w-6 text-center">{qtd}</span>
                        <button onClick={() => adicionarItem(prod)} className="h-8 w-8 md:h-7 md:w-7 rounded-lg bg-yellow-500 text-zinc-950 flex items-center justify-center hover:bg-yellow-400 text-lg font-black">+</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 bg-zinc-950 sticky bottom-0 shrink-0">
              <button
                onClick={enviarPedido} disabled={(pedidoAtual || []).length === 0 || processando}
                className={`w-full font-black py-4 rounded-xl uppercase italic tracking-tighter text-base md:text-lg transition-all disabled:opacity-50 ${
                  (pedidoAtual || []).length > 0 ? "bg-yellow-500 text-zinc-950 hover:bg-yellow-400 shadow-xl" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {processando ? "Enviando..." : `Enviar Pedido - R$ ${(pedidoAtual || []).reduce((acc, i) => acc + Number(i.preco || 0) * Number(i.quantidade || 0), 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL COZINHA ========== */}
      {isGerente && cozinhaAberta && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase italic">🍳 Cozinha</h3>
              <button onClick={() => setCozinhaAberta(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
              {(pedidosCozinha || []).length === 0 ? (
                <p className="text-zinc-500 text-center py-8 font-bold uppercase text-sm">Nenhum pedido pendente.</p>
              ) : (
                (pedidosCozinha || []).map((pedido) => (
                  <div key={pedido.id} className="bg-zinc-950 border border-red-500/30 rounded-2xl overflow-hidden shadow-lg shadow-red-500/5">
                    <div className="bg-red-500/10 p-4 border-b border-red-500/20 flex justify-between items-center">
                      <div>
                        <span className="bg-red-500 text-white font-black uppercase text-[10px] px-3 py-1 rounded-md">Mesa {pedido.mesa}</span>
                        <p className="text-xs font-bold text-zinc-300 uppercase ml-2 inline">{pedido.cliente}</p>
                      </div>
                      <span className="text-xs font-black text-red-400">⏱ {pedido.hora}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {pedido?.itens && Array.isArray(pedido.itens) ? pedido.itens.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-yellow-500 italic">x{item.quantidade}</span>
                            <span className="font-bold text-sm uppercase text-zinc-200">{item.nome}</span>
                          </div>
                        </div>
                      )) : null}
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                      <button onClick={() => finalizarPedidoCozinha(pedido.id)} disabled={processando} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl text-sm uppercase italic transition-all flex justify-center items-center gap-2 disabled:opacity-50">✅ {processando ? "Aguarde..." : "Finalizar e Entregar"}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL NOVA MESA ========== */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase italic text-center mb-6">Nova Mesa</h3>
            <form onSubmit={abrirNovaMesa} className="space-y-4">
              <div>
                <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Número da Mesa</label>
                <input type="number" value={numeroMesa} onChange={(e) => setNumeroMesa(e.target.value)} placeholder="Ex: 5" className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed" required />
              </div>
              <div>
                <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Nome do Cliente</label>
                <input type="text" value={clienteMesa} onChange={(e) => setClienteMesa(e.target.value)} placeholder="Ex: João" className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-yellow-500 outline-none" required />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 bg-yellow-500 text-zinc-950 font-black py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Abrir Mesa"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL JUNTAR MESA ========== */}
      {modalJuntarAberto && mesaSelecionada && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-orange-500 uppercase italic mb-4">Juntar Mesas</h3>
            <p className="text-sm text-zinc-400 mb-4">Selecione uma mesa aberta para ser incorporada à <strong>Mesa {mesaSelecionada.numero}</strong>. A mesa selecionada será transferida e encerrada.</p>
            <select
              value={mesaParaJuntar}
              onChange={(e) => setMesaParaJuntar(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 h-12 rounded-xl px-4 text-zinc-50 font-bold focus:border-orange-500 outline-none mb-6"
            >
              <option value="">Selecione a mesa...</option>
              {(mesas || []).filter(m => String(m.id) !== String(mesaSelecionada.id)).map(m => (
                <option key={m.id} value={m.id}>Mesa {m.numero} ({m.cliente}) - R$ {Number(m.total).toFixed(2)}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setModalJuntarAberto(false)} className="flex-1 bg-zinc-800 text-zinc-400 font-black py-3 rounded-xl text-sm uppercase transition-all hover:bg-zinc-700">Cancelar</button>
              <button onClick={confirmarJuntarMesa} disabled={!mesaParaJuntar || processando} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl text-sm uppercase disabled:opacity-50">Juntar</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== FICHA DA MESA ========== */}
      {fichaAberta && mesaSelecionada && (
        <div className="fixed inset-0 bg-black/60 z-30 flex justify-end">
          <div className="bg-zinc-950 w-full md:max-w-md h-full overflow-y-auto border-l border-zinc-800 p-4 md:p-6 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-yellow-500 italic uppercase">Mesa {mesaSelecionada.numero}</h2>
                <p className="text-zinc-400 text-sm font-bold truncate max-w-[200px]">{mesaSelecionada.cliente}</p>
              </div>
              <button onClick={() => setFichaAberta(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl p-2 -mr-2">✕</button>
            </div>

            <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
              {mesaSelecionada?.itens && Array.isArray(mesaSelecionada.itens) && mesaSelecionada.itens.length > 0 ? (
                mesaSelecionada.itens.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-yellow-500 italic">x{item.quantidade}</span>
                      <span className="font-bold text-xs md:text-sm uppercase text-zinc-200">{item.nome}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 font-bold text-xs shrink-0">R$ {(Number(item.preco || 0) * Number(item.quantidade || 0)).toFixed(2)}</span>
                      <button 
                        onClick={() => removerItemDaMesa(mesaSelecionada.id, idx, item)} 
                        disabled={processando} 
                        className="text-red-500 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors disabled:opacity-50" 
                        title="Excluir este item e devolver ao estoque"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 italic text-sm font-bold text-center py-6">Nenhum pedido ainda.</p>
              )}
            </div>

            <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mb-6 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-bold uppercase text-xs">Total</span>
                <span className="text-2xl font-black text-yellow-500 italic">R$ {Number(mesaSelecionada.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 shrink-0 pb-6">
              <div className="flex gap-2">
                <button onClick={() => { setCardapioAberto(true); setFichaAberta(false); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all">+ Adicionar Item</button>
                <button onClick={() => setModalJuntarAberto(true)} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all">🔗 Juntar Mesa</button>
              </div>
              <button onClick={() => imprimirComandaCozinha(mesaSelecionada)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all">📄 Comanda Cozinha</button>
              <button onClick={() => { setFichaAberta(false); abrirCheckout(mesaSelecionada); }} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs transition-all">Fechar Conta</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CHECKOUT MODAL ========== */}
      {checkoutAberto && mesaSelecionada && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase italic">Mesa {mesaSelecionada.numero}</h3>
              <button onClick={() => setCheckoutAberto(false)} className="text-zinc-500 hover:text-zinc-300 text-2xl">✕</button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-6">
              <p className="text-zinc-400 text-sm">Cliente: <span className="font-bold text-zinc-200">{mesaSelecionada.cliente}</span></p>
              <p className="text-zinc-400 text-sm">Total da conta: <span className="font-bold text-yellow-500 text-xl md:text-2xl">R$ {Number(mesaSelecionada.total || 0).toFixed(2)}</span></p>
            </div>

            {/* RESUMO DOS ITENS */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-4 max-h-32 overflow-y-auto">
              <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest mb-2">Resumo dos Itens ({mesaSelecionada?.itens?.length || 0})</p>
              {mesaSelecionada?.itens?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-xs text-zinc-400 mb-1 border-b border-zinc-800/50 pb-1 last:border-0 last:mb-0 last:pb-0">
                  <span>{item.quantidade}x {item.nome}</span>
                  <span>R$ {(Number(item.preco || 0) * Number(item.quantidade || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-4">
              <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block mb-2">Dividir igual entre pessoas</label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="20" value={numeroPessoas} onChange={(e) => setNumeroPessoas(Math.max(1, parseInt(e.target.value) || 1))} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold w-16 md:w-20 text-center outline-none focus:border-yellow-500" />
                <span className="text-zinc-400 text-xs md:text-sm">pessoas</span>
                <button onClick={dividirIgualmente} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap">Dividir</button>
              </div>
              {dividirIgual && <p className="text-green-500 text-xs mt-2 font-bold">✓ Valores divididos entre {numeroPessoas}</p>}
            </div>

            <div className="space-y-4 mb-6">
              <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block">Pagamentos / Parcelas</label>
              {(pagamentos || []).map((pag) => (
                <div key={pag.id} className="flex flex-col md:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <select value={pag.metodo} onChange={(e) => atualizarMetodoPagamento(pag.id, e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-xs w-full md:w-32 outline-none focus:border-yellow-500">
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="debito">Débito</option>
                    <option value="credito">Crédito</option>
                    <option value="fiado">Fiado</option>
                  </select>

                  <div className="flex w-full gap-2 items-center">
                    {pag.metodo === 'fiado' && (
                      <input type="text" placeholder="Nome Fiado" value={pag.clienteFiado || ""} onChange={(e) => atualizarClienteFiado(pag.id, e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold w-full md:w-32 text-xs outline-none focus:border-orange-500" />
                    )}
                    <input type="number" step="0.01" min="0" value={pag.valor || ""} onChange={(e) => atualizarValorPagamento(pag.id, parseFloat(e.target.value) || 0)} placeholder="0,00" className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold w-full md:w-28 text-right outline-none focus:border-yellow-500" />
                    {(pagamentos || []).length > 1 && <button onClick={() => removerPagamento(pag.id)} className="text-red-500 hover:text-red-400 text-lg font-black shrink-0 px-2">✕</button>}
                  </div>
                  <button onClick={() => pagarParcela(pag.id)} disabled={processando} className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase transition-all disabled:opacity-50">{processando ? "..." : "Pagar agora"}</button>
                </div>
              ))}
              <button onClick={adicionarPagamento} className="text-yellow-500 hover:text-yellow-400 text-xs font-black uppercase transition-colors">+ Adicionar parcela</button>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2 mb-6">
              <div className="flex justify-between"><span className="text-zinc-400 text-sm">Total Pago:</span><span className="font-bold text-green-500">R$ {totalPago.toFixed(2)}</span></div>
              {saldoRestante > 0 && <div className="flex justify-between"><span className="text-zinc-400 text-sm">Saldo Restante:</span><span className="font-bold text-orange-500">R$ {saldoRestante.toFixed(2)}</span></div>}
              {troco > 0 && <div className="flex justify-between"><span className="text-zinc-400 text-sm">Troco:</span><span className="font-bold text-blue-400">R$ {troco.toFixed(2)}</span></div>}
            </div>

            {/* Finalização Global */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 mb-4">
              <label className="text-zinc-500 font-black uppercase text-[10px] tracking-widest block mb-2">Vincular Cliente da Mesa (opcional)</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text" placeholder="Buscar cliente..." value={buscaCliente}
                    onChange={(e) => { setBuscaCliente(e.target.value); setClienteSelecionadoId(""); }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-sm outline-none focus:border-yellow-500"
                  />
                  {buscaCliente && (clientesFiltrados || []).length > 0 && !clienteSelecionadoId && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl max-h-40 overflow-y-auto z-10 shadow-xl">
                      {(clientesFiltrados || []).map((c) => (
                        <div key={c.id} onClick={() => selecionarCliente(c.id, c.nome)} className="px-3 py-3 hover:bg-zinc-700 cursor-pointer text-zinc-200 font-bold text-sm border-b border-zinc-700 last:border-none">{c.nome}</div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { setMostrarNovoCliente(!mostrarNovoCliente); if (!mostrarNovoCliente) { setClienteSelecionadoId(""); setBuscaCliente(""); } }} className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-lg text-xs font-black uppercase transition-all shrink-0">+ Novo</button>
              </div>
              {clienteSelecionadoId && <p className="text-green-500 text-xs mt-2 font-bold">✓ Cliente selecionado</p>}
              {mostrarNovoCliente && (
                <div className="mt-3 p-3 bg-zinc-900 rounded-xl border border-pink-500/30 space-y-2 animate-in fade-in">
                  <input type="text" placeholder="Nome *" value={novoClienteForm.nome} onChange={(e) => setNovoClienteForm({ ...novoClienteForm, nome: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-sm outline-none focus:border-pink-500" />
                  <input type="text" placeholder="Telefone" value={novoClienteForm.telefone} onChange={(e) => setNovoClienteForm({ ...novoClienteForm, telefone: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-sm outline-none focus:border-pink-500" />
                  <input type="email" placeholder="Email" value={novoClienteForm.email} onChange={(e) => setNovoClienteForm({ ...novoClienteForm, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-sm outline-none focus:border-pink-500" />
                  <input type="date" value={novoClienteForm.data_nascimento} onChange={(e) => setNovoClienteForm({ ...novoClienteForm, data_nascimento: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 font-bold text-sm outline-none focus:border-pink-500" />
                  <button onClick={criarClienteRapido} disabled={processando} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-2 rounded-lg text-sm uppercase transition-all disabled:opacity-50">{processando ? "Aguarde..." : "Cadastrar e vincular"}</button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-orange-950/10 border border-orange-500/30 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="fiadoAuto" checked={fiadoAutomatico} onChange={(e) => setFiadoAutomatico(e.target.checked)} className="accent-orange-500 w-4 h-4 shrink-0" />
                  <label htmlFor="fiadoAuto" className="text-orange-400 text-xs md:text-sm font-bold leading-tight">Lançar saldo total restante no fiado geral</label>
                </div>
                {fiadoAutomatico && <input type="text" value={clienteNomeFiado} onChange={(e) => setClienteNomeFiado(e.target.value)} placeholder="Nome do devedor" className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-zinc-200 text-sm w-full sm:w-40 outline-none focus:border-orange-500" />}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={finalizarCheckout} disabled={processando} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 md:py-5 rounded-xl text-base md:text-lg uppercase italic transition-all shadow-xl disabled:opacity-50">{processando ? "Aguarde..." : "Finalizar Conta"}</button>
            </div>
          </div>
        </div>
      )}

      {comandaAberta && dadosComanda && (
        <ComandaTermica
          tipo={dadosComanda.tipo}
          mesa={dadosComanda.mesa}
          cliente={dadosComanda.cliente}
          itens={dadosComanda.itens}
          total={dadosComanda.total}
          pagamentos={dadosComanda.pagamentos}
          hora={dadosComanda.hora}
          onClose={() => setComandaAberta(false)}
        />
      )}
    </div>
  );
}
