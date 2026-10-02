// Baja thumbnails de los top videos de TikTok via oEmbed publico.
// Los IDs vienen del scraping del perfil que hice en la sesion.
import { writeFileSync, mkdirSync } from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";

// Top videos de @sanitarios.conesa (ordenados por vistas aprox, tomados del perfil)
const videos = [
  { id: "7642401319138905351", views: "1.5M" },
  { id: "7641748237560335623", views: "285K" },
  { id: "7644024623402634504", views: "237K" },
  { id: "7376074707419892998", views: "161K" },
  { id: "7641407942226414866", views: "138K" },
  { id: "7647241028734323986", views: "109K" },
  { id: "7509936054514797830", views: "103K" },
  { id: "7465506073764531461", views: "96K" },
  { id: "7449821850273680646", views: "95K" },
  { id: "7415025595630898438", views: "86K" },
  { id: "7598248980279053575", views: "81K" },
  { id: "7473564410301156663", views: "77K" },
  { id: "7597881097816526136", views: "74K" },
  { id: "7532156285324709125", views: "71K" },
  { id: "7467593646234258694", views: "69K" },
  { id: "7474273782899756293", views: "68K" },
  { id: "7494400398908771589", views: "67K" },
  { id: "7639934294252621063", views: "61K" },
  { id: "7628274130697161991", views: "50K" },
  { id: "7512109335598599430", views: "44K" },
];

mkdirSync("public/tiktok", { recursive: true });

const results = [];
for (const v of videos) {
  const url = `https://www.tiktok.com/@sanitarios.conesa/video/${v.id}`;
  try {
    const r = await fetch("https://www.tiktok.com/oembed?url=" + encodeURIComponent(url), {
      headers: { "User-Agent": UA },
    });
    if (!r.ok) {
      console.log(`✗ ${v.id}: oembed HTTP ${r.status}`);
      continue;
    }
    const data = await r.json();
    if (!data.thumbnail_url) {
      console.log(`✗ ${v.id}: no thumbnail`);
      continue;
    }
    const img = await fetch(data.thumbnail_url, { headers: { "User-Agent": UA } });
    if (!img.ok) {
      console.log(`✗ ${v.id}: img HTTP ${img.status}`);
      continue;
    }
    const buf = Buffer.from(await img.arrayBuffer());
    writeFileSync(`public/tiktok/${v.id}.jpg`, buf);
    console.log(`✓ ${v.id} (${(buf.length / 1024).toFixed(0)}KB, ${v.views})`);
    results.push({ id: v.id, views: v.views });
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.log(`✗ ${v.id}: ${e.message}`);
  }
}

writeFileSync("src/data/tiktok-thumbnails.json", JSON.stringify(results, null, 2));
console.log(`\nTotal: ${results.length}/${videos.length}`);
