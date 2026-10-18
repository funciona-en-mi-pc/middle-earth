/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   mercaderService.js — El personal de la tienda
   ---------------------------------------------------------
   DUENO: Javier · tarea #44

   Refleja la tabla MERCADER del SQL: quien atiende la tienda.
   Equivale a EMPLEADO en el proyecto del profe.

   DOS COLUMNAS QUE EL SQL NO TIENE
   MERCADER no tiene `email` ni `password`, pero el login las
   necesita. Se agregaron en el frontend y queda anotado como
   cambio pendiente de la base de datos para la etapa 3.

   LOS TRES CARGOS, Y QUE PUEDE CADA UNO
     ADMINISTRADOR ... crea, edita y borra en todo el panel
     HERRERO ......... repone stock, que es su oficio
     VENDEDOR ........ atiende ventas, pero solo mira el panel

   LA PROTECCION QUE NO ESTA EN EL SQL
   Nunca se puede dejar el reino sin ningun ADMINISTRADOR
   activo. Si no, nadie podria volver a administrar nada y
   habria que borrar el localStorage para recuperarlo. El SQL
   no lo contempla porque alla siempre queda el usuario de
   Oracle; aqui hay que cuidarlo a mano.
   ========================================================= */

import { CLAVES, guardar, leer, siguienteId } from './storage.js'

export const CARGOS = ['ADMINISTRADOR', 'VENDEDOR', 'HERRERO']


/* =========================================================
   CONSULTAS
   ========================================================= */

export function listarMercaderes() {
  return leer(CLAVES.mercaderes, [])
}

export function obtenerMercader(id) {
  const buscado = Number(id)
  if (Number.isNaN(buscado)) return null

  return listarMercaderes().find((m) => m.mercaderId === buscado) ?? null
}

export function buscarPorEmail(email) {
  const buscado = String(email ?? '').trim().toLowerCase()
  if (buscado === '') return null

  return listarMercaderes().find((m) => String(m.email ?? '').toLowerCase() === buscado) ?? null
}

/* Las ventas que atendio. Lo usa la comprobacion de antes de
   borrar (regla 9). */
export function ventasDeMercader(mercaderId) {
  return leer(CLAVES.ventas, []).filter((v) => v.mercaderId === Number(mercaderId))
}

/* Cuantos administradores activos quedan, sin contar al que
   se esta a punto de cambiar o borrar. */
function administradoresActivos(exceptoId) {
  return listarMercaderes().filter((m) =>
    m.mercaderId !== Number(exceptoId) &&
    m.cargo === 'ADMINISTRADOR' &&
    m.estado === 'ACTIVO',
  ).length
}


/* =========================================================
   ALTA
   El correo es unico, igual que en JUGADOR.
   ========================================================= */

export function crearMercader({ nombre, email, cargo, password }) {
  const correo = String(email ?? '').trim()

  if (!CARGOS.includes(cargo)) {
    return { ok: false, error: 'Cargo inexistente.' }
  }

  if (buscarPorEmail(correo)) {
    return { ok: false, error: 'Ese correo ya tiene una cuenta en el reino.' }
  }

  const mercaderes = listarMercaderes()

  const mercader = {
    mercaderId: siguienteId(mercaderes, 'mercaderId'),
    nombre: String(nombre ?? '').trim(),
    cargo,
    email: correo,
    password,
    estado: 'ACTIVO',
  }

  mercaderes.push(mercader)
  guardar(CLAVES.mercaderes, mercaderes)

  return { ok: true, mercader }
}


/* =========================================================
   EDICION
   Dejar la contrasena vacia significa "no la cambies".
   ========================================================= */

export function actualizarMercader(id, cambios = {}) {
  const mercaderes = listarMercaderes()
  const indice = mercaderes.findIndex((m) => m.mercaderId === Number(id))
  if (indice === -1) return { ok: false, error: 'Mercader inexistente.' }

  const antes = mercaderes[indice]

  if (cambios.cargo !== undefined && !CARGOS.includes(cambios.cargo)) {
    return { ok: false, error: 'Cargo inexistente.' }
  }

  if (cambios.email) {
    const otro = buscarPorEmail(cambios.email)
    if (otro && otro.mercaderId !== Number(id)) {
      return { ok: false, error: 'Ese correo ya lo usa otra cuenta.' }
    }
  }

  const despues = { ...antes, ...cambios }

  /* Contrasena vacia = se mantiene la que ya tenia */
  if (cambios.password === '' || cambios.password === undefined) {
    despues.password = antes.password
  }

  /* El reino no puede quedarse sin administradores activos */
  const dejaDeMandar =
    (despues.cargo !== 'ADMINISTRADOR' || despues.estado !== 'ACTIVO') &&
    antes.cargo === 'ADMINISTRADOR' && antes.estado === 'ACTIVO'

  if (dejaDeMandar && administradoresActivos(id) === 0) {
    return {
      ok: false,
      error: 'No puedes dejar el reino sin ningun ADMINISTRADOR activo.',
    }
  }

  mercaderes[indice] = despues
  guardar(CLAVES.mercaderes, mercaderes)

  return { ok: true, mercader: despues }
}


/* =========================================================
   BAJA
   REGLA 9: un mercader que atendio ventas NO se borra, porque
   se perderia el historial. Se deja INACTIVO.
   ========================================================= */

export function eliminarMercader(id) {
  const mercaderes = listarMercaderes()
  const mercader = mercaderes.find((m) => m.mercaderId === Number(id))
  if (!mercader) return { ok: false, error: 'Mercader inexistente.' }

  const ventas = ventasDeMercader(id)
  if (ventas.length > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: el mercader atendio ${ventas.length} venta(s). Dejalo INACTIVO.`,
    }
  }

  if (mercader.cargo === 'ADMINISTRADOR' &&
      mercader.estado === 'ACTIVO' &&
      administradoresActivos(id) === 0) {
    return {
      ok: false,
      error: 'No puedes dejar el reino sin ningun ADMINISTRADOR activo.',
    }
  }

  guardar(CLAVES.mercaderes, mercaderes.filter((m) => m.mercaderId !== Number(id)))

  return { ok: true }
}

export function inactivarMercader(id) {
  return actualizarMercader(id, { estado: 'INACTIVO' })
}
