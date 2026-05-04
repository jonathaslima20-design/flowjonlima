'use client';

import {
  Rocket, Link2, AtSign, Video, Image as ImageIcon, Palette, Globe, Plug,
  ChartBar as BarChart3, CreditCard, Gift, ShieldCheck, BookOpen, LifeBuoy,
} from 'lucide-react';

const MAP: Record<string, any> = {
  Rocket, Link2, AtSign, Video, Image: ImageIcon, Palette, Globe, Plug,
  BarChart3, CreditCard, Gift, ShieldCheck, BookOpen, LifeBuoy,
};

export function HelpIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const Icon = MAP[name] || BookOpen;
  return <Icon className={className} />;
}
