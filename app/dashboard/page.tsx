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
  const [carregando, setCarregando] = useState(true);

  // Estados dos modais
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

  // Estados do checkout
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([
    { id: 1, metodo: "dinheiro", valor: 0 },
  ]);
  const [totalPago, setTotalPago] = useState(0);
  const [saldoRestante, setSaldoRestante] = useState(0);
  const [troco, setTroco] = useState(0);
  const [fiadoAutomatico, setFiadoAutomatico] = useState(false);
  const [clienteNomeFiado, setClienteNomeFiado] = useState("");
  const [manterMesaAberta, setManterMesaAberta] = useState(false);
  const [numeroPessoas, setNumeroPessoas] = useState(1);
  const [dividirIgual, setDividirIgual] = useState(false);

  // Estados para clientes (checkout)
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>("");
  const [buscaCliente, setBuscaCliente] = useState("");
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

  // Estados para impressão (comanda térmica)
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
  const [formGarcom, setFormGarcom] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [cadastrandoGarcom, setCadastrandoGarcom] = useState(false);

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

  // Carrega dados iniciais (sem limites)
  useEffect(() => {
    const user = localStorage.getItem("usuario");
    if (!user) {
      router.push("/");
      return;
    }
    setUsuario(JSON.parse(user));
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: mesasData, error: errMesas } = await supabase
        .from("mesas")
        .select("*")
        .eq("status", "ocupada")
        .order("numero", { ascending: true });

      if (errMesas) throw new Error("Erro ao buscar mesas: " + errMesas.message);
      setMesas(mesasData || []);

      const { data: produtosData, error: errProdutos } = await supabase
        .from("produtos")
        .select("*")
        .order("nome");
      if (errProdutos) throw new Error("Erro ao buscar produtos: " + errProdutos.message);
      setProdutos(produtosData || []);

      const { data: insumosData, error: errInsumos } = await supabase
        .from("insumos")
        .select("*")
        .order("nome");
      if (errInsumos) throw new Error("Erro ao buscar insumos: " + errInsumos.message);
      setInsumos(insumosData || []);

      const { data: cozinhaData, error: errCozinha } = await supabase
        .from("pedidos_cozinha")
        .select("*")
        .order("created_at", { ascending: true });
      if (errCozinha) throw new Error("Erro ao buscar pedidos da cozinha: " + errCozinha.message);
      setPedidosCozinha(cozinhaData || []);

      // Fiados: sem limite (todos)
      const { data: fiadosData, error: errFiados } = await supabase
        .from("fiados")
        .select("*")
        .order("data_criacao", { ascending: false });
      if (errFiados) throw new Error("Erro ao buscar fiados: " + errFiados.message);
      setFiados(fiadosData || []);

      // Clientes: sem limite (todos)
      const { data: clientesData, error: errClientes } = await supabase
        .from("clientes")
        .select("*")
        .order("nome", { ascending: true });
      if (errClientes) throw new Error("Erro ao buscar clientes: " + errClientes.message);
      setClientes(clientesData || []);
      setClientesFiltrados(clientesData || []);
    } catch (err: any) {
      alert("Erro ao carregar dados: " + err.message);
    } finally {
      setCarregando(false);
    }
  }

  // Realtime (sem limites)
  useEffect(() => {
    if (!usuario) return;

    const canal = supabase
      .channel("bar-praca-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mesas" },
        () => {
          supabase
            .from("mesas")
            .select("*")
            .eq("status", "ocupada")
            .order("numero", { ascending: true })
            .then(({ data }) => {
              if (data) setMesas(data);
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos_cozinha" },
        (payload) => {
          setPedidosCozinha((prev) => [...prev, payload.new]);
          if (usuario.role === "gerente") tocarSomAlerta();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "pedidos_cozinha" },
        (payload) => {
          setPedidosCozinha((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fiados" },
        () => {
          supabase
            .from("fiados")
            .select("*")
            .order("data_criacao", { ascending: false })
            .then(({ data }) => {
              if (data) setFiados(data);
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "insumos" },
        () => {
          supabase
            .from("insumos")
            .select("*")
            .order("nome")
            .then(({ data }) => {
              if (data) setInsumos(data);
            });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
        () => {
          supabase
            .from("clientes")
            .select("*")
            .order("nome", { ascending: true })
            .then(({ data }) => {
              if (data) {
                setClientes(data);
                setClientesFiltrados(data);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario]);

  // ========== BUSCA DE CLIENTES COM DEBOUNCE (VIA SUPABASE) ==========
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!buscaCliente.trim()) {
        setClientesFiltrados(clientes);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .ilike("nome", `%${buscaCliente.trim()}%`)
          .order("nome", { ascending: true })
          .limit(20);

        if (error) throw error;
        setClientesFiltrados(data || []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      }
    }, 300); // debounce

    return () => clearTimeout(delayDebounce);
  }, [buscaCliente]);

  // ========== FUNÇÕES DE NEGÓCIO ==========
  // (mantidas exatamente como estavam – não houve alteração na lógica)

  async function abrirNovaMesa(e: React.FormEvent) {
    e.preventDefault();
    if (!numeroMesa || !clienteMesa) {
      alert("Preencha todos os campos.");
      return;
    }

    const num = parseInt(numeroMesa);
    if (isNaN(num) || num <= 0) {
      alert("Número de mesa inválido.");
      return;
    }

    try {
      const { data: mesaExistente, error: errBusca } = await supabase
        .from("mesas")
        .select("*")
        .eq("numero", num)
        .maybeSingle();

      if (errBusca) throw errBusca;

      if (mesaExistente) {
        if (mesaExistente.status === "ocupada") {
          alert("Esta mesa já está ocupada.");
          return;
        }
        const { data: mesaAtualizada, error: errUpdate } = await supabase
          .from("mesas")
          .update({ status: "ocupada", cliente: clienteMesa, total: 0, itens: [] })
          .eq("id", mesaExistente.id)
          .select()
          .single();

        if (errUpdate) throw errUpdate;

        setMesas((prev) => {
          const existe = prev.some((m) => m.id === mesaExistente.id);
          if (existe) {
            return prev.map((m) => (m.id === mesaExistente.id ? mesaAtualizada : m));
          } else {
            return [...prev, mesaAtualizada];
          }
        });

        setModalAberto(false);
        setNumeroMesa("");
        setClienteMesa("");
      } else {
        const { data: novaMesa, error: errInsert } = await supabase
          .from("mesas")
          .insert([{ numero: num, status: "ocupada", cliente: clienteMesa, total: 0, itens: [] }])
          .select()
          .single();

        if (errInsert) throw errInsert;

        setMesas((prev) => [...prev, novaMesa]);
        setModalAberto(false);
        setNumeroMesa("");
        setClienteMesa("");
      }
    } catch (err: any) {
      alert("Erro ao abrir mesa: " + err.message);
    }
  }

  function abrirFicha(mesa: any) {
    if (mesa.status === "livre") {
      setNumeroMesa(mesa.numero.toString());
      setClienteMesa("");
      setModalAberto(true);
      return;
    }
    setMesaSelecionada(mesa);
    setFichaAberta(true);
  }

  function adicionarItem(produto: any) {
    setPedidoAtual((prev) => {
      const existente = prev.find((i) => i.id === produto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
        );
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }

  function removerItem(id: string) {
    setPedidoAtual((prev) => {
      const existente = prev.find((i) => i.id === id);
      if (existente && existente.quantidade > 1) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantidade: i.quantidade - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== id);
    });
  }

  // ========== ENVIAR PEDIDO ==========
  async function enviarPedido() {
    if (!mesaSelecionada || pedidoAtual.length === 0) return;

    let faltaEstoque = false;
    for (const item of pedidoAtual) {
      const produto = produtos.find((p) => p.id === item.id);
      if (!produto || !produto.receita || produto.receita.length === 0) continue;

      for (const ing of produto.receita) {
        const insumo = insumos.find((i) => i.id === ing.insumo_id);
        if (!insumo) continue;
        const qtdNecessaria = parseFloat(ing.qtd) * item.quantidade;
        if (insumo.estoque < qtdNecessaria) {
          faltaEstoque = true;
          alert(`⚠️ Estoque insuficiente para "${produto.nome}".\nInsumo: ${insumo.nome} (disponível: ${insumo.estoque}, necessário: ${qtdNecessaria})\nO pedido será enviado mesmo assim, mas o estoque ficará negativo.`);
        }
      }
    }

    if (faltaEstoque) {
      const continuar = confirm("Há itens com estoque insuficiente. Deseja continuar com o pedido?");
      if (!continuar) return;
    }

    const totalRemessa = pedidoAtual.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const totalNovo = Number(mesaSelecionada.total) + totalRemessa;
    const itensAntigos = mesaSelecionada.itens || [];
    let itensAtualizados = [...itensAntigos];

    pedidoAtual.forEach((itemNovo) => {
      const index = itensAtualizados.findIndex((i: any) => i.id === itemNovo.id);
      if (index >= 0) {
        itensAtualizados[index].quantidade += itemNovo.quantidade;
      } else {
        itensAtualizados.push({ ...itemNovo });
      }
    });

    const pedidoCozinha = {
      id: Date.now().toString(),
      mesa: mesaSelecionada.numero.toString(),
      cliente: mesaSelecionada.cliente,
      itens: pedidoAtual,
      hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      const { error: errMesa } = await supabase
        .from("mesas")
        .update({ total: totalNovo, itens: itensAtualizados })
        .eq("id", mesaSelecionada.id);

      if (errMesa) throw errMesa;

      const { error: errCozinha } = await supabase
        .from("pedidos_cozinha")
        .insert([pedidoCozinha]);

      if (errCozinha) throw errCozinha;

      for (const item of pedidoAtual) {
        const produto = produtos.find((p) => p.id === item.id);
        if (!produto || !produto.receita || produto.receita.length === 0) continue;

        for (const ing of produto.receita) {
          const insumo = insumos.find((i) => i.id === ing.insumo_id);
          if (!insumo) continue;
          const qtdUsada = parseFloat(ing.qtd) * item.quantidade;
          const novoEstoque = insumo.estoque - qtdUsada;

          const { error: errEstoque } = await supabase
            .from("insumos")
            .update({ estoque: novoEstoque })
            .eq("id", insumo.id);

          if (errEstoque) throw errEstoque;

          setInsumos((prev) =>
            prev.map((i) =>
              i.id === insumo.id ? { ...i, estoque: novoEstoque } : i
            )
          );
        }
      }

      setPedidosCozinha((prev) => [...prev, pedidoCozinha]);
      setMesas((prev) =>
        prev.map((m) =>
          m.id === mesaSelecionada.id
            ? { ...m, total: totalNovo, itens: itensAtualizados }
            : m
        )
      );
      setMesaSelecionada((prev: any) => ({
        ...prev,
        total: totalNovo,
        itens: itensAtualizados,
      }));
      setPedidoAtual([]);
      setCardapioAberto(false);
      if (usuario?.role === "gerente") tocarSomAlerta();
    } catch (err: any) {
      alert("Erro ao enviar pedido: " + err.message);
    }
  }

  async function finalizarPedidoCozinha(id: string) {
    try {
      const { error } = await supabase.from("pedidos_cozinha").delete().eq("id", id);
      if (error) throw error;
      setPedidosCozinha((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Erro ao finalizar pedido: " + err.message);
    }
  }

  // ========== FUNÇÕES DO CHECKOUT ==========

  function abrirCheckout(mesa: any) {
    setMesaSelecionada(mesa);
    setPagamentos([{ id: 1, metodo: "dinheiro", valor: 0 }]);
    setTotalPago(0);
    setSaldoRestante(Number(mesa.total));
    setTroco(0);
    setFiadoAutomatico(false);
    setClienteNomeFiado(mesa.cliente || "Consumidor");
    setManterMesaAberta(false);
    setNumeroPessoas(1);
    setDividirIgual(false);
    setClienteSelecionadoId("");
    setBuscaCliente("");
    setMostrarNovoCliente(false);
    setNovoClienteForm({ nome: "", telefone: "", email: "", data_nascimento: "" });
    setClientesFiltrados(clientes);
    setCheckoutAberto(true);
  }

  function adicionarPagamento() {
    const novoId = pagamentos.length > 0 ? Math.max(...pagamentos.map(p => p.id)) + 1 : 1;
    setPagamentos([...pagamentos, { id: novoId, metodo: "dinheiro", valor: 0 }]);
  }

  function removerPagamento(id: number) {
    if (pagamentos.length <= 1) {
      alert("Deve haver pelo menos uma forma de pagamento.");
      return;
    }
    setPagamentos(pagamentos.filter(p => p.id !== id));
    recalcularTotais(pagamentos.filter(p => p.id !== id));
  }

  function atualizarValorPagamento(id: number, valor: number) {
    const novosPagamentos = pagamentos.map(p =>
      p.id === id ? { ...p, valor: Math.max(0, valor) } : p
    );
    setPagamentos(novosPagamentos);
    recalcularTotais(novosPagamentos);
  }

  function atualizarMetodoPagamento(id: number, metodo: string) {
    setPagamentos(pagamentos.map(p =>
      p.id === id ? { ...p, metodo } : p
    ));
  }

  function recalcularTotais(pagamentosAtuais: any[]) {
    const soma = pagamentosAtuais.reduce((acc, p) => acc + (p.valor || 0), 0);
    const totalMesa = Number(mesaSelecionada?.total) || 0;
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
    const total = Number(mesaSelecionada?.total) || 0;
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
      pessoa: i + 1,
    }));

    setPagamentos(novosPagamentos);
    recalcularTotais(novosPagamentos);
    setDividirIgual(true);
  }

  async function pagarParcela(id: number) {
    if (!mesaSelecionada) return;

    const pagamento = pagamentos.find(p => p.id === id);
    if (!pagamento) return;
    const valorPago = pagamento.valor;
    if (valorPago <= 0) {
      alert("Informe um valor para este pagamento.");
      return;
    }

    const totalMesa = Number(mesaSelecionada.total);
    if (valorPago > totalMesa) {
      alert("O valor não pode ser maior que o total da mesa.");
      return;
    }

    try {
      const itensVenda = mesaSelecionada.itens || [];
      const custoEstimado = valorPago * 0.4;
      const lucroEstimado = valorPago * 0.6;

      const { error: errVenda } = await supabase
        .from("vendas")
        .insert([{
          total_venda: valorPago,
          custo_total: custoEstimado,
          lucro_total: lucroEstimado,
          cliente_nome: `${mesaSelecionada.cliente} (Parcial)`,
          mesa_numero: mesaSelecionada.numero,
          itens: itensVenda,
          pagamentos: [pagamento],
        }]);

      if (errVenda) throw errVenda;

      const novoTotal = parseFloat((totalMesa - valorPago).toFixed(2));

      if (novoTotal <= 0.01) {
        await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
        setMesas(prev => prev.filter(m => m.id !== mesaSelecionada.id));
        setMesaSelecionada(null);
        setFichaAberta(false);
        setCheckoutAberto(false);
        alert(`Pagamento de R$ ${valorPago.toFixed(2)} realizado. Mesa encerrada.`);
      } else {
        const { error: errUpdate } = await supabase
          .from("mesas")
          .update({ total: novoTotal })
          .eq("id", mesaSelecionada.id);

        if (errUpdate) throw errUpdate;

        setMesas(prev =>
          prev.map(m =>
            m.id === mesaSelecionada.id
              ? { ...m, total: novoTotal }
              : m
          )
        );
        setMesaSelecionada((prev: any) => ({ ...prev, total: novoTotal }));

        const novosPagamentos = pagamentos.filter(p => p.id !== id);
        setPagamentos(novosPagamentos);
        recalcularTotais(novosPagamentos);
        alert(`Pagamento de R$ ${valorPago.toFixed(2)} realizado. Saldo restante: R$ ${novoTotal.toFixed(2)}`);
      }
    } catch (err: any) {
      alert("Erro ao registrar pagamento parcial: " + err.message);
    }
  }

  // ===== FUNÇÃO PARA CRIAR NOVO CLIENTE RÁPIDO NO CHECKOUT =====
  async function criarClienteRapido() {
    const { nome, telefone, email, data_nascimento } = novoClienteForm;
    if (!nome.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("clientes")
        .insert([{
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          data_nascimento: data_nascimento || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setClientes(prev => [...prev, data]);
      setClientesFiltrados(prev => [...prev, data]);
      setClienteSelecionadoId(data.id);
      setBuscaCliente(data.nome);
      setMostrarNovoCliente(false);
      setNovoClienteForm({ nome: "", telefone: "", email: "", data_nascimento: "" });
      alert("Cliente cadastrado e vinculado à conta!");
    } catch (err: any) {
      alert("Erro ao criar cliente: " + err.message);
    }
  }

  // ===== FUNÇÃO FINALIZAR CHECKOUT =====
  async function finalizarCheckout() {
    if (!mesaSelecionada) return;

    const totalMesa = Number(mesaSelecionada.total);
    const somaPago = totalPago;

    if (totalMesa === 0) {
      await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
      setMesas(prev => prev.filter(m => m.id !== mesaSelecionada.id));
      setMesaSelecionada(null);
      setFichaAberta(false);
      setCheckoutAberto(false);
      alert("Mesa vazia removida com sucesso!");
      return;
    }

    const temPagamento = pagamentos.some(p => p.valor > 0);
    if (!temPagamento && !fiadoAutomatico) {
      alert("Informe pelo menos um valor de pagamento ou marque a opção de fiado.");
      return;
    }

    let valorFiado = 0;
    if (fiadoAutomatico) {
      valorFiado = totalMesa - somaPago;
      if (valorFiado < 0) valorFiado = 0;
    } else if (manterMesaAberta && somaPago < totalMesa) {
      valorFiado = totalMesa - somaPago;
    }

    if (fiadoAutomatico && somaPago === 0) {
      valorFiado = totalMesa;
    }

    try {
      const itensVenda = mesaSelecionada.itens || [];

      if (somaPago > 0) {
        const custoEstimado = somaPago * 0.4;
        const lucroEstimado = somaPago * 0.6;

        const clienteId = clienteSelecionadoId || null;

        const { error: errVenda } = await supabase
          .from("vendas")
          .insert([{
            total_venda: somaPago,
            custo_total: custoEstimado,
            lucro_total: lucroEstimado,
            cliente_nome: mesaSelecionada.cliente || "Consumidor",
            mesa_numero: mesaSelecionada.numero,
            itens: itensVenda,
            pagamentos: pagamentos,
            cliente_id: clienteId,
          }]);

        if (errVenda) throw errVenda;
      }

      if (valorFiado > 0.01) {
        const nomeFiado = clienteNomeFiado.trim().toUpperCase();
        const { data: fiadoExistente } = await supabase
          .from("fiados")
          .select("*")
          .ilike("cliente_nome", nomeFiado)
          .maybeSingle();

        if (fiadoExistente) {
          const novoTotal = Number(fiadoExistente.total) + valorFiado;
          let itensAtuais = fiadoExistente.itens || [];
          itensVenda.forEach((itemNovo: any) => {
            const existente = itensAtuais.find((i: any) => i.id === itemNovo.id);
            if (existente) {
              existente.quantidade += itemNovo.quantidade;
            } else {
              itensAtuais.push({ ...itemNovo });
            }
          });
          await supabase
            .from("fiados")
            .update({ total: novoTotal, itens: itensAtuais })
            .eq("id", fiadoExistente.id);
          setFiados(prev => prev.map(f =>
            f.id === fiadoExistente.id ? { ...f, total: novoTotal, itens: itensAtuais } : f
          ));
        } else {
          const { data: novoRegistro, error: errInsert } = await supabase
            .from("fiados")
            .insert([{
              cliente_nome: nomeFiado,
              total: valorFiado,
              itens: itensVenda,
            }])
            .select()
            .single();
          if (errInsert) throw errInsert;
          setFiados(prev => [novoRegistro, ...prev]);
        }
      }

      if (manterMesaAberta && valorFiado > 0) {
        const novoTotal = valorFiado;
        const { error: errUpdate } = await supabase
          .from("mesas")
          .update({ total: novoTotal })
          .eq("id", mesaSelecionada.id);

        if (errUpdate) throw errUpdate;

        setMesas(prev =>
          prev.map(m =>
            m.id === mesaSelecionada.id
              ? { ...m, total: novoTotal }
              : m
          )
        );
        setMesaSelecionada((prev: any) => ({ ...prev, total: novoTotal }));
        setFichaAberta(false);
        setCheckoutAberto(false);
        alert(`Pagamento parcial de R$ ${somaPago.toFixed(2)} realizado. Mesa mantida aberta com saldo de R$ ${novoTotal.toFixed(2)}.`);
      } else {
        await supabase.from("mesas").delete().eq("id", mesaSelecionada.id);
        setMesas(prev => prev.filter(m => m.id !== mesaSelecionada.id));
        setMesaSelecionada(null);
        setFichaAberta(false);
        setCheckoutAberto(false);
        alert("Conta finalizada com sucesso!");
      }
    } catch (err: any) {
      alert("Erro ao finalizar conta: " + err.message);
    }
  }

  // ========== FUNÇÕES DO GERENCIADOR DE FIADOS ==========

  function abrirFiados() {
    setFiadosAberto(true);
  }

  function selecionarFiado(fiado: any) {
    const itensDesmembrados: any[] = [];
    if (fiado.itens && Array.isArray(fiado.itens)) {
      fiado.itens.forEach((item: any) => {
        for (let i = 0; i < (item.quantidade || 1); i++) {
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
    const totalItens = fiadoSelecionado.itensDesmembrados?.length || 0;
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

    if (!confirm(`Remover "${item.nome}" (R$ ${item.preco.toFixed(2)}) do fiado?`)) return;

    try {
      const novosDesmembrados = fiadoSelecionado.itensDesmembrados.filter((_, i) => i !== idx);
      const itensAgrupados: any[] = [];
      novosDesmembrados.forEach((i: any) => {
        const existente = itensAgrupados.find((x) => x.id === i.id);
        if (existente) {
          existente.quantidade += 1;
        } else {
          itensAgrupados.push({ ...i, quantidade: 1 });
        }
      });
      const novoTotal = itensAgrupados.reduce((acc, i) => acc + (i.preco * i.quantidade), 0);

      const { error } = await supabase
        .from("fiados")
        .update({ itens: itensAgrupados, total: novoTotal })
        .eq("id", fiadoSelecionado.id);

      if (error) throw error;

      setFiados(prev => prev.map(f =>
        f.id === fiadoSelecionado.id ? { ...f, itens: itensAgrupados, total: novoTotal } : f
      ));
      setFiadoSelecionado((prev: any) => ({
        ...prev,
        itensDesmembrados: novosDesmembrados,
        total: novoTotal,
        itens: itensAgrupados,
      }));
      setItensSelecionadosFiado([]);
      alert("Item removido do fiado.");
    } catch (err: any) {
      alert("Erro ao excluir item: " + err.message);
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
    setPagamentosFiado(pagamentosFiado.filter(p => p.id !== id));
  }

  function atualizarValorPagamentoFiado(id: number, valor: number) {
    setPagamentosFiado(prev => prev.map(p =>
      p.id === id ? { ...p, valor: Math.max(0, valor) } : p
    ));
    const soma = pagamentosFiado.reduce((acc, p) => acc + (p.valor || 0), 0);
    setValorPagamentoFiado(soma);
  }

  function atualizarMetodoPagamentoFiado(id: number, metodo: string) {
    setPagamentosFiado(prev => prev.map(p =>
      p.id === id ? { ...p, metodo } : p
    ));
  }

  async function receberFiado() {
    if (!fiadoSelecionado) return;

    const totalPendente = Number(fiadoSelecionado.total);
    const somaPago = pagamentosFiado.reduce((acc, p) => acc + (p.valor || 0), 0);

    if (somaPago === 0) {
      alert("Informe o valor a ser pago.");
      return;
    }

    if (somaPago > totalPendente) {
      alert(`O valor pago (R$ ${somaPago.toFixed(2)}) não pode ser maior que o total pendente (R$ ${totalPendente.toFixed(2)}).`);
      return;
    }

    try {
      const custoEstimado = somaPago * 0.4;
      const lucroEstimado = somaPago * 0.6;

      const { error: errVenda } = await supabase
        .from("vendas")
        .insert([{
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
        await supabase.from("fiados").delete().eq("id", fiadoSelecionado.id);
        setFiados(prev => prev.filter(f => f.id !== fiadoSelecionado.id));
      } else {
        const { error: errUpdate } = await supabase
          .from("fiados")
          .update({ total: novoTotal })
          .eq("id", fiadoSelecionado.id);

        if (errUpdate) throw errUpdate;
        setFiados(prev => prev.map(f =>
          f.id === fiadoSelecionado.id ? { ...f, total: novoTotal } : f
        ));
      }

      setFiadoModalAberto(false);
      setFiadoSelecionado(null);
      setItensSelecionadosFiado([]);
      setPagamentosFiado([{ id: 1, metodo: "dinheiro", valor: 0 }]);
      alert(`Pagamento de R$ ${somaPago.toFixed(2)} recebido com sucesso!`);
    } catch (err: any) {
      alert("Erro ao receber fiado: " + err.message);
    }
  }

  // ========== FUNÇÕES DE IMPRESSÃO ==========

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
      total: Number(mesa.total),
      pagamentos: pagamentosRealizados || [],
    });
    setComandaAberta(true);
  }

  // ========== FUNÇÕES DE GERENCIAMENTO DE ESTOQUE ==========

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
        nome: insumo.nome,
        unidade: insumo.unidade || "UN",
        estoque: String(insumo.estoque),
        custo_unidade: String(insumo.custo_unidade),
      });
    } else {
      setInsumoEditando(null);
      setFormInsumo({ nome: "", unidade: "UN", estoque: "", custo_unidade: "" });
    }
    setModalInsumoAberto(true);
  }

  async function salvarInsumo() {
    try {
      const { nome, unidade, estoque, custo_unidade } = formInsumo;
      if (!nome || !unidade) {
        alert("Nome e unidade são obrigatórios.");
        return;
      }
      const estoqueNum = parseFloat(estoque) || 0;
      const custoNum = parseFloat(custo_unidade) || 0;

      if (insumoEditando) {
        const { error } = await supabase
          .from("insumos")
          .update({ nome, unidade, estoque: estoqueNum, custo_unidade: custoNum })
          .eq("id", insumoEditando.id);
        if (error) throw error;
        setInsumos(prev =>
          prev.map(i => i.id === insumoEditando.id ? { ...i, nome, unidade, estoque: estoqueNum, custo_unidade: custoNum } : i)
        );
      } else {
        const { data, error } = await supabase
          .from("insumos")
          .insert([{ nome, unidade, estoque: estoqueNum, custo_unidade: custoNum }])
          .select()
          .single();
        if (error) throw error;
        setInsumos(prev => [...prev, data]);
      }
      setModalInsumoAberto(false);
      alert("Insumo salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar insumo: " + err.message);
    }
  }

  async function excluirInsumo(id: string) {
    if (!confirm("Deseja realmente excluir este insumo?")) return;
    try {
      const { error } = await supabase.from("insumos").delete().eq("id", id);
      if (error) throw error;
      setInsumos(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir insumo: " + err.message);
    }
  }

  // ========== FUNÇÕES DE GERENCIAMENTO DE PRODUTOS ==========

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
      nome: produto.nome,
      categoria: produto.categoria || "Bebidas",
      preco: String(produto.preco),
    });
    setReceitaTemp(produto.receita || []);
    setModalProdutoAberto(true);
  }

  function adicionarIngrediente() {
    if (usuario?.role !== "gerente") return;
    if (!ingredienteTemp.insumo_id || !ingredienteTemp.qtd) {
      alert("Selecione um insumo e informe a quantidade.");
      return;
    }
    const insumo = insumos.find(i => i.id === ingredienteTemp.insumo_id);
    if (!insumo) return;
    const qtd = parseFloat(ingredienteTemp.qtd);
    if (isNaN(qtd) || qtd <= 0) {
      alert("Quantidade inválida.");
      return;
    }
    const existe = receitaTemp.find(r => r.insumo_id === insumo.id);
    if (existe) {
      if (!confirm(`O insumo "${insumo.nome}" já está na receita. Deseja adicionar mais?`)) return;
      setReceitaTemp(prev =>
        prev.map(r =>
          r.insumo_id === insumo.id
            ? { ...r, qtd: r.qtd + qtd }
            : r
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
    try {
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

      if (produtoEditando) {
        const { error } = await supabase
          .from("produtos")
          .update(dados)
          .eq("id", produtoEditando.id);
        if (error) throw error;
        setProdutos(prev =>
          prev.map(p => p.id === produtoEditando.id ? { ...p, ...dados } : p)
        );
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert([dados])
          .select()
          .single();
        if (error) throw error;
        setProdutos(prev => [...prev, data]);
      }
      setModalProdutoAberto(false);
      alert("Produto salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar produto: " + err.message);
    }
  }

  // ========== FUNÇÃO EXCLUIR PRODUTO ==========
  async function excluirProduto(id: string) {
    if (!confirm("Deseja realmente excluir este produto? Todos os dados de receita associados também serão removidos.")) return;

    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      alert("Produto excluído com sucesso!");
    } catch (err: any) {
      alert("Erro ao excluir produto: " + err.message);
    }
  }

  // ========== FUNÇÃO ADICIONAR GARÇOM ==========
  async function adicionarGarcom(e: React.FormEvent) {
    e.preventDefault();
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

    setCadastrandoGarcom(true);

    try {
      const { data: usuarioExistente } = await supabase
        .from("usuarios")
        .select("id")
        .ilike("email", email.trim().toLowerCase())
        .maybeSingle();

      if (usuarioExistente) {
        alert("Este email já está cadastrado no sistema.");
        setCadastrandoGarcom(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (authError) {
        if (authError.message.includes("rate limit") || authError.message.includes("Rate limit")) {
          alert("O sistema está com um limite de requisições para criação de novos usuários. Aguarde alguns minutos e tente novamente.");
        } else {
          alert("Erro ao criar usuário: " + authError.message);
        }
        setCadastrandoGarcom(false);
        return;
      }

      if (!authData.user) {
        alert("Erro ao criar usuário. Tente novamente.");
        setCadastrandoGarcom(false);
        return;
      }

      const { error: perfilError } = await supabase
        .from("usuarios")
        .insert([{
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          role: "colaborador",
        }]);

      if (perfilError) {
        alert("Erro ao criar perfil: " + perfilError.message);
        setCadastrandoGarcom(false);
        return;
      }

      alert("Garçom cadastrado com sucesso!");
      setModalGarcomAberto(false);
      setFormGarcom({ nome: "", email: "", senha: "", confirmarSenha: "" });
    } catch (err: any) {
      alert("Erro inesperado: " + err.message);
    } finally {
      setCadastrandoGarcom(false);
    }
  }

  // ========== FUNÇÕES DE GERENCIAMENTO DE CLIENTES ==========

  function abrirClientes() {
    if (usuario?.role !== "gerente") {
      alert("Apenas gerentes podem gerenciar clientes.");
      return;
    }
    setModalClientesAberto(true);
  }

  function abrirFormCliente(cliente?: any) {
    if (cliente) {
      setClienteEditando(cliente);
      setFormCliente({
        nome: cliente.nome,
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
    const { nome, telefone, email, data_nascimento } = formCliente;
    if (!nome.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    try {
      if (clienteEditando) {
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: nome.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            data_nascimento: data_nascimento || null,
          })
          .eq("id", clienteEditando.id);
        if (error) throw error;
        setClientes(prev =>
          prev.map(c => c.id === clienteEditando.id ? { ...c, nome: nome.trim(), telefone: telefone.trim() || null, email: email.trim() || null, data_nascimento: data_nascimento || null } : c)
        );
      } else {
        const { data, error } = await supabase
          .from("clientes")
          .insert([{
            nome: nome.trim(),
            telefone: telefone.trim() || null,
            email: email.trim() || null,
            data_nascimento: data_nascimento || null,
          }])
          .select()
          .single();
        if (error) throw error;
        setClientes(prev => [...prev, data]);
      }
      setModalClienteFormAberto(false);
      setModalClientesAberto(true);
      setClienteEditando(null);
      setFormCliente({ nome: "", telefone: "", email: "", data_nascimento: "" });
      alert("Cliente salvo com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar cliente: " + err.message);
    }
  }

  async function excluirCliente(id: string) {
    if (!confirm("Deseja realmente excluir este cliente?")) return;
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir cliente: " + err.message);
    }
  }

  // ========== EXCLUIR MESA COM DEVOLUÇÃO AO ESTOQUE ==========
  async function excluirMesa(mesa: any) {
    if (!confirm("Tem certeza que deseja excluir esta mesa?\nOs itens lançados serão devolvidos ao estoque e não poderão ser recuperados.")) return;

    try {
      const itensMesa = mesa.itens || [];
      for (const item of itensMesa) {
        const produto = produtos.find((p) => p.id === item.id);
        if (!produto || !produto.receita || produto.receita.length === 0) continue;

        for (const ing of produto.receita) {
          const insumo = insumos.find((i) => i.id === ing.insumo_id);
          if (!insumo) continue;
          const qtdDevolver = parseFloat(ing.qtd) * item.quantidade;
          const novoEstoque = insumo.estoque + qtdDevolver;

          const { error: errEstoque } = await supabase
            .from("insumos")
            .update({ estoque: novoEstoque })
            .eq("id", insumo.id);

          if (errEstoque) throw errEstoque;

          setInsumos((prev) =>
            prev.map((i) =>
              i.id === insumo.id ? { ...i, estoque: novoEstoque } : i
            )
          );
        }
      }

      const { error: errDelete } = await supabase
        .from("mesas")
        .delete()
        .eq("id", mesa.id);

      if (errDelete) throw errDelete;

      setMesas((prev) => prev.filter((m) => m.id !== mesa.id));
      if (mesaSelecionada?.id === mesa.id) {
        setFichaAberta(false);
        setMesaSelecionada(null);
      }

      alert("Mesa excluída e itens devolvidos ao estoque com sucesso!");
    } catch (err: any) {
      alert("Erro ao excluir a mesa: " + err.message);
    }
  }

  // ========== ENVIAR COMANDA POR WHATSAPP (CHECKOUT) ==========
  const enviarWhatsAppComanda = () => {
    if (!mesaSelecionada) return;

    let telefone = "";
    if (clienteSelecionadoId) {
      const clienteEncontrado = clientes.find(c => c.id === clienteSelecionadoId);
      if (clienteEncontrado && clienteEncontrado.telefone) {
        telefone = clienteEncontrado.telefone;
      }
    }

    if (!telefone) {
      const resp = prompt("Cliente sem telefone cadastrado. Digite o número do cliente para enviar a comanda (apenas números, ex: 11997814149):");
      if (!resp) {
        alert("Envio cancelado.");
        return;
      }
      telefone = resp;
    }

    const itensMesa = mesaSelecionada.itens || [];
    let itensTexto = "";
    if (itensMesa.length > 0) {
      itensTexto = itensMesa.map((item: any) =>
        `🍽️ ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`
      ).join('\n');
    } else {
      itensTexto = "Nenhum item consumido.";
    }

    const total = Number(mesaSelecionada.total);
    const mensagem = `Olá, ${mesaSelecionada.cliente || "Cliente"}! 🍻\n\nAqui está o resumo da sua comanda:\n\n${itensTexto}\n\n💰 **Total: R$ ${total.toFixed(2).replace('.', ',')}**\n\nObrigado pela preferência e volte sempre! 👋`;
    
    const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
  };

  // ========== RENDERIZAÇÃO ==========

  const categorias = ["Todas", "Bebidas", "Drinks", "Porções", "Lanches"];
  const produtosFiltrados = produtos.filter((p) => {
    const matchBusca = p.nome.toLowerCase().includes(buscaProduto.toLowerCase());
    const matchCat = categoriaAtiva === "Todas" || p.categoria === categoriaAtiva;
    return matchBusca && matchCat;
  });

  const mesaOcupada = mesas.some(m => m.numero === parseInt(numeroMesa) && m.status === "ocupada");

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-yellow-500 text-2xl font-black">Carregando...</p>
      </div>
    );
  }

  if (!usuario) return null;

  const isGerente = usuario.role === "gerente";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* CABEÇALHO RESPONSIVO */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 flex flex-wrap items-center justify-between gap-1 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 relative rounded-full overflow-hidden border border-yellow-500/30 bg-black flex items-center justify-center">
            <Image src="/logo.png" alt="Logo" fill className="object-contain p-1" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-yellow-500 italic uppercase leading-tight">Bar da Praça</h1>
            <p className="text-[8px] text-zinc-400 leading-tight">Bem-vindo, {usuario.nome}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {isGerente && (
            <>
              <button
                onClick={() => router.push("/relatorios")}
                className="bg-purple-600 hover:bg-purple-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                📊 Rel
              </button>
              <button
                onClick={() => router.push("/caixa")}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                💰 Caixa
              </button>
              <button
                onClick={abrirClientes}
                className="bg-pink-600 hover:bg-pink-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                👤 Cli
              </button>
              <button
                onClick={() => setModalGarcomAberto(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                👤 Gar
              </button>
              <button
                onClick={abrirFiados}
                className="bg-orange-600 hover:bg-orange-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                📒 Fia
              </button>
              <button
                onClick={abrirEstoque}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-1.5 py-1 rounded-lg text-[8px] font-black uppercase transition-all shadow-xl"
              >
                📦 Est
              </button>
              <button
                onClick={() => setCozinhaAberta(true)}
                className={`relative px-1.5 py-1 rounded-lg flex items-center gap-0.5 font-bold text-[8px] transition-all shadow-xl ${
                  pedidosCozinha.length > 0
                    ? "bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-yellow-500"
                }`}
              >
                <span>🍳</span>
                {pedidosCozinha.length > 0 && (
                  <span className="bg-white text-red-600 rounded-full px-1 py-0.5 text-[6px] font-black">
                    {pedidosCozinha.length}
                  </span>
                )}
              </button>
            </>
          )}
          <span className="text-[8px] font-bold text-zinc-500 uppercase">{usuario.role}</span>
          <button
            onClick={() => {
              localStorage.removeItem("usuario");
              router.push("/");
            }}
            className="text-[8px] text-red-500 hover:text-red-400 font-bold uppercase transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* SALÃO */}
      <main className="p-3 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-1">
          <h2 className="text-lg font-black uppercase italic">Salão</h2>
          <button
            onClick={() => {
              setNumeroMesa("");
              setClienteMesa("");
              setModalAberto(true);
            }}
            className="bg-yellow-500 text-zinc-950 px-3 py-1.5 rounded-xl font-black text-xs hover:bg-yellow-400 transition-all shadow-xl"
          >
            + Nova Mesa
          </button>
        </div>

        {/* GRID RESPONSIVO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {mesas.length === 0 ? (
            <p className="text-zinc-500 col-span-full text-center py-6 font-bold uppercase text-xs">
              Nenhuma mesa ocupada no momento.
            </p>
          ) : (
            mesas.map((mesa) => {
              const temPedidoCozinha = pedidosCozinha.some(p => p.mesa == mesa.numero && p.cliente === mesa.cliente);
              return (
                <div
                  key={mesa.id}
                  className="relative p-3 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 h-32 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-500/5"
                  onClick={() => abrirFicha(mesa)}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-2xl font-black italic text-yellow-500">
                      {String(mesa.numero).padStart(2, "0")}
                    </span>
                    <div className="flex items-start gap-1">
                      <span className="bg-yellow-500 text-zinc-950 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase truncate max-w-[60px]">
                        {mesa.cliente}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          excluirMesa(mesa);
                        }}
                        className="text-red-500 hover:text-red-400 p-0.5 bg-zinc-900 rounded-full transition-colors text-xs"
                        title="Excluir mesa"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-yellow-500">
                      R$ {Number(mesa.total).toFixed(2)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMesaSelecionada(mesa);
                        setCozinhaAberta(true);
                      }}
                      className={`w-full text-white py-0.5 rounded-lg text-[7px] font-black uppercase transition-all shadow-lg ${
                        temPedidoCozinha
                          ? "bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]"
                          : "bg-yellow-600 hover:bg-yellow-500"
                      }`}
                    >
                      {temPedidoCozinha ? "⏳ Pendente" : "🟡 Ver Cozinha"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ========== MODAIS ========== */}
      {/* Os modais permanecem idênticos aos que você já tinha – 
          não vou repetir todo o código aqui para não alongar, mas mantenha 
          todos os modais que estavam no arquivo anterior (clientes, garçom, fiados, receber fiado, estoque, produto, cardápio, cozinha, nova mesa, ficha, checkout, comanda térmica) 
          exatamente como estavam, porque não houve alteração neles. */}
      
      {/* ========== MODAL COMANDA TÉRMICA (UNIFICADO) ========== */}
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
