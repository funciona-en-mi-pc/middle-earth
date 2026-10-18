/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   authService.js — Quien entra al reino
   ---------------------------------------------------------
   El SQL tiene DOS tablas de personas y ninguna password:

     JUGADOR .... quien compra (equivale a CLIENTE)
     MERCADER ... quien atiende (equivale a EMPLEADO)

   El login es uno solo: se busca el correo primero entre los
   jugadores y despues entre los mercaderes. El resto de la
   aplicacion no necesita saber de que tabla salio: recibe
   siempre un usuario con el mismo campo `tipo`.

   REGLA 1 DEL SQL
   Solo participan jugadores y mercaderes ACTIVOS. Es lo que
   en PKG_VENTAS.REGISTRAR_VENTA lanza los errores -20005 y
   -20006. Aqui se comprueba al entrar, y los mensajes son los
   mismos para poder defenderlos en la presentacion.

   QUE SE GUARDA EN LA SESION
   Solo { tipo, id }, no el usuario entero. Asi, si la cuenta
   se edita en el panel, usuarioActivo() devuelve siempre los
   datos frescos en vez de una copia vieja.
   ========================================================= */

import { CLAVES, guardar, leer } from './storage.js'


/* Los correos no distinguen mayusculas: Aragorn@... y
   aragorn@... son la misma cuenta. */
function normalizar(email) {
  return String(email ?? '').trim().toLowerCase()
}

/* Busca el correo en las dos tablas y dice en cual aparecio. */
function buscarCuenta(email) {
  const buscado = normalizar(email)
  if (buscado === '') return null

  const jugador = leer(CLAVES.jugadores, []).find((j) => normalizar(j.email) === buscado)
  if (jugador) return { fila: jugador, tipo: 'JUGADOR' }

  const mercader = leer(CLAVES.mercaderes, []).find((m) => normalizar(m.email) === buscado)
  if (mercader) return { fila: mercader, tipo: 'MERCADER' }

  return null
}

/* Traduce una fila de JUGADOR o de MERCADER al usuario unico
   que usa toda la aplicacion. `nivel` solo viene si es
   jugador; `cargo` solo si es mercader. */
function aUsuario(fila, tipo) {
  if (tipo === 'JUGADOR') {
    return {
      id: fila.jugadorId,
      nombre: fila.nombre,
      email: fila.email,
      tipo: 'JUGADOR',
      nivel: fila.nivel,
      razaId: fila.razaId,
    }
  }

  return {
    id: fila.mercaderId,
    nombre: fila.nombre,
    email: fila.email,
    tipo: 'MERCADER',
    cargo: fila.cargo,
  }
}


/* =========================================================
   INICIAR Y CERRAR SESION
   ========================================================= */

export function iniciarSesion(email, password) {
  const cuenta = buscarCuenta(email)

  /* El mismo mensaje sirva o no el correo. Si dijeramos "ese
     correo no existe" estariamos revelando que cuentas hay. */
  if (!cuenta || cuenta.fila.password !== password) {
    return { ok: false, error: 'Correo o contrasena incorrectos.' }
  }

  /* La cuenta existe y la clave es correcta, pero esta dada de
     baja. Aqui si conviene decir el motivo exacto: son los
     errores -20005 y -20006 del SQL. */
  if (cuenta.fila.estado !== 'ACTIVO') {
    return {
      ok: false,
      error: cuenta.tipo === 'JUGADOR'
        ? 'Jugador inexistente o inactivo.'
        : 'Mercader inexistente o inactivo.',
    }
  }

  const usuario = aUsuario(cuenta.fila, cuenta.tipo)
  guardar(CLAVES.sesion, { tipo: usuario.tipo, id: usuario.id })

  return { ok: true, usuario }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVES.sesion)
  } catch (error) {
    console.warn('No se pudo cerrar la sesion', error)
  }
}


/* =========================================================
   QUIEN ESTA DENTRO
   ========================================================= */

/* Devuelve el usuario con la sesion abierta, o null.
   Vuelve a leer la fila cada vez, para que un cambio hecho en
   el panel (subir de nivel, inactivar una cuenta) se note de
   inmediato. */
export function usuarioActivo() {
  const sesion = leer(CLAVES.sesion, null)
  if (!sesion) return null

  const clave = sesion.tipo === 'JUGADOR' ? CLAVES.jugadores : CLAVES.mercaderes
  const campoId = sesion.tipo === 'JUGADOR' ? 'jugadorId' : 'mercaderId'

  const fila = leer(clave, []).find((f) => f[campoId] === sesion.id)

  /* La cuenta se borro o la inactivaron mientras estaba
     dentro: se cierra la sesion sola. */
  if (!fila || fila.estado !== 'ACTIVO') {
    cerrarSesion()
    return null
  }

  return aUsuario(fila, sesion.tipo)
}

export function esMercader() {
  const usuario = usuarioActivo()
  return usuario !== null && usuario.tipo === 'MERCADER'
}

/* Solo el ADMINISTRADOR puede crear, editar y borrar en el
   panel. VENDEDOR y HERRERO entran, pero no mandan. */
export function esAdministrador() {
  const usuario = usuarioActivo()
  return usuario !== null && usuario.tipo === 'MERCADER' && usuario.cargo === 'ADMINISTRADOR'
}
