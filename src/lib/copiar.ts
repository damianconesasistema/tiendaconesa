// Copiar un texto al portapapeles desde el navegador.
//
// Primero la forma de ahora (navigator.clipboard). Algunos navegadores la
// niegan (sin permiso, adentro de otra app); ahi va la de antes, con un
// cuadro de texto escondido. Devuelve false si no hubo forma: el que llama
// muestra el texto para copiarlo a mano. Nunca usa window.prompt, que varios
// navegadores bloquean.

export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const t = document.createElement("textarea");
      t.value = texto;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
