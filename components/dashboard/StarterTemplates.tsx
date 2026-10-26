'use client';

import { useState } from 'react';
import { Store, Sparkles, Briefcase, UtensilsCrossed, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { normalizeSocial, withWhatsappMessage } from '@/lib/socials';

type Template = {
  key: string;
  label: string;
  description: string;
  icon: typeof Store;
  theme: string; // só temas gratuitos, para funcionar em qualquer plano
  bio: string;
  links: string[];
  whatsappMessage: string;
};

const TEMPLATES: Template[] = [
  {
    key: 'loja', label: 'Loja / empreendedor', description: 'Catálogo, promoções e pedidos pelo WhatsApp', icon: Store,
    theme: 'cupertino', bio: 'Produtos selecionados com envio para todo o Brasil. Peça pelo WhatsApp! 🛍️',
    links: ['Ver catálogo', 'Promoções da semana', 'Avaliações de clientes'],
    whatsappMessage: 'Olá! Vim pelo link na bio e quero fazer um pedido.',
  },
  {
    key: 'criador', label: 'Criador de conteúdo', description: 'Vídeos, parcerias e redes', icon: Sparkles,
    theme: 'bento', bio: 'Conteúdo novo toda semana ✨ Parcerias pelo e-mail ou WhatsApp.',
    links: ['Meu último vídeo', 'Parcerias e publis', 'Meu canal no YouTube'],
    whatsappMessage: 'Olá! Vim pelo seu link na bio.',
  },
  {
    key: 'profissional', label: 'Profissional liberal', description: 'Agendamento, portfólio e depoimentos', icon: Briefcase,
    theme: 'graphite', bio: 'Atendimento presencial e online. Agende sua consulta pelo WhatsApp.',
    links: ['Agendar atendimento', 'Conheça meu trabalho', 'Depoimentos de clientes'],
    whatsappMessage: 'Olá! Gostaria de agendar um atendimento.',
  },
  {
    key: 'restaurante', label: 'Restaurante / delivery', description: 'Cardápio, delivery e localização', icon: UtensilsCrossed,
    theme: 'sunset', bio: 'Delivery e retirada. Cardápio completo no link 🍔',
    links: ['Cardápio', 'Pedir pelo delivery', 'Como chegar'],
    whatsappMessage: 'Olá! Quero fazer um pedido.',
  },
];

// Mostrado no painel enquanto a página não tem links nem redes sociais
export function StarterTemplates({ profileId, currentBio, onApplied }: { profileId: string; currentBio: string | null; onApplied: () => void }) {
  const [selected, setSelected] = useState<Template | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [applying, setApplying] = useState(false);

  async function apply() {
    if (!selected) return;
    setApplying(true);
    try {
      const socials = [];
      if (instagram.trim()) socials.push({ profile_id: profileId, platform: 'instagram', url: normalizeSocial('instagram', instagram), position: 0 });
      if (whatsapp.trim()) {
        const wa = normalizeSocial('whatsapp', whatsapp);
        if (wa) socials.push({ profile_id: profileId, platform: 'whatsapp', url: withWhatsappMessage(wa, selected.whatsappMessage), position: socials.length });
      }
      if (socials.length) {
        const { error } = await supabase.from('social_links').insert(socials);
        if (error) throw error;
      }

      // Os links entram inativos: o endereço de cada um é do usuário
      const { error: linksError } = await supabase.from('links').insert(
        selected.links.map((title, i) => ({ profile_id: profileId, title, url: 'https://', position: i, is_active: false })),
      );
      if (linksError) throw linksError;

      const { error: profileError } = await supabase.from('profiles').update({
        theme: selected.theme,
        ...(currentBio?.trim() ? {} : { bio: selected.bio }),
      }).eq('id', profileId);
      if (profileError) throw profileError;

      toast.success('Modelo aplicado! Agora coloque o endereço de cada link e ative.');
      setSelected(null);
      onApplied();
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível aplicar o modelo.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="brutal-card p-5 bg-biolime mt-8">
      <h2 className="font-display text-2xl">Comece com um modelo</h2>
      <p className="text-sm font-bold text-black/70 mt-1">Escolha o seu tipo de negócio e a gente monta a base da sua página em segundos.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setSelected(t)} className="brutal-btn bg-white p-4 flex-col items-start text-left gap-2 h-full">
              <Icon className="w-6 h-6" />
              <span className="font-display text-base">{t.label}</span>
              <span className="text-xs font-normal text-black/60">{t.description}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white brutal-border brutal-shadow-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xl">{selected.label}</h3>
              <button onClick={() => setSelected(null)} aria-label="Fechar"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm mb-4">
              Vamos criar os links <b>{selected.links.join(', ')}</b>{currentBio?.trim() ? '' : ', uma bio de exemplo'} e aplicar um tema. Preencha o que tiver (opcional):
            </p>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold flex flex-col gap-1">
                WhatsApp (com DDD)
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11 99999-9999" className="brutal-input px-3 py-2 font-normal" />
              </label>
              <label className="text-xs font-bold flex flex-col gap-1">
                Instagram
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@seuperfil" className="brutal-input px-3 py-2 font-normal" />
              </label>
            </div>
            <button onClick={apply} disabled={applying} className="brutal-btn bg-bioyellow w-full py-3 mt-5 disabled:opacity-50">
              {applying ? 'Aplicando...' : 'Aplicar modelo'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
