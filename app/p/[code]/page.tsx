'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchPartnerProgram, storePartnerCode } from '@/lib/partner';

// Link de parceiro: conta o clique, guarda o código pelo prazo do programa e leva para a home
// (o cadastro envia o código como partner_code)
export default function PartnerRedirect() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    const clean = String(code ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    (async () => {
      const [{ data: valid }, program] = await Promise.all([
        supabase.rpc('track_partner_click', { p_code: clean }),
        fetchPartnerProgram(),
      ]);
      if (valid) storePartnerCode(clean, program.cookie_days);
      router.replace(valid ? `/?utm_source=parceiro&utm_campaign=${clean}` : '/');
    })();
  }, [code, router]);

  return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>;
}
