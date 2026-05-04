'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';
import { Copy, Check, Lock, Crown, TrendingUp, DollarSign, Users, Wallet, Clock, CircleCheck as CheckCircle, Circle as XCircle, ChevronRight } from 'lucide-react';

type ReferredUser = {
  id: string;
  username: string;
  plan: string;
  created_at: string;
  commission_value: number;
  commission_status: string;
};

type PayoutRequest = {
  id: string;
  amount_cents: number;
  pix_key: string;
  status: string;
  created_at: string;
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-neutral-200 text-black' },
  pro_monthly: { label: 'Pro Mensal', color: 'bg-bioblue text-white' },
  pro_annual: { label: 'Pro Anual', color: 'bg-green-600 text-white' },
};

const PAYOUT_STATUS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Aguardando', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-yellow-700 bg-bioyellow' },
  approved: { label: 'Aprovado', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-blue-800 bg-blue-100' },
  paid: { label: 'Pago', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-800 bg-green-100' },
  rejected: { label: 'Recusado', icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-800 bg-red-100' },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ReferralPage() {
  const { profile, has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const isPro = has('referral');

  const [copied, setCopied] = useState(false);
  const [referreds, setReferreds] = useState<ReferredUser[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [pixKey, setPixKey] = useState('');
  const [pixFullName, setPixFullName] = useState('');
  const [pixSaved, setPixSaved] = useState(false);
  const [pixSaving, setPixSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const code = profile?.referral_code || '';
  const link = typeof window !== 'undefined' && code ? `${window.location.origin}/register?ref=${code}` : '';

  useEffect(() => {
    if (!isPro || !profile) return;
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, profile?.id]);

  async function loadData() {
    if (!profile) return;
    setLoadingData(true);

    const { data: prof } = await supabase
      .from('profiles')
      .select('commission_balance, pix_key, pix_full_name')
      .eq('id', profile.id)
      .maybeSingle();
    if (prof) {
      setBalance(prof.commission_balance ?? 0);
      setPixKey(prof.pix_key ?? '');
      setPixFullName(prof.pix_full_name ?? '');
    }

    const { data: refs } = await supabase
      .from('referrals')
      .select('referred_id, commission_value, commission_status, created_at, profiles!referred_id(username, plan)')
      .eq('referrer_id', profile.id)
      .order('created_at', { ascending: false });

    if (refs) {
      setReferreds(refs.map((r: any) => ({
        id: r.referred_id,
        username: r.profiles?.username ?? '—',
        plan: r.profiles?.plan ?? 'free',
        created_at: r.created_at,
        commission_value: r.commission_value ?? 0,
        commission_status: r.commission_status ?? 'pending',
      })));
    }

    const { data: pw } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });
    setPayouts((pw as PayoutRequest[]) ?? []);

    setLoadingData(false);
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function savePix() {
    if (!profile || !pixKey.trim() || !pixFullName.trim()) return;
    setPixSaving(true);
    await supabase.from('profiles').update({ pix_key: pixKey.trim(), pix_full_name: pixFullName.trim() }).eq('id', profile.id);
    setPixSaving(false);
    setPixSaved(true);
    setTimeout(() => setPixSaved(false), 2000);
  }

  async function requestWithdraw() {
    if (!profile || balance < 5000) return;
    if (!pixKey.trim() || !pixFullName.trim()) { alert('Preencha seu nome completo e chave Pix antes de solicitar o saque.'); return; }
    setWithdrawing(true);
    const { error } = await supabase.from('payout_requests').insert({
      user_id: profile.id,
      amount_cents: balance,
      pix_key: pixKey.trim(),
      pix_full_name: pixFullName.trim(),
      status: 'pending',
    });
    if (!error) {
      await supabase.from('profiles').update({ commission_balance: 0 }).eq('id', profile.id);
      setBalance(0);
      setWithdrawDone(true);
      setTimeout(() => setWithdrawDone(false), 3000);
      loadData();
    }
    setWithdrawing(false);
  }

  const totalConverted = referreds.filter(r => r.plan !== 'free').length;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-1">Indique e ganhe</h1>
        <p className="text-sm font-bold text-black/60">
          Indique amigos e ganhe comissao toda vez que eles assinarem um plano Pro.
        </p>
      </div>

      {/* Commission cards — visible to ALL */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="brutal-card bg-bioyellow p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-black/5 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-2">Pro Mensal</p>
          <div className="font-display text-5xl mb-1">R$10</div>
          <p className="text-sm font-bold text-black/70">por cada indicado que assinar o plano mensal</p>
          <DollarSign className="absolute bottom-4 right-4 w-8 h-8 opacity-20" />
        </div>
        <div className="brutal-card bg-biolime p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-black/5 rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest text-black/60 mb-2">Pro Anual</p>
          <div className="font-display text-5xl mb-1">R$100</div>
          <p className="text-sm font-bold text-black/70">por cada indicado que assinar o plano anual</p>
          <TrendingUp className="absolute bottom-4 right-4 w-8 h-8 opacity-20" />
        </div>
      </div>

      {/* Referral link — locked for free users */}
      <div className="brutal-card p-5 mb-6">
        <label className="block text-xs font-bold uppercase tracking-widest mb-3">Seu link de indicacao</label>
        {isPro ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="brutal-input px-3 py-2 flex-1 text-sm bg-neutral-50 font-mono"
            />
            <button
              onClick={copy}
              className="brutal-btn bg-bioyellow px-4 py-2 gap-2 text-sm shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <div className="brutal-input px-3 py-2 flex-1 text-sm bg-neutral-100 text-black/30 font-mono cursor-not-allowed select-none flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Disponivel apenas nos planos Pro</span>
              </div>
              <button
                disabled
                className="brutal-btn bg-neutral-200 text-black/30 px-4 py-2 gap-2 text-sm shrink-0 cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
            </div>
            <div className="brutal-border bg-bioyellow p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Torne-se Pro e comece a ganhar indicando!</p>
                  <p className="text-xs text-black/70 mt-0.5">
                    Assine o plano Pro e desbloqueie seu link com comissoes de ate R$100 por indicado.
                  </p>
                </div>
              </div>
              <button
                onClick={openUpgrade}
                className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-2 shrink-0 whitespace-nowrap"
              >
                Ver planos <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="brutal-card p-4 text-center">
          <div className="font-display text-3xl">{referreds.length}</div>
          <div className="text-xs font-bold text-black/60 mt-1">Indicados</div>
        </div>
        <div className="brutal-card p-4 text-center">
          <div className="font-display text-3xl">{totalConverted}</div>
          <div className="text-xs font-bold text-black/60 mt-1">Convertidos</div>
        </div>
        <div className="brutal-card p-4 text-center bg-biolime">
          <div className="font-display text-3xl">{fmt(balance)}</div>
          <div className="text-xs font-bold text-black/60 mt-1">Saldo</div>
        </div>
      </div>

      {/* Referred users */}
      <div className="brutal-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" />
          <h2 className="font-bold text-sm uppercase tracking-widest">Seus indicados</h2>
        </div>
        {loadingData ? (
          <p className="text-sm text-black/50 text-center py-4">Carregando...</p>
        ) : referreds.length === 0 ? (
          <div className="text-center py-6">
            <p className="font-bold text-sm">Nenhum indicado ainda.</p>
            <p className="text-xs text-black/60 mt-1">Compartilhe seu link e acompanhe os cadastros aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left font-bold pb-2 text-xs uppercase tracking-wide">Usuario</th>
                  <th className="text-left font-bold pb-2 text-xs uppercase tracking-wide">Plano</th>
                  <th className="text-left font-bold pb-2 text-xs uppercase tracking-wide">Comissao</th>
                  <th className="text-left font-bold pb-2 text-xs uppercase tracking-wide">Data</th>
                </tr>
              </thead>
              <tbody>
                {referreds.map(r => {
                  const planMeta = PLAN_LABELS[r.plan] ?? PLAN_LABELS.free;
                  return (
                    <tr key={r.id} className="border-b border-black/10 last:border-0">
                      <td className="py-2.5 font-mono text-sm">@{r.username}</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold brutal-border ${planMeta.color}`}>
                          {planMeta.label}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold">
                        {r.commission_value > 0 ? (
                          <span className="text-green-700">{fmt(r.commission_value)}</span>
                        ) : (
                          <span className="text-black/30">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-black/50">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pix key + withdraw */}
      <div className="brutal-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4" />
          <h2 className="font-bold text-sm uppercase tracking-widest">Saque via Pix</h2>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Nome completo do titular</label>
            <input
              value={pixFullName}
              onChange={e => setPixFullName(e.target.value)}
              placeholder="Nome completo conforme cadastro bancario"
              className="brutal-input px-3 py-2 w-full text-sm"
              disabled={!isPro}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-2">Sua chave Pix</label>
            <div className="flex gap-2">
              <input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="CPF, email, telefone ou chave aleatoria"
                className="brutal-input px-3 py-2 flex-1 text-sm"
                disabled={!isPro}
              />
              <button
                onClick={savePix}
                disabled={!isPro || pixSaving || !pixKey.trim() || !pixFullName.trim()}
                className="brutal-btn bg-bioblue text-white px-4 py-2 text-sm shrink-0 disabled:opacity-50"
              >
                {pixSaved ? <Check className="w-4 h-4" /> : 'Salvar'}
              </button>
            </div>
            {pixSaved && <p className="text-xs text-green-700 font-bold mt-1">Dados Pix salvos!</p>}
          </div>
        </div>

        <div className="brutal-border bg-neutral-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm">Saldo disponivel para saque</p>
            <p className="font-display text-3xl mt-1">{fmt(balance)}</p>
            {isPro && balance < 5000 && (
              <p className="text-xs text-black/50 mt-1">
                Minimo de R$50,00 para solicitar saque.
                {balance > 0 && ` Faltam ${fmt(5000 - balance)}.`}
              </p>
            )}
          </div>
          <button
            onClick={requestWithdraw}
            disabled={!isPro || balance < 5000 || withdrawing || !pixKey.trim() || !pixFullName.trim()}
            className="brutal-btn bg-black text-white px-5 py-2.5 text-sm gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {withdrawing ? 'Solicitando...' : withdrawDone ? (
              <><Check className="w-4 h-4" /> Solicitado!</>
            ) : 'Solicitar saque'}
          </button>
        </div>
      </div>

      {/* Payout history */}
      {payouts.length > 0 && (
        <div className="brutal-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" />
            <h2 className="font-bold text-sm uppercase tracking-widest">Historico de saques</h2>
          </div>
          <div className="flex flex-col gap-2">
            {payouts.map(p => {
              const st = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending;
              return (
                <div key={p.id} className="brutal-border p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm">{fmt(p.amount_cents)}</p>
                    <p className="text-xs text-black/50 font-mono mt-0.5">{p.pix_key}</p>
                    <p className="text-xs text-black/40 mt-0.5">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold brutal-border ${st.color}`}>
                    {st.icon}
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
