"use client";

// importações ... (manter as suas)

export default function ComandaCozinha({ mesa, cliente, itens, total, onClose }) {
  
  // Função para imprimir a comanda
  const imprimirComanda = () => {
    window.print(); 
  };

  // Função para enviar WhatsApp (igual ao que passamos antes)
  const enviarWhatsApp = () => {
    const telefone = prompt("Digite o telefone do cliente (DDD + Número, apenas números):");
    if (!telefone) {
      alert("Número não informado.");
      return;
    }

    let itensTexto = "";
    if (itens && itens.length > 0) {
      itensTexto = itens.map((item) =>
        `🍽️ ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}`
      ).join('\n');
    }

    const mensagem = `Olá, ${cliente}! Aqui está o resumo da sua comanda de hoje: \n\n${itensTexto}\n\n💰 **Total: R$ ${total.toFixed(2).replace('.', ',')}**\n\nObrigado pela preferência e volte sempre! 🍻`;
    
    const link = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
  };

  return (
    <div className="... sua classe ...">
      <div className="... sua classe do conteudo ...">
        {/* Cabeçalho, Itens, Total... (o conteúdo que já está lá) */}
        
        {/* Botões de ação atualizados */}
        <div className="flex gap-3 mt-4">
          <button 
            onClick={enviarWhatsApp} 
            className="flex-1 bg-green-600 text-white font-black py-2 rounded-xl">
            📱 Enviar WhatsApp
          </button>
          <button 
            onClick={imprimirComanda} 
            className="flex-1 bg-blue-600 text-white font-black py-2 rounded-xl">
            🖨️ Imprimir
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-zinc-800 text-white font-black py-2 rounded-xl">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}