import {
  actualizarJugador,
  buscarPorEmail,
  crearJugador,
  eliminarJugador,
  inactivarJugador,
  listarJugadores,
  listarRazas,
  nombreRaza,
  obtenerJugador,
} from './jugadorService.js'
import { CLAVES, guardar, reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de jugadorService.js — Javier, tarea #19
   ---------------------------------------------------------
   Comprueban que el service hace lo mismo que los
   procedimientos SP_INSERTAR_JUGADOR, SP_ACTUALIZAR_JUGADOR y
   SP_ELIMINAR_JUGADOR del SQL, con sus validaciones.

   reiniciarDatos() en el beforeEach deja las tablas como
   recien ejecutado el script de Oracle: 6 jugadores y 5 razas.
   ========================================================= */

const NUEVO = {
  nombre: 'Samsagaz Gamyi',
  email: 'sam@comarca.me',
  razaId: 1,
  password: 'sam12345',
}

describe('jugadorService', () => {
  beforeEach(() => reiniciarDatos())

  describe('razas', () => {
    it('trae las cinco razas del SQL', () => {
      expect(listarRazas().length).toBe(5)
    })

    it('traduce el id al nombre', () => {
      expect(nombreRaza(1)).toBe('Hobbit')
      expect(nombreRaza(5)).toBe('Mago')
    })

    it('no revienta con una raza que no existe', () => {
      expect(nombreRaza(99)).toBe('Sin raza')
    })
  })

  describe('consultas', () => {
    it('trae los seis jugadores del SQL', () => {
      expect(listarJugadores().length).toBe(6)
    })

    it('encuentra a Aragorn por su id', () => {
      expect(obtenerJugador(4).nombre).toBe('Aragorn')
      expect(obtenerJugador('4').nombre).toBe('Aragorn')   // desde la URL llega texto
    })

    it('devuelve null si el id no existe', () => {
      expect(obtenerJugador(999)).toBeNull()
      expect(obtenerJugador('abc')).toBeNull()
    })

    it('encuentra por correo sin distinguir mayusculas', () => {
      expect(buscarPorEmail('ARAGORN@gondor.me').jugadorId).toBe(4)
    })
  })

  /* SP_INSERTAR_JUGADOR */
  describe('crearJugador', () => {
    it('crea al jugador y le da el siguiente id', () => {
      const intento = crearJugador(NUEVO)

      expect(intento.ok).toBe(true)
      expect(intento.jugador.jugadorId).toBe(7)   // habia 6
      expect(listarJugadores().length).toBe(7)
    })

    /* El registro publico NO elige nivel ni estado. */
    it('nace en nivel 1 y ACTIVO', () => {
      const { jugador } = crearJugador(NUEVO)

      expect(jugador.nivel).toBe(1)
      expect(jugador.estado).toBe('ACTIVO')
    })

    /* UNIQUE del SQL -> error -20012 */
    it('no deja repetir el correo', () => {
      const intento = crearJugador({ ...NUEVO, email: 'aragorn@gondor.me' })

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Ese correo ya tiene una cuenta en el reino.')
      expect(listarJugadores().length).toBe(6)   // no se creo nada
    })

    it('tampoco si cambia solo las mayusculas', () => {
      expect(crearJugador({ ...NUEVO, email: 'ARAGORN@GONDOR.ME' }).ok).toBe(false)
    })

    /* FK a RAZA -> error -20011 */
    it('exige que la raza exista', () => {
      const intento = crearJugador({ ...NUEVO, razaId: 99 })

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Raza inexistente.')
    })

    it('guarda la raza como numero aunque llegue como texto', () => {
      expect(crearJugador({ ...NUEVO, razaId: '3' }).jugador.razaId).toBe(3)
    })

    it('puede iniciar sesion despues de crearse', () => {
      crearJugador(NUEVO)
      expect(buscarPorEmail('sam@comarca.me').password).toBe('sam12345')
    })
  })

  /* SP_ACTUALIZAR_JUGADOR */
  describe('actualizarJugador', () => {
    it('cambia el nivel', () => {
      expect(actualizarJugador(1, { nivel: 6 }).jugador.nivel).toBe(6)
      expect(obtenerJugador(1).nivel).toBe(6)
    })

    it('deja el resto de los campos igual', () => {
      actualizarJugador(1, { nivel: 6 })
      expect(obtenerJugador(1).nombre).toBe('Frodo Bolson')
    })

    it('avisa si el jugador no existe', () => {
      const intento = actualizarJugador(999, { nivel: 2 })

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Jugador inexistente.')
    })

    /* CHECK (nivel > 0) de la tabla JUGADOR */
    it('no acepta un nivel cero, negativo ni decimal', () => {
      expect(actualizarJugador(1, { nivel: 0 }).ok).toBe(false)
      expect(actualizarJugador(1, { nivel: -5 }).ok).toBe(false)
      expect(actualizarJugador(1, { nivel: 2.5 }).ok).toBe(false)
    })

    it('no deja poner un correo que ya usa otra cuenta', () => {
      const intento = actualizarJugador(1, { email: 'aragorn@gondor.me' })

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Ese correo ya lo usa otra cuenta.')
    })

    it('si deja su propio correo, no se queja', () => {
      expect(actualizarJugador(1, { email: 'frodo@comarca.me', nivel: 7 }).ok).toBe(true)
    })

    /* Dejar la contrasena vacia significa "no la cambies". */
    it('mantiene la contrasena si llega vacia', () => {
      actualizarJugador(1, { nivel: 7, password: '' })
      expect(obtenerJugador(1).password).toBe('frodo123')
    })

    it('la cambia si llega una nueva', () => {
      actualizarJugador(1, { password: 'nueva123' })
      expect(obtenerJugador(1).password).toBe('nueva123')
    })
  })

  /* SP_ELIMINAR_JUGADOR — REGLA 9 */
  describe('eliminarJugador', () => {
    it('borra a quien no tiene ventas', () => {
      const { jugador } = crearJugador(NUEVO)

      expect(eliminarJugador(jugador.jugadorId).ok).toBe(true)
      expect(listarJugadores().length).toBe(6)
    })

    it('avisa si el jugador no existe', () => {
      expect(eliminarJugador(999).error).toBe('Jugador inexistente.')
    })

    /* REGLA 9: con ventas no se borra, se deja INACTIVO.
       Si no, se perderia el historial de compras. */
    it('NO borra a quien tiene ventas', () => {
      guardar(CLAVES.ventas, [
        { ventaId: 1001, jugadorId: 4, mercaderId: 1, estado: 'CONFIRMADA' },
      ])

      const intento = eliminarJugador(4)

      expect(intento.ok).toBe(false)
      expect(intento.error).toContain('Dejalo INACTIVO')
      expect(obtenerJugador(4)).not.toBeNull()
    })

    it('la alternativa es inactivarlo', () => {
      inactivarJugador(4)
      expect(obtenerJugador(4).estado).toBe('INACTIVO')
    })
  })
})
