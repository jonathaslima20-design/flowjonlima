'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Waypoints, Menu, X } from 'lucide-react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? 'bg-white border-b-2 border-black' : 'bg-transparent border-b-2 border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-9 h-9 bg-bioblue brutal-border brutal-shadow flex items-center justify-center">
            <Waypoints className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-xl tracking-tight">BioFlowzy</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-bold">
          <a href="#features" className="hover:text-bioblue">Recursos</a>
          <a href="#pricing" className="hover:text-bioblue">Preços</a>
          <a href="#faq" className="hover:text-bioblue">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="font-bold">Entrar</Link>
          <Link
            href="/register"
            className="brutal-btn bg-bioyellow text-black px-4 py-2 text-sm"
          >
            Criar grátis
          </Link>
        </div>

        <button className="md:hidden brutal-btn bg-white w-10 h-10" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t-2 border-black">
          <div className="px-4 py-4 flex flex-col gap-3 font-bold">
            <a href="#features">Recursos</a>
            <a href="#pricing">Preços</a>
            <a href="#faq">FAQ</a>
            <Link href="/login">Entrar</Link>
            <Link href="/register" className="brutal-btn bg-bioyellow px-4 py-2 w-fit">Criar grátis</Link>
          </div>
        </div>
      )}
    </header>
  );
}
