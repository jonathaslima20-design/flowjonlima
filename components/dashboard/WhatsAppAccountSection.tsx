'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatWhatsapp, maskWhatsapp, normalizeWhatsapp } from '@/lib/whatsapp';

// WhatsApp da conta (privado: só você e a equipe BioFlowzy veem). Fica em profile_private.
export function WhatsAppAccountSection({ accountId }: { accountId: string }) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('profile_private').select('whatsapp').eq('profile_id', accountId).maybeSingle().then(({ data }) => {
      const formatted = formatWhatsapp(data?.whatsapp);
      setValue(formatted);
      setSaved(formatted);
      setLoading(false);
    });
  }, [accountId]);

  async function save() {
    const phone = normalizeWhatsapp(value);
    if (!phone) { toast.error('Informe um WhatsApp válido com DDD.'); return; }
    setSaving(true);
    const { error } = await supabase.from('profile_private').update({ whatsapp: phone }).eq('profile_id', accountId);
    setSaving(false);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    setSaved(value);
    toast.success('WhatsApp salvo.');
  }

  return (
    <section>
      <h2 className="font-display text-2xl mb-4">WhatsApp da conta</h2>
      <div className="brutal-card p-5 flex flex-col gap-3">
        <p className="text-xs text-black/60">Usado pela equipe BioFlowzy para falar com você sobre sua conta. Não aparece na sua página.</p>
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={loading ? 'Carregando...' : '(11) 99999-8888'}
            value={value}
            onChange={e => setValue(maskWhatsapp(e.target.value))}
            className="brutal-input flex-1"
          />
          <button onClick={save} disabled={saving || loading || value === saved} className="brutal-btn bg-bioyellow px-4 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </section>
  );
}
