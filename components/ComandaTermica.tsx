"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Item {
  quantidade: number;
  nome: string;
  preco: number;
}

interface ComandaTermicaProps {
  tipo: "cozinha" | "cliente";
  mesa: number | string;
  cliente: string;
  itens: Item[];
  total?: number;
  pagamentos?: Array<{ metodo: string; valor: number }>;
  hora?: string;
  onClose?: () => void;
}

export default function ComandaTermica({ 
  tipo, 
  mesa, 
  cliente, 
  itens, 
  total, 
  pagamentos, 
  hora, 
  onClose 
}: ComandaTermicaProps) {
  const comandaRef = useRef<HTMLDivElement>(null);

  const gerarPDF = async () => {
    if (!comandaRef.current) return;
    try {
      const canvas = await html2canvas(comandaRef.current, { 
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL("image/png");
      // Formato 80mm x altura dinâmica (A4 cortado)
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`comanda_${tipo}_mesa_${mesa}.pdf`);
      if (onClose) onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  // Calcula total se não for passado
  const totalCalculado = total !== undefined ? total : itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl max-w-sm w-full p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-black uppercase text-center border-b pb-2 mb-3">
          {tipo === "cozinha" ? "🍳 Comanda - Cozinha" : "🧾 Comprovante - Cliente"}
        </h3>

        {/* Conteúdo para impressão (estilo térmico 80mm) */}
        <div ref={comandaRef} className="p-3 bg-white" style={{ width: '80mm', margin: '0 auto' }}>
          {/* Cabeçalho */}
          <div className="text-center border-b border-dashed pb-2 mb-2">
            <h1 className="text-2xl font-black uppercase tracking-wider">Bar da Praça</h1>
            <p className="text-xs text-gray-500">
              {tipo === "cozinha" ? "Comanda para a Cozinha" : "Recibo de pagamento"}
            </p>
          </div>

          {/* Informações da mesa */}
          <div className="text-xs mb-2 space-y-0.5">
            <p><span className="font-bold">Mesa:</span> {mesa}</p>
            <p><span className="font-bold">Cliente:</span> {cliente}</p>
            {hora && <p><span className="font-bold">Hora:</span> {hora}</p>}
          </div>

          {/* Itens */}
          <table className="w-full text-xs border-t border-b border-dashed py-1">
            <thead>
              <tr className="border-b border-dashed">
                <th className="py-1 text-left">Qtd</th>
                <th className="py-1 text-left">Item</th>
                <th className="py-1 text-right">Preço</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, idx) => (
                <tr key={idx} className="border-b border-dashed border-gray-200">
                  <td className="py-1">{item.quantidade}</td>
                  <td className="py-1 uppercase">{item.nome}</td>
                  <td className="py-1 text-right">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-2 text-right font-bold text-base border-t border-dashed pt-1">
            Total: R$ {totalCalculado.toFixed(2)}
          </div>

          {/* Pagamentos (apenas para cliente) */}
          {tipo === "cliente" && pagamentos && pagamentos.length > 0 && (
            <div className="mt-2 border-t border-dashed pt-1 text-xs">
              <p className="font-bold">Formas de pagamento:</p>
              {pagamentos.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{p.metodo.toUpperCase()}</span>
                  <span>R$ {p.valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-3 text-center text-[8px] text-gray-400 border-t border-dashed pt-1">
            {tipo === "cliente" ? "Obrigado pela preferência! Volte sempre." : "Enviado para a cozinha em " + new Date().toLocaleString()}
          </div>
          <div className="text-center text-[8px] text-gray-400">
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={gerarPDF}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-2 rounded-xl text-sm transition-all"
          >
            📄 Baixar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-xl text-sm transition-all"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-2 rounded-xl text-sm transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}