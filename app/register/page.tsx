'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Waypoints } from 'lucide-react';
import { captureAttribution, readAttribution } from '@/lib/attribution';
import { maskWhatsapp, normalizeWhatsapp } from '@/lib/whatsapp';
import { trackMeta } from '@/lib/meta-pixel';
import { readPartnerCode, storePartnerCode } from '@/lib/partner';
import { useAuth } from '@/lib/auth-context';

// useSearchParams exige um Suspense boundary no build do Next 14
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = (searchParams.get('username') ?? '')
    .replace(/[^a-z0-9_.-]/gi, '')
    .toLowerCase();
  const refCode = searchParams.get('ref') ?? '';
  // Convite de parceiro (?pi=<token>) e código do link /p/<code> (?parceiro= ou guardado no navegador)
  const inviteToken = (searchParams.get('pi') ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
  const [invite, setInvite] = useState<{ partner: string; client_name: string; valid: boolean; license: boolean } | null>(null);
  const { userId } = useAuth();
  useEffect(() => {
    const code = (searchParams.get('parceiro') ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (code) storePartnerCode(code, 60);
    if (inviteToken) supabase.rpc('partner_invite_info', { p_token: inviteToken }).then(({ data }) => setInvite(data as any));
  }, [searchParams, inviteToken]);
  // Vindo da página de preços, abre o modal de assinatura logo após o cadastro
  // Vindo de um convite (?next=/convite/...), volta para ele após o cadastro
  const rawNext = searchParams.get('next');
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;
  const afterSignup = next ?? (searchParams.get('plan') ? '/dashboard?upgrade=1' : '/dashboard');
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    const clean = username.replace(/[^a-z0-9_.-]/gi, '').toLowerCase();
    if (!clean) { setErr('Escolha um @ válido'); setLoading(false); return; }

    const phone = normalizeWhatsapp(whatsapp);
    if (!phone) { setErr('Informe um WhatsApp válido com DDD.'); setLoading(false); return; }

    const { data: reserved } = await supabase.rpc('is_reserved_username', { p_username: clean });
    if (reserved) { setErr('Este @ não está disponível.'); setLoading(false); return; }

    const { data: taken } = await supabase.from('profiles').select('id').eq('username', clean).maybeSingle();
    if (taken) { setErr('Este @ já está em uso.'); setLoading(false); return; }

    // Origem da primeira visita (link com utm direto no cadastro também conta)
    captureAttribution();
    const attribution = readAttribution();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: clean,
          display_name: clean,
          whatsapp: phone,
          ...(refCode ? { referred_by_code: refCode.toUpperCase() } : {}),
          ...(inviteToken ? { partner_invite: inviteToken } : {}),
          ...(readPartnerCode() ? { partner_code: readPartnerCode() } : {}),
          ...(attribution ? { signup_source: attribution.source, signup_campaign: attribution.campaign } : {}),
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('registered')) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setErr('Este email já está cadastrado. Faça login.');
          setLoading(false);
          return;
        }
        if (inviteToken) await supabase.rpc('partner_accept_invite', { p_token: inviteToken });
        router.push(afterSignup);
        return;
      }
      if (msg.includes('rate') || msg.includes('limit')) {
        setErr('Muitas tentativas. Aguarde alguns minutos e tente novamente, ou use outro email.');
      } else {
        setErr(error.message);
      }
      setLoading(false);
      return;
    }

    if (!data.user) { setErr('Não foi possível criar a conta.'); setLoading(false); return; }

    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setErr('Conta criada. Faça login para continuar.');
        setLoading(false);
        setTimeout(() => router.push(next ? `/login?next=${encodeURIComponent(next)}` : '/login'), 1500);
        return;
      }
    }

    setLoading(false);
    trackMeta('CompleteRegistration', { content_name: 'Cadastro', status: 'completed' }, { capi: true });
    router.push(afterSignup);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bioyellow/40 p-4">
      <div className="w-full max-w-md brutal-card p-8">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 bg-bioblue brutal-border flex items-center justify-center">
            <Waypoints className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-2xl">BioFlowzy</span>
        </Link>
        <h1 className="font-display text-3xl text-center mb-2">Criar conta</h1>
        {invite?.valid && (
          <div className="brutal-border bg-biolime p-3 mb-4 text-sm">
            <p className="font-bold">Convite de {invite.partner}</p>
            <p className="text-black/70">
              Crie sua conta para {invite.partner} montar e acompanhar sua página com você.
              {invite.license && ' O plano já está incluído.'}
            </p>
            {userId && (
              <AcceptInvite token={inviteToken} />
            )}
          </div>
        )}
        {invite && !invite.valid && (
          <p className="brutal-border bg-red-50 p-3 mb-4 text-sm font-bold">Este convite expirou ou já foi usado. Peça um novo link ao seu parceiro.</p>
        )}
        {refCode ? (
          <p className="text-center text-sm mb-6 font-bold">Voce foi indicado! Crie sua conta gratuita.</p>
        ) : (
          <p className="text-center text-sm mb-6">Reserve seu @ agora.</p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex brutal-border bg-white">
            <span className="px-3 bg-black text-white font-bold flex items-center text-sm">bioflowzy.com/</span>
            <input className="flex-1 px-3 py-3 outline-none" placeholder="seunome" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <input className="brutal-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="brutal-input" type="tel" required inputMode="numeric" autoComplete="tel-national" placeholder="WhatsApp com DDD" value={whatsapp} onChange={e => setWhatsapp(maskWhatsapp(e.target.value))} />
          <input className="brutal-input" type="password" required minLength={6} placeholder="Senha (min 6)" value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="text-sm text-biored font-bold">{err}</div>}
          <button disabled={loading} className="brutal-btn bg-bioblue text-white py-3 mt-2">
            {loading ? 'Criando...' : 'Criar conta grátis'}
          </button>
          <p className="text-[11px] text-black/60 text-center">
            Ao criar sua conta, você concorda com os <Link href="/termos" target="_blank" className="underline font-bold">Termos de Uso</Link> e a{' '}
            <Link href="/privacidade" target="_blank" className="underline font-bold">Política de Privacidade</Link>.
          </p>
        </form>
        <div className="mt-6 text-center text-sm">
          Ja tem conta? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="font-bold underline">Entrar</Link>
        </div>
      </div>
    </div>
  );
}

// Já tem conta e está logado: aceita o convite do parceiro com a conta atual
function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function accept() {
    setBusy(true);
    setErr('');
    const { error } = await supabase.rpc('partner_accept_invite', { p_token: token });
    if (error) { setErr(error.message); setBusy(false); return; }
    router.push('/dashboard');
  }
  return (
    <div className="mt-3">
      <button type="button" onClick={accept} disabled={busy} className="brutal-btn bg-black text-white px-4 py-2 text-xs">
        {busy ? 'Aceitando...' : 'Aceitar com a minha conta atual'}
      </button>
      {err && <p className="text-xs font-bold text-biored mt-2">{err}</p>}
    </div>
  );
}
