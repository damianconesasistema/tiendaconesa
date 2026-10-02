// Test: buscar imagenes de un producto via DuckDuckGo Images (sin auth)
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function searchDDG(query) {
  // Paso 1: pedir pagina inicial para obtener token vqd
  const page = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
  });
  const html = await page.text();
  const vqdMatch = html.match(/vqd=['"]?(\d-\d+-\d+)['"]?/);
  const vqd = vqdMatch ? vqdMatch[1] : null;
  console.log("Found vqd:", vqd);
  if (!vqd) return { error: "no vqd", htmlLen: html.length };

  // Paso 2: llamar al endpoint JSON
  const r = await fetch(
    `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,`,
    {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": "https://duckduckgo.com/",
      },
    }
  );
  console.log("JSON status:", r.status);
  if (!r.ok) return { error: `HTTP ${r.status}` };
  const data = await r.json();
  return {
    count: data.results?.length,
    firstImage: data.results?.[0]?.image,
    firstThumb: data.results?.[0]?.thumbnail,
    firstTitle: data.results?.[0]?.title,
  };
}

const query = "Asiento Inodoro D'accord Ecco Polipropileno Blanco";
console.log("Querying:", query);
const res = await searchDDG(query);
console.log(JSON.stringify(res, null, 2));
