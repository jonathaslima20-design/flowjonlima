import { MessageCircle } from 'lucide-react';
import { LEGAL } from '@/lib/legal';

const WA_URL = `${LEGAL.whatsapp}?text=${encodeURIComponent('Olá, gostaria de auxílio do suporte para o sistema BioFlowzy')}`;

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
