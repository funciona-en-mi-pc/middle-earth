/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   rareza.js — La rareza de un objeto, derivada de su nivel
   ---------------------------------------------------------
   DUENO: Javier · mejora visual del Hito 4

   DE DONDE SALE ESTO
   El mockup de la etapa 1 pintaba el filo de cada ficha con
   el color de su rareza, y se veia muy bien. Pero la tabla
   PRODUCTO del SQL NO tiene columna de rareza, y la regla del
   equipo es clara: el SQL manda en los datos.

   LA SALIDA: no inventamos una columna, la DERIVAMOS.
   `nivel_requerido` ya ordena los objetos de mas humilde a
   mas legendario, asi que sirve igual de bien:

     nivel 1-5 .... Comun        Lembas, Miruvor, Espada Dardo
     nivel 6-14 ... Raro         Capa Elfica
     nivel 15-24 .. Epico        Hacha, Cota, Arco
     nivel 25+ .... Legendario   Baston de Mago

   Es una funcion pura sobre un dato que ya existe. Si manana
   el backend agrega una columna rareza de verdad, se cambia
   solo este archivo.

   PARA QUE SIRVE, APARTE DE VERSE BIEN
   Da informacion de un vistazo: el color del filo dice si un
   objeto esta a tu alcance o es cosa de heroes, sin leer.
   ========================================================= */

/* Los tramos van de mayor a menor: gana el primero que cumple */
const TRAMOS = [
  { desde: 25, nombre: 'Legendario', clase: 'legendario' },
  { desde: 15, nombre: 'Epico', clase: 'epico' },
  { desde: 6, nombre: 'Raro', clase: 'raro' },
  { desde: 0, nombre: 'Comun', clase: 'comun' },
]

export function rarezaDe(producto) {
  const nivel = Number(producto?.nivelRequerido ?? 0)
  return TRAMOS.find((t) => nivel >= t.desde) ?? TRAMOS[TRAMOS.length - 1]
}

export function nombreRareza(producto) {
  return rarezaDe(producto).nombre
}

/* La clase CSS que pinta el filo de la ficha.
   Los colores estan en styles.css, seccion 7. */
export function claseRareza(producto) {
  return `rareza-${rarezaDe(producto).clase}`
}
