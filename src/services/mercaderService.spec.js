import {
  CARGOS,
  actualizarMercader,
  buscarPorEmail,
  crearMercader,
  eliminarMercader,
  inactivarMercader,
  listarMercaderes,
  obtenerMercader,
} from './mercaderService.js'
import { CLAVES, guardar, reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de mercaderService.js — Javier, tarea #29
   ---------------------------------------------------------
   La tabla MERCADER. Los cuatro del SQL:
     1 Cebadilla .. VENDEDOR      ACTIVO
     2 Elrond ..... ADMINISTRADOR ACTIVO
     3 Grimbold ... HERRERO       ACTIVO
     4 Grima ...... VENDEDOR      INACTIVO
   ========================================================= */

const NUEVO = {
  nombre: 'Barliman',
  email: 'barliman@bree.me',
  cargo: 'VENDEDOR',
  password: 'barli123',
}

describe('mercaderService', () => {
  beforeEach(() => reiniciarDatos())

  describe('consultas', () => {
    it('trae los cuatro mercaderes del SQL', () => {
      expect(listarMercaderes().length).toBe(4)
    })

    it('encuentra por id', () => {
      expect(obtenerMercader(2).nombre).toBe('Elrond')
      expect(obtenerMercader('2').cargo).toBe('ADMINISTRADOR')
    })

    it('devuelve null si no existe', () => {
      expect(obtenerMercader(999)).toBeNull()
    })

    it('encuentra por correo sin distinguir mayusculas', () => {
      expect(buscarPorEmail('ELROND@Rivendel.me').mercaderId).toBe(2)
    })

    it('los tres cargos son los del SQL', () => {
      expect(CARGOS).toEqual(['ADMINISTRADOR', 'VENDEDOR', 'HERRERO'])
    })
  })

  describe('crearMercader', () => {
    it('crea con el siguiente id, ACTIVO', () => {
      const intento = crearMercader(NUEVO)

      expect(intento.ok).toBe(true)
      expect(intento.mercader.mercaderId).toBe(5)
      expect(intento.mercader.estado).toBe('ACTIVO')
      expect(listarMercaderes().length).toBe(5)
    })

    it('no deja repetir el correo', () => {
      const intento = crearMercader({ ...NUEVO, email: 'elrond@rivendel.me' })

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Ese correo ya tiene una cuenta en el reino.')
      expect(listarMercaderes().length).toBe(4)
    })

    it('exige un cargo valido', () => {
      expect(crearMercader({ ...NUEVO, cargo: 'REY' }).error).toBe('Cargo inexistente.')
    })

    it('el nuevo mercader puede iniciar sesion', () => {
      crearMercader(NUEVO)
      expect(buscarPorEmail('barliman@bree.me').password).toBe('barli123')
    })
  })

  describe('actualizarMercader', () => {
    it('cambia el cargo', () => {
      expect(actualizarMercader(1, { cargo: 'HERRERO' }).mercader.cargo).toBe('HERRERO')
    })

    it('avisa si no existe', () => {
      expect(actualizarMercader(999, { cargo: 'HERRERO' }).error).toBe('Mercader inexistente.')
    })

    it('no deja un correo que ya usa otra cuenta', () => {
      const intento = actualizarMercader(1, { email: 'elrond@rivendel.me' })
      expect(intento.error).toBe('Ese correo ya lo usa otra cuenta.')
    })

    it('si deja su propio correo, no se queja', () => {
      expect(actualizarMercader(1, { email: 'cebadilla@pony.me', cargo: 'HERRERO' }).ok).toBe(true)
    })

    /* Contrasena vacia = se mantiene la que ya tenia */
    it('mantiene la contrasena si llega vacia', () => {
      actualizarMercader(2, { password: '' })
      expect(obtenerMercader(2).password).toBe('elrond123')
    })

    it('la cambia si llega una nueva', () => {
      actualizarMercader(2, { password: 'nueva123' })
      expect(obtenerMercader(2).password).toBe('nueva123')
    })
  })

  /* Esta proteccion NO esta en el SQL: alla siempre queda el
     usuario de Oracle. Aqui, si se va el ultimo administrador,
     nadie podria volver a administrar nada. */
  describe('el ultimo administrador', () => {
    it('no se puede inactivar al unico administrador', () => {
      const intento = inactivarMercader(2)   // Elrond es el unico

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('No puedes dejar el reino sin ningun ADMINISTRADOR activo.')
      expect(obtenerMercader(2).estado).toBe('ACTIVO')
    })

    it('tampoco se le puede quitar el cargo', () => {
      expect(actualizarMercader(2, { cargo: 'VENDEDOR' }).ok).toBe(false)
    })

    it('ni borrarlo', () => {
      expect(eliminarMercader(2).ok).toBe(false)
      expect(listarMercaderes().length).toBe(4)
    })

    it('pero si hay otro administrador, si se puede', () => {
      crearMercader({ ...NUEVO, cargo: 'ADMINISTRADOR' })

      expect(inactivarMercader(2).ok).toBe(true)
      expect(obtenerMercader(2).estado).toBe('INACTIVO')
    })

    it('un administrador INACTIVO no cuenta como respaldo', () => {
      crearMercader({ ...NUEVO, cargo: 'ADMINISTRADOR' })
      inactivarMercader(5)

      expect(inactivarMercader(2).ok).toBe(false)
    })

    it('a un VENDEDOR si se le puede cambiar todo', () => {
      expect(inactivarMercader(1).ok).toBe(true)
    })
  })

  /* REGLA 9 */
  describe('eliminarMercader', () => {
    it('borra a quien no atendio ventas', () => {
      crearMercader(NUEVO)
      expect(eliminarMercader(5).ok).toBe(true)
      expect(listarMercaderes().length).toBe(4)
    })

    it('avisa si no existe', () => {
      expect(eliminarMercader(999).error).toBe('Mercader inexistente.')
    })

    it('NO borra a quien atendio ventas', () => {
      guardar(CLAVES.ventas, [
        { ventaId: 1001, jugadorId: 4, mercaderId: 1, estado: 'CONFIRMADA' },
      ])

      const intento = eliminarMercader(1)   // Cebadilla atendio la 1001

      expect(intento.ok).toBe(false)
      expect(intento.error).toContain('Dejalo INACTIVO')
      expect(obtenerMercader(1)).not.toBeNull()
    })
  })
})
