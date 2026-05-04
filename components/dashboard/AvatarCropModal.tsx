'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Props {
  imageSrc: string | null;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

interface CropState {
  x: number;
  y: number;
  zoom: number;
}

export function AvatarCropModal({ imageSrc, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, zoom: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; cx: number; cy: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const CANVAS_SIZE = 320;

  // Reset state when a new image is opened
  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0, zoom: 1 });
      setImgLoaded(false);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImgLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Fill background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const scale = (Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight)) * crop.zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const cx = CANVAS_SIZE / 2 + crop.x;
    const cy = CANVAS_SIZE / 2 + crop.y;

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

    // Dark overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 8, 0, Math.PI * 2);
    ctx.stroke();
  }, [crop]);

  useEffect(() => {
    if (imgLoaded) draw();
  }, [imgLoaded, draw]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setCrop(c => ({ ...c, x: dragStart.current!.cx + dx, y: dragStart.current!.cy + dy }));
  }

  function onMouseUp() { setDragging(false); }

  // Touch support
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { mx: t.clientX, my: t.clientY, cx: crop.x, cy: crop.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setCrop(c => ({ ...c, x: dragStart.current!.cx + dx, y: dragStart.current!.cy + dy }));
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img) return;
    setProcessing(true);

    const OUTPUT = 400;
    const out = document.createElement('canvas');
    out.width = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext('2d')!;

    const scale = (Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight)) * crop.zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const cx = CANVAS_SIZE / 2 + crop.x;
    const cy = CANVAS_SIZE / 2 + crop.y;

    // Crop source rect (circle area inside CANVAS_SIZE)
    const radius = CANVAS_SIZE / 2 - 8;
    const srcX = (cx - radius - (cx - drawW / 2)) / scale;
    const srcY = (cy - radius - (cy - drawH / 2)) / scale;
    const srcSize = (radius * 2) / scale;

    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    out.toBlob(blob => {
      setProcessing(false);
      if (!blob) return;
      onConfirm(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={open => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden brutal-border bg-white">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-display text-xl">Recortar foto de perfil</DialogTitle>
          <p className="text-sm text-black/60 mt-1">Arraste para ajustar o enquadramento.</p>
        </DialogHeader>

        <div className="flex justify-center mt-4 px-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-sm"
            style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4 flex items-center gap-3">
          <span className="text-xs font-bold text-black/50">-</span>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.05}
            value={crop.zoom}
            onChange={e => setCrop(c => ({ ...c, zoom: Number(e.target.value) }))}
            className="flex-1 accent-[#FACC15] h-1 cursor-pointer"
          />
          <span className="text-xs font-bold text-black/50">+</span>
        </div>

        <DialogFooter className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="brutal-btn bg-white flex-1 py-2.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing || !imgLoaded}
            className="brutal-btn bg-bioyellow flex-1 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {processing ? 'Processando...' : 'Aplicar recorte'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
