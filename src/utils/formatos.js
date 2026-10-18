/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   formatos.js — Como se muestran los numeros y las fechas
   ---------------------------------------------------------
   DUENO: Jose · tarea #14

   Funciones PURAS: reciben un valor y devuelven texto. No
   tocan la pantalla ni guardan nada, asi que se prueban sin
   navegador:

     expect(formatearOro(1500)).toBe('1.500 oro')

   Van aqui y no dentro de un componente para que las usen
   todas las paginas: catalogo, detalle, carrito, pedidos y
   el panel. Si manana el reino cambia de moneda, se cambia
   en un solo sitio.
   ========================================================= */

/* es-CL pone el punto como separador de miles: 1500 -> 1.500 */
const MILES = new Intl.NumberFormat('es-CL')

export function formatearNumero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? MILES.format(numero) : '0'
}

/* El precio de PRODUCTO esta en monedas de oro. */
export function formatearOro(precio) {
  return `${formatearNumero(precio)} oro`
}

/* Las fechas se guardan en texto ISO y se muestran como
   dd/mm/aaaa. Si llega algo que no es fecha, devuelve '' en
   vez de "Invalid Date". */
export function formatearFecha(iso) {
  if (!iso) return ''

  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''

  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')

  return `${dia}/${mes}/${fecha.getFullYear()}`
}

/* Igual, pero con la hora. Lo usan el historial de
   movimientos y la auditoria, donde dos cambios del mismo dia
   hay que poder distinguirlos. */
export function formatearFechaHora(iso) {
  const fecha = formatearFecha(iso)
  if (fecha === '') return ''

  const hora = new Date(iso)
  return `${fecha} ${String(hora.getHours()).padStart(2, '0')}:${String(hora.getMinutes()).padStart(2, '0')}`
}
