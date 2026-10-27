'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ICON_CATEGORIES, ICON_LIBRARY, getLibraryIcon, libraryIconValue } from '@/lib/link-icon-library';

// Janela para escolher um ícone da biblioteca (tela de Links e editor de demonstrações do admin)
export function IconLibraryPicker({ value, onPick, onClose }: { value?: string | null; onPick: (icon: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const current = getLibraryIcon(value)?.key;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return ICON_LIBRARY.filter(i => {
      if (cat !== 'all' && i.category !== cat) return false;
      if (!q) return true;
      const hay = `${i.label} ${i.key} ${i.category}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return hay.includes(q);
    });
  }, [query, cat]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white brutal-border brutal-shadow-xl max-w-xl w-full p-5 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-2xl">Biblioteca de ícones</h2>
          <button onClick={onClose} className="brutal-btn bg-white w-9 h-9" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar: loja, agenda, curso, pizza…" className="w-full brutal-input pl-9 pr-3 py-2 text-sm" />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['all', ...ICON_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCat(c)} className={`brutal-border px-2 py-0.5 text-[10px] font-bold uppercase ${cat === c ? 'bg-bioyellow' : 'bg-white'}`}>
              {c === 'all' ? 'Todos' : c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 overflow-y-auto pr-1">
          {list.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => { onPick(libraryIconValue(key)); onClose(); }}
              title={label}
              className={`brutal-border p-2 flex flex-col items-center gap-1 transition-colors ${current === key ? 'bg-bioyellow' : 'bg-white hover:bg-bioyellow/50'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-bold leading-tight text-center truncate w-full">{label}</span>
            </button>
          ))}
          {list.length === 0 && <p className="col-span-full text-xs text-black/60">Nenhum ícone encontrado.</p>}
        </div>
      </div>
    </div>
  );
}
