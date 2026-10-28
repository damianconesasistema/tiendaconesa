-- La tienda de Capital pasa a buenosaires.conesa.com.ar.
--
-- El local esta en Balvanera, pero la tienda atiende Capital y Gran Buenos
-- Aires, y mas adelante el resto del pais. El subdominio es lo que escribe y
-- recuerda el cliente: "buenosaires" dice a quien le vende, "balvanera" dice
-- en que barrio esta el deposito.
--
-- El nombre que se muestra tambien pasa a Buenos Aires. La direccion sigue
-- diciendo Rincon 43, Balvanera, que es donde se retira.

UPDATE "Branch" SET subdominio = 'buenosaires', name = 'Buenos Aires'
  WHERE slug = 'bsas';
