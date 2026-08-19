"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Item {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
}

interface Pagamento {
  metodo: string;
  valor: number;
}

interface ComandaCozinhaProps {
  mesa: number | string;
  cliente: string;
  itens: Item[];
  total: number;
  pagamentos?: Pagamento[];
  onClose?: () => void;
}

export default function ComandaCozinha({
  mesa,
  cliente,
  itens,
  total,
  pagamentos,
  onClose,
}: ComandaCozinhaProps) {
  const comandaRef = useRef<HTMLDivElement>(null);

  const gerarPDF = async () => {
    if (!comandaRef.current) return;
    try {
      const canvas = await html2canvas(comandaRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`comprovante_mesa_${mesa}.pdf`);
      if (onClose) onClose();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-black uppercase text-center border-b pb-3 mb-4">🧾 Comanda - Cozinha</h3>

        <div ref={comandaRef} className="p-4 bg-white">
          <div className="text-center border-b pb-3 mb-4">
            <h1 className="text-3xl font-black uppercase">Bar da Praça</h1>
            <p className="text-sm text-gray-500">Pedido para a Cozinha</p>
          </div>
          <div className="mb-4">
            <p><strong>Mesa:</strong> {mesa}</p>
            <p><strong>Cliente:</strong> {cliente}</p>
            <p><strong>Hora:</strong> {new Date().toLocaleTimeString()}</p>
          </div>
          <table className="w-full text-left border-t border-b py-2">
            <thead>
              <tr className="border-b">
                <th className="py-2">Qtd</th>
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Preço</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item: Item, idx: number) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2">{item.quantidade}</td>
                  <td className="py-2 uppercase">{item.nome}</td>
                  <td className="py-2 text-right">R$ {(item.preco * item.quantidade).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right font-bold text-lg border-t pt-2">
            Total: R$ {total.toFixed(2)}
          </div>
          {pagamentos && pagamentos.length > 0 && (
            <div className="mt-4 border-t pt-2">
              <p className="font-bold">Formas de pagamento:</p>
              {pagamentos.map((p: Pagamento, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{p.metodo.toUpperCase()}</span>
                  <span>R$ {p.valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-center text-xs text-gray-400 border-t pt-2">
            Obrigado pela preferência! Volte sempre.
          </div>
          <div className="text-center text-xs text-gray-400">
            {new Date().toLocaleString()}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={gerarPDF}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all"
          >
            📄 Baixar PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
