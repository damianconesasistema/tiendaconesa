-- Cada local tiene su propio Instagram, que es por donde le escribe la
-- gente: Traslasierra @sanitariosconesatraslasierra y Capital
-- @sanitariosconesa. Hasta ahora habia uno solo, escrito en el codigo.

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "instagram" TEXT;

UPDATE "Branch" SET "instagram" = 'https://www.instagram.com/sanitariosconesatraslasierra/'
  WHERE slug = 'traslasierra' AND "instagram" IS NULL;
UPDATE "Branch" SET "instagram" = 'https://www.instagram.com/sanitariosconesa/'
  WHERE slug = 'bsas' AND "instagram" IS NULL;
