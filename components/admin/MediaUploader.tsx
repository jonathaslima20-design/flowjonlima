'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Trash2, Loader as Loader2, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const BUCKET = 'theme-showcase';

type Props = {
  kind: 'image' | 'video';
  value?: string | null;
  pathPrefix: string;
  maxSizeMB?: number;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  label?: string;
};

function inferExt(file: File): string {
  const byName = file.name.split('.').pop();
  if (byName && byName.length <= 5) return byName.toLowerCase();
  const byType = file.type.split('/')[1];
  return (byType || 'bin').toLowerCase();
}

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  return url.substring(idx + marker.length);
}

export function MediaUploader({
  kind,
  value,
  pathPrefix,
  maxSizeMB,
  onUploaded,
  onRemove,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const limit = maxSizeMB ?? (kind === 'video' ? 50 : 5);
  const accept = kind === 'image' ? 'image/*' : 'video/*';

  async function handleFile(file: File) {
    setError('');
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > limit) {
      setError(`Arquivo acima de ${limit}MB.`);
      return;
    }
    if (kind === 'image' && !file.type.startsWith('image/')) {
      setError('Envie uma imagem válida.');
      return;
    }
    if (kind === 'video' && !file.type.startsWith('video/')) {
      setError('Envie um vídeo válido.');
      return;
    }

    setUploading(true);
    try {
      const ext = inferExt(file);
      const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setError(upErr.message);
        setUploading(false);
        return;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const newUrl = pub.publicUrl;

      if (value) {
        const prev = extractStoragePath(value);
        if (prev) {
          void supabase.storage.from(BUCKET).remove([prev]);
        }
      }

      onUploaded(newUrl);
    } catch (e: any) {
      setError(e?.message || 'Falha no upload.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function triggerPick() {
    inputRef.current?.click();
  }

  function handleRemove() {
    if (value) {
      const prev = extractStoragePath(value);
      if (prev) void supabase.storage.from(BUCKET).remove([prev]);
    }
    onRemove?.();
  }

  const hasValue = !!value;

  return (
    <div className="flex flex-col gap-2">
      {label && <div className="text-xs font-bold">{label}</div>}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 brutal-border bg-[#F7F7F5] flex items-center justify-center overflow-hidden shrink-0">
          {hasValue && kind === 'image' ? (
            <img src={value!} alt="" className="w-full h-full object-cover" />
          ) : hasValue && kind === 'video' ? (
            <VideoIcon className="w-6 h-6" />
          ) : kind === 'image' ? (
            <ImageIcon className="w-6 h-6 text-black/40" />
          ) : (
            <VideoIcon className="w-6 h-6 text-black/40" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={triggerPick}
              disabled={uploading}
              className="brutal-btn bg-white px-3 py-1.5 text-xs gap-1"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? 'Enviando...' : hasValue ? 'Trocar' : 'Enviar arquivo'}
            </button>
            {hasValue && onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="brutal-btn bg-white px-2 py-1.5 text-xs gap-1 hover:bg-red-100"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </button>
            )}
          </div>
          <span className="text-[10px] text-black/50">Até {limit}MB</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {error && <p className="text-[11px] text-red-600 font-bold">{error}</p>}
    </div>
  );
}
