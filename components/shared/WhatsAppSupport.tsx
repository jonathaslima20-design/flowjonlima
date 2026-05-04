import { MessageCircle } from 'lucide-react';

const WA_URL =
  'https://wa.me/5591982465495?text=Ol%C3%A1%2C%20gostaria%20de%20auxilio%20do%20suporte%20para%20o%20sistema%20BioFlowzy';

export function WhatsAppSupport() {
  return (
    <div className="brutal-border bg-white p-8 flex flex-col items-center text-center gap-4">
      <h3 className="font-display text-xl">Precisa de Ajuda?</h3>
      <p className="text-sm text-black/60 max-w-xs">
        Em caso de duvidas sobre os planos ou funcionalidades, nossa equipe esta pronta para ajudar.
      </p>
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="brutal-btn bg-white text-black px-5 py-2.5 font-bold gap-2 inline-flex items-center"
      >
        <MessageCircle className="w-4 h-4" />
        Falar com Suporte
      </a>
    </div>
  );
}
