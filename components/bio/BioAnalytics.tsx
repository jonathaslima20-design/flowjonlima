'use client';

import Script from 'next/script';
import { validatePixelId, validateGaId } from '@/lib/tracking';

export function BioAnalytics({
  metaPixelId,
  gaId,
  metaEnabled,
  gaEnabled,
}: {
  metaPixelId?: string | null;
  gaId?: string | null;
  metaEnabled?: boolean;
  gaEnabled?: boolean;
}) {
  const pixelOk = metaEnabled !== false && validatePixelId(metaPixelId || '');
  const gaOk = gaEnabled !== false && validateGaId(gaId || '');

  return (
    <>
      {pixelOk && (
        <>
          <Script id="meta-pixel-base" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s){
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)
              }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {gaOk && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-base" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
