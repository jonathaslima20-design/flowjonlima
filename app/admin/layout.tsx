'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Palette,
  Images,
  CreditCard,
  LogOut,
  Waypoints,
  ShieldCheck,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Usuários', icon: Users, exact: false },
  { href: '/admin/themes', label: 'Temas', icon: Palette, exact: false },
  { href: '/admin/theme-showcase', label: 'Vitrine', icon: Images, exact: false },
  { href: '/admin/plans', label: 'Planos', icon: CreditCard, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const { ready, userId, role, signOut: ctxSignOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!userId) { router.replace('/login'); return; }
    if (role !== 'admin') { router.replace('/dashboard'); }
  }, [ready, userId, role, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  async function signOut() {
    await ctxSignOut();
    router.push('/');
  }

  if (!ready || !userId || role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-lg">
        Verificando acesso...
      </div>
    );
  }

  const sidebar = (
    <>
      <div className="p-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 mb-1">
          <span className="w-8 h-8 bg-bioyellow brutal-border flex items-center justify-center">
            <Waypoints className="w-4 h-4 text-black" />
          </span>
          <span className="font-display text-lg text-white">BioFlowzy</span>
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-bioyellow" />
          <span className="text-xs text-white/50 font-bold tracking-wider uppercase">Admin Panel</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded font-bold text-sm transition-all ${
                active
                  ? 'bg-bioyellow text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors font-bold"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-red-400 transition-colors font-bold w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-black text-white flex items-center justify-between px-4 py-3 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-7 h-7 bg-bioyellow brutal-border flex items-center justify-center">
            <Waypoints className="w-3.5 h-3.5 text-black" />
          </span>
          <span className="font-display text-base">BioFlowzy</span>
          <span className="text-[10px] text-bioyellow font-bold tracking-wider uppercase ml-1">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="w-10 h-10 rounded bg-bioyellow text-black flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <aside className="fixed left-0 top-0 h-screen w-60 bg-black text-white flex-col hidden md:flex z-10">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-black text-white flex flex-col animate-in slide-in-from-left">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="self-end m-3 w-9 h-9 rounded bg-white/10 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="md:ml-60 flex-1 min-h-screen pt-14 md:pt-0">{children}</main>
    </div>
  );
}
