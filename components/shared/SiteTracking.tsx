'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CookieConsent } from '@/components/shared/CookieConsent';
import { useConsent } from '@/lib/consent';
import { useAuth } from '@/lib/auth-context';
import { isSiteHost, isSitePath } from '@/lib/meta-pixel';

// Banner de cookies e Meta Pixel das páginas do BioFlowzy (landing, cadastro, painel, checkout).
// Páginas de usuários e domínios próprios têm o banner delas (BioClient) e o Pixel do próprio usuário.
export function SiteTracking({ pixelId }: { pixelId: string | null }) {
  const pathname = usePathname() ?? '/';
  const { consent } = useConsent();
  const { userId, email } = useAuth();
  const [isSite, setIsSite] = useState(false);
  const initialized = useRef(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    setIsSite(isSiteHost(window.location.hostname) && isSitePath(pathname));
  }, [pathname]);

  // O painel admin não é rastreado
  const track = isSite && !!pixelId && !!consent?.marketing && !pathname.startsWith('/admin');

  useEffect(() => {
    if (!track || !pixelId) return;
    if (!initialized.current) {
      loadPixel();
      // Correspondência avançada: o Pixel aplica o hash no navegador
      window.fbq?.('init', pixelId, { ...(email ? { em: email.toLowerCase() } : {}), ...(userId ? { external_id: userId } : {}) });
      initialized.current = true;
    }
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      window.fbq?.('track', 'PageView');
    }
  }, [track, pixelId, pathname, email, userId]);

  return isSite ? <CookieConsent variant="site" policyUrl="/privacidade#cookies" /> : null;
}

function loadPixel() {
  if (window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true; t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
}
