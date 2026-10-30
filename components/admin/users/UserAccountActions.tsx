'use client';

import { useState } from 'react';
import { Copy, KeyRound, Loader2, LogOut, Mail, MailCheck, Trash2, UserRoundCog, X, Check } from 'lucide-react';
import { adminUserAction } from '@/lib/admin-user';
import { startImpersonation } from '@/lib/impersonation';

type Props = {
  profileId: string;
  username: string;
  email: string | null;
  emailConfirmed: boolean;
  isAdmin: boolean;
  isSelf: boolean;
  hasApprovedPayments: boolean;
  onChanged: (msg: string) => void;
  onDeleted: () => void;
};

type Dialog = 'impersonate' | 'email' | 'delete' | 'revoke' | 'recovery' | null;

// Ações de conta (edge function admin-user): entrar como o usuário, senha, sessões, e-mail e exclusão
export function UserAccountActions(p: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const protectedTarget = p.isAdmin || p.isSelf;

  function open(d: Dialog) {
    setError('');
    setReason('');
    setConfirmText('');
    setNewEmail(p.email ?? '');
    setLink('');
    setCopied(false);
    setDialog(d);
  }

  async function run(key: string, fn: () => Promise<string | null>) {
    setBusy(key);
    setError('');
    const err = await fn();
    setBusy(null);
    if (err) setError(err);
    return !err;
  }

  async function impersonate() {
    await run('impersonate', () => startImpersonation(p.profileId, reason.trim()));
  }

  async function sendRecovery() {
    const ok = await run('send_recovery', async () => (await adminUserAction('send_recovery', p.profileId)).error);
    if (ok) { setDialog(null); p.onChanged(`E-mail de redefinição enviado para ${p.email}.`); }
  }

  async function makeLink() {
    await run('recovery_link', async () => {
      const { data, error } = await adminUserAction<{ link: string }>('recovery_link', p.profileId);
      if (data?.link) setLink(data.link);
      return error;
    });
  }

  async function revoke() {
    const ok = await run('revoke', async () => (await adminUserAction('revoke_sessions', p.profileId)).error);
    if (ok) { setDialog(null); p.onChanged('Usuário desconectado de todos os aparelhos.'); }
  }

  async function changeEmail() {
    const ok = await run('email', async () => (await adminUserAction('update_email', p.profileId, { email: newEmail })).error);
    if (ok) { setDialog(null); p.onChanged('E-mail alterado.'); }
  }

  async function confirmEmail() {
    const ok = await run('confirm', async () => (await adminUserAction('confirm_email', p.profileId)).error);
    if (ok) p.onChanged('E-mail confirmado.');
  }

  async function remove() {
    const ok = await run('delete', async () => (await adminUserAction('delete_user', p.profileId, { confirm: confirmText })).error);
    if (ok) p.onDeleted();
  }

  const btn = 'brutal-btn bg-white px-3 py-2 text-xs gap-2 justify-start w-full disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => open('impersonate')}
          disabled={protectedTarget}
          title={protectedTarget ? 'Não disponível para contas de admin' : undefined}
          className={`${btn} !bg-biored !text-white justify-center py-2.5 text-sm`}
        >
          <UserRoundCog className="w-4 h-4" /> Entrar como o usuário
        </button>
        <button onClick={() => open('recovery')} className={btn}><KeyRound className="w-4 h-4" /> Redefinir senha</button>
        <button onClick={() => open('revoke')} className={btn}><LogOut className="w-4 h-4" /> Desconectar de todos os aparelhos</button>
        <button onClick={() => open('email')} className={btn}><Mail className="w-4 h-4" /> Alterar e-mail</button>
        {!p.emailConfirmed && (
          <button onClick={confirmEmail} disabled={busy === 'confirm'} className={btn}>
            {busy === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />} Confirmar e-mail
          </button>
        )}
        <button
          onClick={() => open('delete')}
          disabled={protectedTarget}
          className={`${btn} hover:!bg-red-50 text-biored`}
        >
          <Trash2 className="w-4 h-4" /> Excluir conta
        </button>
      </div>
      {error && !dialog && <p className="text-sm text-biored font-bold mt-2">{error}</p>}

      {dialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !busy && setDialog(null)}>
          <div className="brutal-card bg-white p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-display text-xl">
                {dialog === 'impersonate' && 'Entrar como o usuário'}
                {dialog === 'recovery' && 'Redefinir senha'}
                {dialog === 'revoke' && 'Desconectar de todos os aparelhos'}
                {dialog === 'email' && 'Alterar e-mail'}
                {dialog === 'delete' && 'Excluir conta'}
              </h3>
              <button onClick={() => setDialog(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            {dialog === 'impersonate' && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Você vai abrir o painel como <strong>@{p.username}</strong>, com acesso completo. Tudo o que fizer vale para a conta
                  dessa pessoa. A sessão dura até 1 hora e termina em <strong>Voltar ao admin</strong>, na faixa vermelha.
                </p>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1">Motivo (fica registrado)</label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={300}
                  autoFocus
                  placeholder="Ex.: ajudar a configurar o domínio, pedido no WhatsApp"
                  className="brutal-input w-full px-3 py-2 text-sm mb-3"
                />
                {error && <p className="text-sm text-biored font-bold mb-3">{error}</p>}
                <button
                  onClick={impersonate}
                  disabled={reason.trim().length < 3 || busy === 'impersonate'}
                  className="brutal-btn bg-biored text-white w-full py-2.5 text-sm gap-2 disabled:opacity-50"
                >
                  {busy === 'impersonate' && <Loader2 className="w-4 h-4 animate-spin" />} Entrar na conta
                </button>
              </>
            )}

            {dialog === 'recovery' && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Envie o e-mail de redefinição para <strong>{p.email}</strong> ou gere um link para mandar pelo WhatsApp.
                  O link entra na conta e permite definir uma senha nova: envie só para o próprio usuário.
                </p>
                <div className="flex flex-col gap-2">
                  <button onClick={sendRecovery} disabled={!!busy} className="brutal-btn bg-black text-white py-2 text-sm gap-2 disabled:opacity-50">
                    {busy === 'send_recovery' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Enviar por e-mail
                  </button>
                  {!p.isAdmin && (
                    <button onClick={makeLink} disabled={!!busy} className="brutal-btn bg-white py-2 text-sm gap-2 disabled:opacity-50">
                      {busy === 'recovery_link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Gerar link
                    </button>
                  )}
                </div>
                {link && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input readOnly value={link} className="brutal-input px-2 py-1.5 text-xs flex-1 min-w-0" onFocus={e => e.currentTarget.select()} />
                      <button
                        onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}
                        className="brutal-btn bg-bioyellow px-3 text-xs gap-1"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">O link vale por tempo limitado e só pode ser usado uma vez.</p>
                  </div>
                )}
                {error && <p className="text-sm text-biored font-bold mt-3">{error}</p>}
              </>
            )}

            {dialog === 'revoke' && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Encerra todas as sessões de <strong>@{p.username}</strong> (celular, computador…). A pessoa precisará entrar de novo.
                  Útil se a senha vazou ou se alguém sem permissão acessou a conta.
                </p>
                {error && <p className="text-sm text-biored font-bold mb-3">{error}</p>}
                <button onClick={revoke} disabled={busy === 'revoke'} className="brutal-btn bg-black text-white w-full py-2.5 text-sm gap-2 disabled:opacity-50">
                  {busy === 'revoke' && <Loader2 className="w-4 h-4 animate-spin" />} Desconectar
                </button>
              </>
            )}

            {dialog === 'email' && (
              <>
                <p className="text-sm text-gray-600 mb-3">O novo e-mail passa a valer para o login na hora, já confirmado.</p>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  autoFocus
                  className="brutal-input w-full px-3 py-2 text-sm mb-3"
                />
                {error && <p className="text-sm text-biored font-bold mb-3">{error}</p>}
                <button
                  onClick={changeEmail}
                  disabled={!newEmail.trim() || newEmail.trim().toLowerCase() === p.email || busy === 'email'}
                  className="brutal-btn bg-black text-white w-full py-2.5 text-sm gap-2 disabled:opacity-50"
                >
                  {busy === 'email' && <Loader2 className="w-4 h-4 animate-spin" />} Salvar e-mail
                </button>
              </>
            )}

            {dialog === 'delete' && (
              <>
                {p.hasApprovedPayments ? (
                  <p className="text-sm text-gray-600">
                    Esta conta tem pagamentos aprovados. Excluir apagaria o histórico financeiro, que precisa ser guardado pela
                    legislação fiscal. <strong>Suspenda a conta</strong> no lugar.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Apaga a conta, todas as páginas, links, estatísticas e contatos de <strong>@{p.username}</strong>.
                      <strong> Não dá para desfazer.</strong> Digite <span className="font-mono font-bold">{p.username}</span> para confirmar.
                    </p>
                    <input
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      autoFocus
                      placeholder={p.username}
                      className="brutal-input w-full px-3 py-2 text-sm mb-3"
                    />
                    {error && <p className="text-sm text-biored font-bold mb-3">{error}</p>}
                    <button
                      onClick={remove}
                      disabled={confirmText.replace(/^@/, '').toLowerCase() !== p.username.toLowerCase() || busy === 'delete'}
                      className="brutal-btn bg-biored text-white w-full py-2.5 text-sm gap-2 disabled:opacity-50"
                    >
                      {busy === 'delete' && <Loader2 className="w-4 h-4 animate-spin" />} Excluir definitivamente
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
