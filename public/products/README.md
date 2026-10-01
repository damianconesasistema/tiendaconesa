# Fotos de productos

Para que cada producto del catalogo muestre su foto real:

1. Guardar la foto como JPG
2. Nombrarla con el `ITEM_ID` del producto, ej: `MLA1367528249.jpg`
3. Colocarla en esta carpeta
4. Pushear al repo (git add + commit + push)

Si no existe `/public/products/{ITEM_ID}.jpg`, la card muestra el
placeholder gris con el icono de paquete.

El `ITEM_ID` esta en `src/data/products.json` o en el permalink de ML.
