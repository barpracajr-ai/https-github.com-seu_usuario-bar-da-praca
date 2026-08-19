import { NextResponse } from 'next/server';

export async function GET() {
  // AQUI VOCÊ SUBSTITUI PELA SUA CONSULTA AO BANCO DE DADOS
  // const clientes = await buscarClientesDoBanco(); 
  // Estou colocando um dado fictício para testar:
  const clientes = [
    { nome: "Marcio Muniz", telefone: "11997814149", email: "marcio@teste.com", data: "18/08/2026" }
  ];

  // Monta o cabeçalho e as linhas do CSV
  let csv = "Nome;Telefone;Email;DataCadastro\n";
  clientes.forEach(cliente => {
    csv += `${cliente.nome};${cliente.telefone};${cliente.email};${cliente.data}\n`;
  });

  // Retorna o arquivo forçando o download
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename=relatorio_clientes.csv',
    },
  });
}