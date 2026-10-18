import {
  cerrarSesion,
  esAdministrador,
  esMercader,
  iniciarSesion,
  usuarioActivo,
} from './authService.js'
import { reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de authService.js — Javier, tarea #19
   ---------------------------------------------------------
   Aqui si hay estado: la sesion y las cuentas viven en
   localStorage, y Karma corre todo en un Chrome de verdad, asi
   que el localStorage es el real.

   Por eso el beforeEach llama a reiniciarDatos(): borra y
   vuelve a sembrar las tablas del SQL. Cada prueba empieza
   desde el mismo sitio y el orden no importa.

   El afterEach cierra la sesion para no dejarla abierta a la
   siguiente.
   ========================================================= */

describe('authService', () => {
  beforeEach(() => reiniciarDatos())
  afterEach(() => cerrarSesion())

  describe('iniciarSesion con un jugador', () => {
    it('deja entrar a Aragorn con sus datos del SQL', () => {
      const intento = iniciarSesion('aragorn@gondor.me', 'aragorn123')

      expect(intento.ok).toBe(true)
      expect(intento.usuario.id).toBe(4)
      expect(intento.usuario.nombre).toBe('Aragorn')
      expect(intento.usuario.tipo).toBe('JUGADOR')
      expect(intento.usuario.nivel).toBe(25)
    })

    it('el correo no distingue mayusculas', () => {
      expect(iniciarSesion('ARAGORN@Gondor.ME', 'aragorn123').ok).toBe(true)
    })

    it('ignora los espacios de los lados', () => {
      expect(iniciarSesion('  aragorn@gondor.me  ', 'aragorn123').ok).toBe(true)
    })
  })

  describe('iniciarSesion con un mercader', () => {
    it('deja entrar a Elrond con su cargo', () => {
      const intento = iniciarSesion('elrond@rivendel.me', 'elrond123')

      expect(intento.ok).toBe(true)
      expect(intento.usuario.tipo).toBe('MERCADER')
      expect(intento.usuario.cargo).toBe('ADMINISTRADOR')
    })
  })

  describe('cuando no debe dejar entrar', () => {
    /* El mismo mensaje sirva o no el correo: si dijeramos "ese
       correo no existe" estariamos revelando que cuentas hay. */
    it('da el mismo mensaje con la clave mala y con un correo que no existe', () => {
      const claveMala = iniciarSesion('aragorn@gondor.me', 'mala')
      const noExiste = iniciarSesion('sauron@mordor.me', 'loquesea')

      expect(claveMala.ok).toBe(false)
      expect(claveMala.error).toBe('Correo o contrasena incorrectos.')
      expect(noExiste.error).toBe(claveMala.error)
    })

    /* REGLA 1 del SQL: solo participan ACTIVOS.
       Es el error -20005 de PKG_VENTAS.REGISTRAR_VENTA. */
    it('rechaza a Boromir por estar INACTIVO', () => {
      const intento = iniciarSesion('boromir@gondor.me', 'boromir123')

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Jugador inexistente o inactivo.')
    })

    /* El equivalente para mercaderes: error -20006 */
    it('rechaza a Grima por estar INACTIVO', () => {
      const intento = iniciarSesion('grima@isengard.me', 'grima123')

      expect(intento.ok).toBe(false)
      expect(intento.error).toBe('Mercader inexistente o inactivo.')
    })

    it('no deja la sesion abierta despues de un intento fallido', () => {
      iniciarSesion('aragorn@gondor.me', 'mala')
      expect(usuarioActivo()).toBeNull()
    })
  })

  describe('usuarioActivo', () => {
    it('es null cuando no ha entrado nadie', () => {
      expect(usuarioActivo()).toBeNull()
    })

    it('devuelve al que entro', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      expect(usuarioActivo().nombre).toBe('Aragorn')
    })

    it('se vacia al cerrar la sesion', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      cerrarSesion()
      expect(usuarioActivo()).toBeNull()
    })

    /* En la sesion se guarda solo { tipo, id }, no el usuario
       entero. Por eso lee los datos frescos: si el panel sube
       de nivel al jugador, se nota de inmediato. */
    it('lee los datos frescos de la cuenta, no una copia vieja', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')

      const jugadores = JSON.parse(localStorage.getItem('me_jugadores'))
      jugadores.find((j) => j.jugadorId === 4).nivel = 99
      localStorage.setItem('me_jugadores', JSON.stringify(jugadores))

      expect(usuarioActivo().nivel).toBe(99)
    })

    /* Si inactivan la cuenta mientras esta dentro, la sesion
       se cierra sola: la regla 1 se sigue cumpliendo. */
    it('cierra la sesion si la cuenta queda INACTIVA', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')

      const jugadores = JSON.parse(localStorage.getItem('me_jugadores'))
      jugadores.find((j) => j.jugadorId === 4).estado = 'INACTIVO'
      localStorage.setItem('me_jugadores', JSON.stringify(jugadores))

      expect(usuarioActivo()).toBeNull()
    })
  })

  describe('permisos', () => {
    it('un jugador no es mercader ni administrador', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      expect(esMercader()).toBe(false)
      expect(esAdministrador()).toBe(false)
    })

    it('Elrond es mercader y administrador', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      expect(esMercader()).toBe(true)
      expect(esAdministrador()).toBe(true)
    })

    /* VENDEDOR y HERRERO entran al panel, pero no mandan. */
    it('Cebadilla es mercader pero NO administrador', () => {
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      expect(esMercader()).toBe(true)
      expect(esAdministrador()).toBe(false)
    })

    it('sin sesion no hay permisos', () => {
      expect(esMercader()).toBe(false)
      expect(esAdministrador()).toBe(false)
    })
  })
})
