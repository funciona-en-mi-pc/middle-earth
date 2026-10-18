/* =========================================================
   EmblemaCategoria — el sello heraldico de cada categoria
   ---------------------------------------------------------
   DUENO: Javier · mejora visual del Hito 4

   POR QUE EXISTE
   Las fotos de los objetos vienen del mockup de la etapa 1,
   que tenia OTROS productos. Al pasar al catalogo del SQL,
   cuatro de las ocho quedaron desemparejadas: el Arco de los
   Galadhrim sale con un amuleto, las Lembas (que son pan) con
   una pocion.

   En vez de fotos que mienten, cada categoria tiene su sello
   dibujado en SVG, en el color de la rareza del objeto:

     Armas ....... dos espadas cruzadas
     Armaduras ... un escudo
     Pociones .... un frasco
     Accesorios .. un rombo con su anillo

   VENTAJAS SOBRE UNA FOTO
     - Nitido en cualquier pantalla, pesa unos cientos de bytes
     - Toma el color de la rareza: comunica sin leer
     - No depende de imagenes con derechos de autor

   Si manana consiguen fotos de verdad, se usan en vez de
   esto: ProductoCard decide cual mostrar.
   ========================================================= */

/* Cada sello es un trazo sobre una rejilla de 48x48.
   `currentColor` hace que herede el color del contenedor, que
   es el de la rareza. */
const SELLOS = {
  1: (   /* Armas: dos espadas cruzadas */
    <>
      <path d="M12 38 L34 12 M14 40 L10 36 M36 10 l2 2-4 4-2-2z" />
      <path d="M36 38 L14 12 M34 40 l4-4 M12 10 l-2 2 4 4 2-2z" />
    </>
  ),
  2: (   /* Armaduras: un escudo */
    <>
      <path d="M24 8 L39 13 v12 c0 9-7 14-15 17-8-3-15-8-15-17V13z" />
      <path d="M24 14 v22 M15 20 h18" />
    </>
  ),
  3: (   /* Pociones: un frasco */
    <>
      <path d="M20 8 h8 M22 8 v9 l-7 13 c-2 5 1 10 6 10 h6 c5 0 8-5 6-10 l-7-13 V8" />
      <path d="M17 28 h14" />
    </>
  ),
  4: (   /* Accesorios: rombo dentro de un anillo */
    <>
      <circle cx="24" cy="26" r="12" />
      <path d="M24 10 l6 8-6 8-6-8z" />
    </>
  ),
}

function EmblemaCategoria({ categoriaId, titulo }) {
  const sello = SELLOS[Number(categoriaId)] ?? SELLOS[4]

  return (
    <svg
      className="emblema"
      viewBox="0 0 48 48"
      role="img"
      aria-label={titulo}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {sello}
    </svg>
  )
}

export default EmblemaCategoria
