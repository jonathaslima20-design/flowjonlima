'use client';

import { useMemo, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { ControlDef } from '@/themes/types';
import { CURATED_FONTS } from '@/themes/types';

type Props = {
  controls: ControlDef[];
  values: Record<string, any>;
  coreValues?: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onCoreChange?: (field: string, value: any) => void;
  onReset: () => void;
  onResetGroup?: (group: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  cores: 'Cores',
  tipografia: 'Tipografia',
  layout: 'Layout',
  textos: 'Textos',
  efeitos: 'Efeitos',
  geral: 'Geral',
};

function inferCategory(c: ControlDef): string {
  if ((c as any).category) return (c as any).category;
  if (c.type === 'color' || c.type === 'colorPicker' || c.type === 'coreColor') return 'cores';
  if (c.type === 'coreNumber') return 'layout';
  if (c.type === 'fontFamily') return 'tipografia';
  if (c.type === 'text' || c.type === 'textarea') return 'textos';
  const g = (c.group || '').toLowerCase();
  if (g.includes('cor')) return 'cores';
  if (g.includes('text')) return 'textos';
  if (g.includes('font') || g.includes('tipo')) return 'tipografia';
  if (g.includes('layout') || g.includes('densid') || g.includes('espa')) return 'layout';
  if (g.includes('efeit') || g.includes('anim')) return 'efeitos';
  return 'geral';
}

export function ThemeControls({ controls, values, coreValues, onChange, onCoreChange, onReset, onResetGroup }: Props) {
  function getValue(c: ControlDef): any {
    if (c.type === 'coreColor' || c.type === 'coreNumber') {
      const v = coreValues?.[c.field];
      return v !== undefined && v !== null ? v : (c as any).default;
    }
    return values[c.key] ?? (c as any).default;
  }
  function handleChange(c: ControlDef, v: any) {
    if (c.type === 'coreColor' || c.type === 'coreNumber') {
      onCoreChange?.(c.field, v);
    } else {
      onChange(c.key, v);
    }
  }
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');

  const enriched = useMemo(() => controls.filter(c => c.type !== 'colorPicker').map(c => ({ c, cat: inferCategory(c) })), [controls]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(x => set.add(x.cat));
    return Array.from(set);
  }, [enriched]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter(({ c, cat }) => {
      if (activeCat !== 'all' && cat !== activeCat) return false;
      if (!q) return true;
      return c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q);
    });
  }, [enriched, query, activeCat]);

  const groups = useMemo(() => {
    const map: Record<string, ControlDef[]> = {};
    for (const { c } of filtered) {
      const g = c.group || 'Ajustes';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    }
    return map;
  }, [filtered]);

  if (controls.length === 0) {
    return <p className="text-xs text-black/60">Este tema nao possui controles avancados.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar controle..."
            className="w-full brutal-input pl-8 pr-3 py-2 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip label="Todos" active={activeCat === 'all'} onClick={() => setActiveCat('all')} />
          {categories.map(c => (
            <CategoryChip key={c} label={CATEGORY_LABELS[c] || c} active={activeCat === c} onClick={() => setActiveCat(c)} />
          ))}
        </div>
      </div>

      {Object.keys(groups).length === 0 && (
        <p className="text-xs text-black/60">Nenhum controle encontrado.</p>
      )}

      {Object.entries(groups).map(([group, items]) => (
        <div key={group} className="border-t-2 border-black/10 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/60">{group}</h4>
            {onResetGroup && (
              <button
                onClick={() => onResetGroup(group)}
                className="text-[10px] font-bold uppercase text-black/50 hover:text-black inline-flex items-center gap-1"
                title={`Restaurar padrões de ${group}`}
              >
                <RotateCcw className="w-3 h-3" /> Padrão
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {items.map(c => (
              <Control key={c.key} def={c} value={getValue(c)} onChange={(v) => handleChange(c, v)} />
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={onReset}
        className="self-start text-xs font-bold uppercase tracking-widest underline underline-offset-4 text-black/70 hover:text-black"
      >
        Restaurar todos os padrões
      </button>
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest brutal-border ${active ? 'bg-bioyellow' : 'bg-white hover:bg-black/5'}`}
    >
      {label}
    </button>
  );
}

function Control({ def, value, onChange }: { def: ControlDef; value: any; onChange: (v: any) => void }) {
  if (def.type === 'coreColor') {
    const isCustom = !def.palette.includes(value);
    return (
      <div className="text-xs font-bold">
        <div className="mb-2">{def.label}</div>
        <div className="flex flex-wrap gap-2 items-center">
          {def.palette.map(c => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={`w-9 h-9 brutal-border ${value === c ? 'brutal-shadow' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <label
            className={`w-9 h-9 brutal-border cursor-pointer relative overflow-hidden flex items-center justify-center ${isCustom ? 'brutal-shadow' : ''}`}
            style={{ backgroundColor: isCustom ? value : 'transparent' }}
            title="Cor personalizada"
          >
            {!isCustom && (
              <span className="text-[16px] leading-none select-none pointer-events-none" style={{ background: 'linear-gradient(135deg, red, orange, yellow, green, cyan, blue, violet)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬤</span>
            )}
            <input
              type="color"
              value={isCustom ? value : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  }

  if (def.type === 'coreNumber') {
    return (
      <label className="block">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span>{def.label}</span>
          <span className="tabular-nums text-black/70">{value}{def.suffix || ''}</span>
        </div>
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step || 1}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-black"
        />
      </label>
    );
  }

  if (def.type === 'slider') {
    return (
      <label className="block">
        <div className="flex items-center justify-between text-xs font-bold mb-1">
          <span>{def.label}</span>
          <span className="tabular-nums text-black/70">{value}{def.suffix || ''}</span>
        </div>
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step || 1}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-black"
        />
      </label>
    );
  }

  if (def.type === 'toggle') {
    return (
      <label className="flex items-center justify-between text-sm font-bold cursor-pointer">
        <span>{def.label}</span>
        <span
          onClick={() => onChange(!value)}
          role="switch"
          aria-checked={!!value}
          className={`relative w-12 h-6 brutal-border transition-colors ${value ? 'bg-bioyellow' : 'bg-white'}`}
        >
          <span
            className={`absolute top-0 left-0 w-5 h-5 m-0.5 bg-black transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </span>
      </label>
    );
  }

  if (def.type === 'select') {
    return (
      <label className="block text-xs font-bold">
        <div className="mb-1">{def.label}</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full brutal-input py-2 text-sm bg-white"
        >
          {def.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (def.type === 'fontFamily') {
    const currentFont = CURATED_FONTS.find(f => f.value === value);
    return (
      <label className="block text-xs font-bold">
        <div className="mb-1">{def.label}</div>
        <select
          value={value || def.default}
          onChange={(e) => onChange(e.target.value)}
          className="w-full brutal-input py-2 text-sm bg-white"
          style={{ fontFamily: currentFont?.stack }}
        >
          {CURATED_FONTS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className="mt-2 px-3 py-2 brutal-border bg-white text-base truncate" style={{ fontFamily: currentFont?.stack }}>
          The quick brown fox jumps
        </div>
      </label>
    );
  }

  if (def.type === 'radio') {
    return (
      <div className="text-xs font-bold">
        <div className="mb-2">{def.label}</div>
        <div className="grid grid-cols-3 gap-2">
          {def.options.map(o => (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              className={`brutal-btn px-2 py-2 text-xs ${value === o.value ? 'bg-bioyellow' : 'bg-white'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (def.type === 'color') {
    const isCustom = !def.palette.includes(value);
    return (
      <div className="text-xs font-bold">
        <div className="mb-2">{def.label}</div>
        <div className="flex flex-wrap gap-2 items-center">
          {def.palette.map(c => (
            <button
              key={c}
              onClick={() => onChange(c)}
              className={`w-8 h-8 brutal-border ${value === c ? 'brutal-shadow' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <label
            className={`w-8 h-8 brutal-border cursor-pointer relative overflow-hidden flex items-center justify-center ${isCustom ? 'brutal-shadow' : ''}`}
            style={{ backgroundColor: isCustom ? value : 'transparent' }}
            title="Cor personalizada"
          >
            {!isCustom && (
              <span className="text-[14px] leading-none select-none pointer-events-none" style={{ background: 'linear-gradient(135deg, red, orange, yellow, green, cyan, blue, violet)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⬤</span>
            )}
            <input
              type="color"
              value={isCustom ? value : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    );
  }

  if (def.type === 'colorPicker') {
    return null;
  }

  if (def.type === 'text') {
    const max = def.maxLength ?? 80;
    const len = typeof value === 'string' ? value.length : 0;
    return (
      <label className="block text-xs font-bold">
        <div className="flex items-center justify-between mb-1">
          <span>{def.label}</span>
          <span className="text-black/50 tabular-nums">{len}/{max}</span>
        </div>
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value.slice(0, max))}
          placeholder={def.placeholder}
          maxLength={max}
          className="w-full brutal-input py-2 px-3 text-sm font-normal"
        />
      </label>
    );
  }

  if (def.type === 'textarea') {
    const max = def.maxLength ?? 400;
    const len = typeof value === 'string' ? value.length : 0;
    return (
      <label className="block text-xs font-bold">
        <div className="flex items-center justify-between mb-1">
          <span>{def.label}</span>
          <span className="text-black/50 tabular-nums">{len}/{max}</span>
        </div>
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value.slice(0, max))}
          placeholder={def.placeholder}
          rows={def.rows ?? 3}
          maxLength={max}
          className="w-full brutal-input py-2 px-3 text-sm font-normal resize-y font-mono"
        />
      </label>
    );
  }

  return null;
}
