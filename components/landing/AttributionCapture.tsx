'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';

// Guarda de onde veio a visita para registrar a origem no cadastro
export function AttributionCapture() {
  useEffect(() => { captureAttribution(); }, []);
  return null;
}
