'use client';

import { useCurrentPage } from '@/lib/page-context';

// Seletor da página editada no painel; só aparece quando a conta tem mais de uma página
export function PageSwitcher() {
  const { pages, pageId, setPageId } = useCurrentPage();
  if (pages.length < 2) return null;

  return (
    <label className="flex flex-col gap-1 mb-4 text-[10px] font-bold uppercase tracking-wide">
      Editando a página
      <select
        value={pageId ?? ''}
        onChange={e => setPageId(e.target.value)}
        className="brutal-input px-2 py-2 text-sm normal-case tracking-normal bg-bioyellow"
      >
        {pages.map(p => (
          <option key={p.id} value={p.id}>
            /{p.username}{p.owner_id ? '' : ' (principal)'}
          </option>
        ))}
      </select>
    </label>
  );
}
