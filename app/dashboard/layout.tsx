'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Link2, ChartBar as BarChart3, Palette, Settings, LogOut, Waypoints, ShieldCheck, Video, Image as ImageIcon, AtSign, Menu, X, Gift, LifeBuoy } from 'lucide-react';
import { UpgradeModalProvider } from '@/components/dashboard/UpgradeModal';
import { SidebarPlanCard } from '@/components/dashboard/SidebarPlanCard';

const nav = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/dashboard/socials', label: 'Redes sociais', icon: AtSign },
  { href: '/dashboard/links', label: 'Links', icon: Link2 },
  { href: '/dashboard/banners', label: 'Banners', icon: ImageIcon },
  { href: '/dashboard/videos', label: 'Vídeos', icon: Video },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/customize', label: 'Aparência', icon: Palette },
  { href: '/dashboard/referral', label: 'Indique e ganhe', icon: Gift },
  { href: '/dashboard/help', label: 'Central de Ajuda', icon: LifeBuoy },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { ready, userId, role, signOut: ctxSignOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !userId) router.replace('/login');
  }, [ready, userId, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  async function signOut() {
    await ctxSignOut();
    router.push('/');
  }

  if (!ready || !userId) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Carregando...</div>;
  }

  const isAdmin = role === 'admin';

  const navContent = (
    <>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="w-9 h-9 bg-bioblue brutal-border flex items-center justify-center">
          <Waypoints className="w-5 h-5 text-white" />
        </span>
        <span className="font-display text-xl">BioFlowzy</span>
      </Link>
      <nav className="flex flex-col gap-2 flex-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 brutal-border font-bold text-sm ${active ? 'bg-bioyellow brutal-shadow' : 'bg-white border-transparent hover:border-black'}`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2 brutal-border font-bold text-sm bg-bioblue text-white"
          >
            <ShieldCheck className="w-4 h-4" /> Admin
          </Link>
        )}
      </nav>
      <SidebarPlanCard />
      <button onClick={signOut} className="brutal-btn bg-white py-2 mt-3 text-sm gap-2">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </>
  );

  return (
    <UpgradeModalProvider>
    <div className="min-h-screen bg-biolime/20">
      <header className="md:hidden sticky top-0 z-30 bg-white brutal-border border-x-0 border-t-0 border-b-2 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-bioblue brutal-border flex items-center justify-center">
            <Waypoints className="w-4 h-4 text-white" />
          </span>
          <span className="font-display text-lg">BioFlowzy</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="w-10 h-10 brutal-border bg-bioyellow flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <aside className="fixed left-0 top-0 h-screen w-64 bg-white brutal-border border-l-0 border-y-0 border-r-2 p-4 hidden md:flex flex-col">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white brutal-border border-l-0 border-y-0 border-r-2 p-4 flex flex-col animate-in slide-in-from-left">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="self-end w-9 h-9 brutal-border bg-white flex items-center justify-center mb-2"
            >
              <X className="w-4 h-4" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <main className="md:ml-64 p-6 md:p-10">{children}</main>
    </div>
    </UpgradeModalProvider>
  );
}
