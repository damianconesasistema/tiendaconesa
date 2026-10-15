import Script from "next/script";
import { Suspense } from "react";
import { MetaPageView } from "@/components/MetaPageView";

// Analítica del sitio. Se activa sola cuando están cargadas las variables;
// si no hay ninguna, no inyecta nada.
//
//   NEXT_PUBLIC_CF_BEACON     token de Cloudflare Web Analytics
//   NEXT_PUBLIC_GA_ID         ID de Google Analytics 4 (G-XXXXXXX)
//   NEXT_PUBLIC_FB_PIXEL_ID   ID del pixel de Meta (Facebook / Instagram)
//
// Son NEXT_PUBLIC_ a propósito: corren en el navegador del visitante, no son
// secretos. Cualquiera puede verlas en el código de la página, y está bien.

export function Analytics() {
  const cf = process.env.NEXT_PUBLIC_CF_BEACON;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const fb = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  return (
    <>
      {/* Cloudflare Web Analytics: no usa cookies ni rastrea personas, así
          que no necesita cartel de consentimiento. */}
      {cf && (
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={`{"token": "${cf}"}`}
        />
      )}

      {/* Google Analytics 4 */}
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga}');
            `}
          </Script>
        </>
      )}

      {/* Pixel de Meta. Manda el PageView de la primera carga; las
          navegaciones internas las avisa <MetaPageView>, porque la tienda no
          recarga la página al moverse entre pantallas. */}
      {fb && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fb}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${fb}&ev=PageView&noscript=1`}
            />
          </noscript>
          {/* useSearchParams necesita Suspense para no forzar render dinámico */}
          <Suspense fallback={null}>
            <MetaPageView />
          </Suspense>
        </>
      )}
    </>
  );
}
