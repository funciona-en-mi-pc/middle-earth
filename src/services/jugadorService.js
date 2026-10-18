/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   jugadorService.js — Los jugadores y sus razas
   ---------------------------------------------------------
   DUENO: Javier · tarea #17

   Refleja las tablas JUGADOR y RAZA del SQL, y hace lo mismo
   que los procedimientos SP_INSERTAR_JUGADOR,
   SP_ACTUALIZAR_JUGADOR y SP_ELIMINAR_JUGADOR, incluidas sus
   validaciones y sus codigos de error.

   EL MISMO CONTRATO EN TODAS LAS QUE PUEDEN FALLAR
     { ok: true,  jugador }
     { ok: false, error: 'mensaje listo para mostrar' }
   El service decide SI se puede; la pagina decide COMO se ve.
   Por eso aqui no hay ni un alert ni un console.log.

   LOS ID
   El SQL usa SEQ_JUGADOR.NEXTVAL. Aqui el equivalente es
   siguienteId(): el mayor que ya existe, mas uno.
   ========================================================= */

import { CLAVES, guardar, leer, siguienteId } from './storage.js'


/* =========================================================
   RAZAS
   Se hizo tabla, y no un texto libre, porque las opciones son
   fijas: asi nadie inventa una raza y se pueden agregar sin
   tocar el codigo.
   ========================================================= */

export function listarRazas() {
  return leer(CLAVES.razas, [])
}

export function nombreRaza(razaId) {
  const raza = listarRazas().find((r) => r.razaId === Number(razaId))
  return raza ? raza.nombre : 'Sin raza'
}


/* =========================================================
   CONSULTAS
   ========================================================= */

export function listarJugadores() {
  return leer(CLAVES.jugadores, [])
}

export function obtenerJugador(id) {
  const buscado = Number(id)
  if (Number.isNaN(buscado)) return null

  return listarJugadores().find((j) => j.jugadorId === buscado) ?? null
}

/* El correo es UNIQUE en el SQL y no distingue mayusculas. */
export function buscarPorEmail(email) {
  const buscado = String(email ?? '').trim().toLowerCase()
  if (buscado === '') return null

  return listarJugadores().find((j) => j.email.toLowerCase() === buscado) ?? null
}

/* Cuantas ventas tiene. Lo usan la pagina de perfil y la
   comprobacion de antes de borrar (regla 9). */
export function ventasDeJugador(jugadorId) {
  return leer(CLAVES.ventas, []).filter((v) => v.jugadorId === Number(jugadorId))
}


/* =========================================================
   ALTA — como SP_INSERTAR_JUGADOR
   Comprueba que la raza exista (-20011) y que el correo no
   este repetido (-20012).

   El registro publico crea SIEMPRE un jugador de nivel 1 y
   ACTIVO. El nivel y el estado solo se cambian desde el panel.
   ========================================================= */

export function crearJugador({ nombre, email, razaId, password }) {
  const correo = String(email ?? '').trim()

  if (!listarRazas().some((r) => r.razaId === Number(razaId))) {
    return { ok: false, error: 'Raza inexistente.' }
  }

  if (buscarPorEmail(correo)) {
    return { ok: false, error: 'Ese correo ya tiene una cuenta en el reino.' }
  }

  const jugadores = listarJugadores()

  const jugador = {
    jugadorId: siguienteId(jugadores, 'jugadorId'),
    razaId: Number(razaId),
    nombre: String(nombre ?? '').trim(),
    nivel: 1,
    email: correo,
    password,
    estado: 'ACTIVO',
  }

  jugadores.push(jugador)
  guardar(CLAVES.jugadores, jugadores)

  return { ok: true, jugador }
}


/* =========================================================
   EDICION — como SP_ACTUALIZAR_JUGADOR
   `cambios` trae solo los campos que se tocan; el resto queda
   igual. Dejar la contrasena vacia significa "no la cambies".
   ========================================================= */

export function actualizarJugador(id, cambios = {}) {
  const jugadores = listarJugadores()
  const indice = jugadores.findIndex((j) => j.jugadorId === Number(id))

  /* En el SQL esto es SQL%ROWCOUNT = 0 tras el UPDATE: la fila
     no existe (-20005). */
  if (indice === -1) return { ok: false, error: 'Jugador inexistente.' }

  /* Si cambia el correo, no puede chocar con otra cuenta. */
  if (cambios.email) {
    const otro = buscarPorEmail(cambios.email)
    if (otro && otro.jugadorId !== Number(id)) {
      return { ok: false, error: 'Ese correo ya lo usa otra cuenta.' }
    }
  }

  const actualizado = { ...jugadores[indice], ...cambios }

  /* Los campos numericos pueden llegar como texto desde un
     formulario, y el CHECK del SQL exige nivel > 0. */
  if (cambios.nivel !== undefined) {
    const nivel = Number(cambios.nivel)
    if (!Number.isInteger(nivel) || nivel <= 0) {
      return { ok: false, error: 'El nivel debe ser un entero mayor que cero.' }
    }
    actualizado.nivel = nivel
  }

  if (cambios.razaId !== undefined) actualizado.razaId = Number(cambios.razaId)

  /* Contrasena vacia = se mantiene la que ya tenia. */
  if (cambios.password === '' || cambios.password === undefined) {
    actualizado.password = jugadores[indice].password
  }

  jugadores[indice] = actualizado
  guardar(CLAVES.jugadores, jugadores)

  return { ok: true, jugador: actualizado }
}


/* =========================================================
   BAJA — como SP_ELIMINAR_JUGADOR
   REGLA 9: un jugador con ventas NO se borra, porque se
   perderia el historial. Se deja INACTIVO, que lo saca de las
   ventas nuevas sin borrar su pasado.

   En el SQL la FK tambien lo impediria, pero con un error de
   Oracle poco claro (ORA-02292). Validando antes, el usuario
   recibe un mensaje que le dice que hacer.
   ========================================================= */

export function eliminarJugador(id) {
  const jugadores = listarJugadores()
  const jugador = jugadores.find((j) => j.jugadorId === Number(id))

  if (!jugador) return { ok: false, error: 'Jugador inexistente.' }

  const ventas = ventasDeJugador(id)
  if (ventas.length > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: el jugador tiene ${ventas.length} venta(s). Dejalo INACTIVO.`,
    }
  }

  guardar(CLAVES.jugadores, jugadores.filter((j) => j.jugadorId !== Number(id)))

  return { ok: true }
}

/* La alternativa a borrar: darlo de baja. Despues de esto no
   puede iniciar sesion (regla 1). */
export function inactivarJugador(id) {
  return actualizarJugador(id, { estado: 'INACTIVO' })
}
