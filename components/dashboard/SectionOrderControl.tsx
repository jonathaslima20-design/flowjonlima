'use client';

import { useState, useRef } from 'react';
import { GripVertical, Users, Link, Image, Play } from 'lucide-react';

const SECTION_META: Record<string, { label: string; icon: typeof Users }> = {
  socials: { label: 'Redes Sociais', icon: Users },
  links: { label: 'Links', icon: Link },
  banners: { label: 'Banners', icon: Image },
  videos: { label: 'Vídeos', icon: Play },
};

const DEFAULT_ORDER = ['socials', 'links', 'banners', 'videos'];

type Props = {
  order: string[];
  onChange: (next: string[]) => void;
};

export function SectionOrderControl({ order, onChange }: Props) {
  const items = order.length === 4 ? order : DEFAULT_ORDER;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const touchStart = useRef<{ id: string; y: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function onDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const ids = [...items];
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    setDraggingId(null);
    setOverId(null);
    onChange(ids);
  }

  function handleTouchStart(id: string, e: React.TouchEvent) {
    touchStart.current = { id, y: e.touches[0].clientY };
    setDraggingId(id);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current || !listRef.current) return;
    const y = e.touches[0].clientY;
    const els = Array.from(listRef.current.querySelectorAll('[data-section-id]'));
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        const id = (el as HTMLElement).dataset.sectionId!;
        if (id !== touchStart.current.id) {
          setOverId(id);
        }
        break;
      }
    }
  }

  function handleTouchEnd() {
    if (overId && draggingId) {
      onDrop(overId);
    } else {
      setDraggingId(null);
      setOverId(null);
    }
    touchStart.current = null;
  }

  return (
    <div ref={listRef} className="flex flex-col gap-2">
      {items.map((key) => {
        const meta = SECTION_META[key];
        if (!meta) return null;
        const Icon = meta.icon;
        const isDragging = draggingId === key;
        const isOver = overId === key && draggingId !== key;

        return (
          <div
            key={key}
            data-section-id={key}
            draggable
            onDragStart={() => setDraggingId(key)}
            onDragOver={(e) => { e.preventDefault(); setOverId(key); }}
            onDragLeave={() => { if (overId === key) setOverId(null); }}
            onDrop={(e) => { e.preventDefault(); onDrop(key); }}
            onDragEnd={() => { setDraggingId(null); setOverId(null); }}
            onTouchStart={(e) => handleTouchStart(key, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
              flex items-center gap-3 px-4 py-3 border-[3px] border-black select-none cursor-grab active:cursor-grabbing transition-all
              ${isDragging ? 'bg-bioyellow opacity-70 scale-[0.97]' : 'bg-white'}
              ${isOver ? 'border-dashed border-black/50 translate-y-[-2px]' : ''}
            `}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="w-4 h-4 text-black/40 shrink-0" />
            <Icon className="w-5 h-5 text-black/70 shrink-0" />
            <span className="font-bold text-sm">{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}
