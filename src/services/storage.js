/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   storage.js — La "base de datos" del frontend
   ---------------------------------------------------------
   En la etapa 2 no hay servidor, asi que las nueve tablas del
   SQL viven en localStorage: un almacen de texto que el
   navegador guarda por sitio y que sobrevive al cerrar la
   pestana.

   Como localStorage solo guarda texto, cada lectura hace
   JSON.parse y cada escritura JSON.stringify. Eso lo
   encapsulan leer() y guardar(), y el resto del proyecto ya
   trabaja con objetos y arreglos normales.

   REGLA IMPORTANTE
   Ningun componente ni pagina usa localStorage directamente.
   Todos pasan por un service. Asi, en la etapa 3 solo hay que
   cambiar los services para que hablen con Spring Boot.
   ========================================================= */

import {
  AUDITORIA,
  CATEGORIAS,
  DETALLES_VENTA,
  JUGADORES,
  MERCADERES,
  MOVIMIENTOS_STOCK,
  PRIMERA_VENTA,
  PRODUCTOS,
  RAZAS,
  VENTAS,
} from '../data/datosIniciales.js'


/* Nombres de los cajones. Uno por tabla del SQL, mas la
   sesion. Van juntos en un objeto para no repetir cadenas
   sueltas: si manana cambia un nombre, se cambia aqui. */
export const CLAVES = {
  razas: 'me_razas',
  categorias: 'me_categorias',
  jugadores: 'me_jugadores',
  mercaderes: 'me_mercaderes',
  productos: 'me_productos',
  ventas: 'me_ventas',
  detalles: 'me_detalles_venta',
  movimientos: 'me_movimientos_stock',
  auditoria: 'me_auditoria_producto',
  sesion: 'me_sesion',
}


/* =========================================================
   LECTURA Y ESCRITURA EN BRUTO
   Los try/catch existen porque localStorage lanza excepcion
   en dos casos reales: cuando el navegador esta en modo
   privado con el almacenamiento bloqueado, y cuando se llena
   la cuota. Si eso pasa, preferimos que la pagina siga
   funcionando en vez de romperse.
   ========================================================= */

export function leer(clave, porDefecto = null) {
  try {
    const texto = localStorage.getItem(clave)
    return texto ? JSON.parse(texto) : porDefecto
  } catch (error) {
    console.warn('No se pudo leer', clave, error)
    return porDefecto
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch (error) {
    console.warn('No se pudo guardar', clave, error)
    return false
  }
}


/* =========================================================
   IDS: LO QUE EN ORACLE HACEN LAS SECUENCIAS
   El SQL usa SEQ_JUGADOR.NEXTVAL, SEQ_PRODUCTO.NEXTVAL, etc.
   Aqui el equivalente es "el mayor que ya existe, mas uno".

   `desde` sirve para SEQ_VENTA, que arranca en 1001: si la
   lista esta vacia, el primer numero es ese y no el 1.
   ========================================================= */

export function siguienteId(lista, campo, desde = 1) {
  if (!lista.length) return desde
  const mayor = Math.max(...lista.map((fila) => Number(fila[campo]) || 0))
  return Math.max(mayor + 1, desde)
}

export function siguienteIdVenta(ventas) {
  return siguienteId(ventas, 'ventaId', PRIMERA_VENTA)
}


/* =========================================================
   SIEMBRA
   Se llama una sola vez, al arrancar la aplicacion. Solo
   escribe los cajones que todavia no existen, asi recargar la
   pagina no borra lo que el usuario alcanzo a hacer.

   Para volver al estado inicial esta reiniciarDatos().
   ========================================================= */

const SEMILLA = [
  [CLAVES.razas, RAZAS],
  [CLAVES.categorias, CATEGORIAS],
  [CLAVES.jugadores, JUGADORES],
  [CLAVES.mercaderes, MERCADERES],
  [CLAVES.productos, PRODUCTOS],
  [CLAVES.ventas, VENTAS],
  [CLAVES.detalles, DETALLES_VENTA],
  [CLAVES.movimientos, MOVIMIENTOS_STOCK],
  [CLAVES.auditoria, AUDITORIA],
]

export function sembrarDatos() {
  SEMILLA.forEach(([clave, valor]) => {
    if (leer(clave) === null) guardar(clave, valor)
  })
}

/* Borra todo y vuelve a sembrar. Util para probar y para la
   demo de la presentacion: deja la tienda como recien
   ejecutado el script de Oracle. */
export function reiniciarDatos() {
  Object.values(CLAVES).forEach((clave) => {
    try {
      localStorage.removeItem(clave)
    } catch (error) {
      console.warn('No se pudo borrar', clave, error)
    }
  })
  sembrarDatos()
}
