/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   oferta.js — La oferta de un objeto, derivada de su stock
   ---------------------------------------------------------
   DUENO: Javier · Anexo 1, vista Ofertas

   DE DONDE SALE ESTO
   El Anexo pide una vista de Ofertas, pero la tabla PRODUCTO
   del SQL NO tiene columna de descuento, y la regla del
   equipo es clara: el SQL manda en los datos.

   LA SALIDA: la misma que con la rareza. No inventamos una
   columna, la DERIVAMOS de un dato que ya existe.

   `stock` dice cuanto le sobra al mercader, y un mercader
   liquida lo que tiene acumulado:

     stock 25+ .... -25%    Lembas (40), Miruvor (25)
     stock 15-24 .. -15%
     stock 10-14 .. -10%    Capa Elfica (12), Hacha Enana (10)
     stock 0-9 .... sin oferta

   OJO CON EL PRECIO (regla 8 del SQL)
   Al vender, ventaService copia `producto.precio` al detalle.
   Por eso NO rebajamos ese precio: el precio del producto YA
   es el precio vigente. Lo que calculamos es el precio de
   ANTES, hacia arriba, que es lo que va tachado en la ficha.

   Asi la vitrina y la boleta siempre dicen lo mismo, y no hay
   que tocar ni ventaService ni los datos.
   ========================================================= */

/* Los tramos van de mayor a menor: gana el primero que cumple */
const TRAMOS = [
  { desde: 25, porcentaje: 25 },
  { desde: 15, porcentaje: 15 },
  { desde: 10, porcentaje: 10 },
]

/* El descuento del objeto, 0 si no esta en oferta.
   Un objeto INACTIVO no se liquida: no se muestra en tienda. */
export function ofertaDe(producto) {
  if (producto?.estado !== 'ACTIVO') return 0

  const stock = Number(producto?.stock ?? 0)
  return TRAMOS.find((tramo) => stock >= tramo.desde)?.porcentaje ?? 0
}

export function enOferta(producto) {
  return ofertaDe(producto) > 0
}

/* Lo que costaba antes de la rebaja. null si no hay oferta.
   50 oro con -25% venian de 67: 50 / (1 - 0.25). */
export function precioAntes(producto) {
  const porcentaje = ofertaDe(producto)
  if (porcentaje === 0) return null

  return Math.round(Number(producto.precio) / (1 - porcentaje / 100))
}
