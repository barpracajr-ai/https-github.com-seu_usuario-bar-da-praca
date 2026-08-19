import { supabase } from "./supabaseClient";

// Busca todas as mesas
export async function fetchMesas() {
  const { data, error } = await supabase
    .from("mesas")
    .select("*")
    .order("numero", { ascending: true });

  if (error) throw error;
  return data;
}

// Busca todos os produtos (cardápio)
export async function fetchProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("nome");

  if (error) throw error;
  return data;
}

// Busca insumos (estoque)
export async function fetchInsumos() {
  const { data, error } = await supabase
    .from("insumos")
    .select("*")
    .order("nome");

  if (error) throw error;
  return data;
}

// Busca vendas (últimos 50 registros)
export async function fetchVendas() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .order("data_venda", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

// Busca pedidos da cozinha
export async function fetchPedidosCozinha() {
  const { data, error } = await supabase
    .from("pedidos_cozinha")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

// Função para criar uma nova mesa
export async function criarMesa(numero: number, cliente: string) {
  const { data, error } = await supabase
    .from("mesas")
    .insert([{ numero, status: "ocupada", cliente, total: 0, itens: [] }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Função para atualizar uma mesa (ex: adicionar itens)
export async function atualizarMesa(id: string, dados: any) {
  const { data, error } = await supabase
    .from("mesas")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}