import Script from "next/script";

// Analítica del sitio. Se activa sola cuando están cargadas las variables;
// si no hay ninguna, no inyecta nada.
//
//   NEXT_PUBLIC_CF_BEACON   token de Cloudflare Web Analytics
//   NEXT_PUBLIC_GA_ID       ID de Google Analytics 4 (G-XXXXXXX)
//
// Son NEXT_PUBLIC_ a propósito: corren en el navegador del visitante, no son
// secretos. Cualquiera puede verlas en el código de la página, y está bien.

export function Analytics() {
  const cf = process.env.NEXT_PUBLIC_CF_BEACON;
  const ga = process.env.NEXT_PUBLIC_GA_ID;

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
    </>
  );
}
