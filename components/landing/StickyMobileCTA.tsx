'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Botão fixo no celular: aparece depois do hero e some quando a chamada final está na tela
export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      const finalCta = document.getElementById('comecar');
      const finalInView = finalCta ? finalCta.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(window.scrollY > 700 && !finalInView);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white border-t-2 border-black transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <Link href="/register" tabIndex={visible ? 0 : -1} className="brutal-btn bg-bioblue text-white w-full py-3 gap-2">
        Criar minha página grátis <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
