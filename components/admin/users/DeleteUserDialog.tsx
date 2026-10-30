'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { adminUserAction } from '@/lib/admin-user';

type Props = {
  profileId: string;
  username: string;
  // Quando não se sabe (listagem), a edge function recusa contas com pagamento aprovado
  hasApprovedPayments?: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

// Exclusão definitiva da conta (edge function admin-user, ação delete_user)
export function DeleteUserDialog(p: Props) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setBusy(true);
    setError('');
    const { error } = await adminUserAction('delete_user', p.profileId, { confirm: confirmText });
    setBusy(false);
    if (error) setError(error);
    else p.onDeleted();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !busy && p.onClose()}>
      <div className="brutal-card bg-white p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-xl">Excluir conta</h3>
          <button onClick={p.onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>
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
              disabled={confirmText.replace(/^@/, '').toLowerCase() !== p.username.toLowerCase() || busy}
              className="brutal-btn bg-biored text-white w-full py-2.5 text-sm gap-2 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Excluir definitivamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
