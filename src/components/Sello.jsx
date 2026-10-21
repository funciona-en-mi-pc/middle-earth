/* =========================================================
   Sello — el rombo doble de Middle Earth
   ---------------------------------------------------------
   DUENO: Javier

   Reemplaza al logo.png, que era dorado fijo. Aqui el rombo
   de afuera es oro y el de adentro toma el color de la region
   (--acento), igual que el sello del mockup: en Rivendel es
   azul, en la Comarca verde y en el panel rojo. Al cambiar de
   pagina el color cambia solo, porque lo decide el CSS.

   Es decorativo (aria-hidden): el texto "Middle Earth" que va
   al lado ya le da nombre al enlace.
   ========================================================= */

function Sello({ tamano = 30, className = '' }) {
  return (
    <svg
      className={`sello ${className}`}
      width={tamano}
      height={tamano}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <path className="sello-exterior" d="M16 2.5 29.5 16 16 29.5 2.5 16Z" />
      <path className="sello-interior" d="M16 9 23 16 16 23 9 16Z" />
    </svg>
  )
}

export default Sello
