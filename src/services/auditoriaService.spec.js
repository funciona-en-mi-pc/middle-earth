import { auditarCambios, listarAuditoria, registrarCambio } from './auditoriaService.js'
import { cerrarSesion, iniciarSesion } from './authService.js'
import { actualizarProducto, obtenerProducto } from './productoService.js'
import { reponerStock } from './inventarioService.js'
import { reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de auditoriaService.js — Jose, tarea #33
   ---------------------------------------------------------
   REGLA 10: todo cambio de precio o estado de un producto
   queda registrado. Es el trigger TR_AUDITAR_PRODUCTO.

   La prueba 14.1 del script SQL hace justo esto: sube el
   precio de la Espada Dardo de 1500 a 1700 e inactiva el
   Hacha Enana, y espera DOS filas en la auditoria.
   ========================================================= */

describe('auditoriaService', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => cerrarSesion())

  describe('registrarCambio', () => {
    it('guarda el valor anterior y el nuevo', () => {
      expect(registrarCambio(1, 'precio', 1500, 1700)).toBe(true)

      const filas = listarAuditoria()
      expect(filas.length).toBe(1)
      expect(filas[0].productoId).toBe(1)
      expect(filas[0].campoModificado).toBe('PRECIO')
      expect(filas[0].valorAnterior).toBe('1500')
      expect(filas[0].valorNuevo).toBe('1700')
    })

    /* El trigger del SQL compara con NVL para no anotar un
       "cambio" cuando el valor quedo igual. */
    it('NO registra nada si el valor no cambio', () => {
      expect(registrarCambio(1, 'precio', 1500, 1500)).toBe(false)
      expect(listarAuditoria().length).toBe(0)
    })

    it('compara numero y texto como iguales', () => {
      expect(registrarCambio(1, 'precio', 1500, '1500')).toBe(false)
    })

    /* El SQL guarda USER; aqui, el correo del mercader */
    it('anota quien hizo el cambio', () => {
      iniciarSesion('elrond@rivendel.me', 'elrond123')
      registrarCambio(1, 'precio', 1500, 1700)

      expect(listarAuditoria()[0].usuarioBd).toBe('elrond@rivendel.me')
    })

    it('si no hay sesion, lo anota como sistema', () => {
      registrarCambio(1, 'precio', 1500, 1700)
      expect(listarAuditoria()[0].usuarioBd).toBe('sistema')
    })
  })

  describe('auditarCambios', () => {
    it('registra una fila por cada campo que cambio', () => {
      const antes = { precio: 1500, estado: 'ACTIVO' }
      const despues = { precio: 1700, estado: 'INACTIVO' }

      expect(auditarCambios(1, antes, despues)).toBe(2)
      expect(listarAuditoria().length).toBe(2)
    })

    it('solo registra lo que de verdad cambio', () => {
      const antes = { precio: 1500, estado: 'ACTIVO' }
      const despues = { precio: 1700, estado: 'ACTIVO' }

      expect(auditarCambios(1, antes, despues)).toBe(1)
      expect(listarAuditoria()[0].campoModificado).toBe('PRECIO')
    })
  })

  /* Prueba 14.1 del script SQL */
  describe('se dispara sola al editar un producto', () => {
    it('subir el precio de la Espada Dardo deja su fila', () => {
      actualizarProducto(1, { precio: 1700 })

      const filas = listarAuditoria({ productoId: 1 })
      expect(filas.length).toBe(1)
      expect(filas[0].valorAnterior).toBe('1500')
      expect(filas[0].valorNuevo).toBe('1700')
    })

    it('inactivar el Hacha Enana deja su fila', () => {
      actualizarProducto(3, { estado: 'INACTIVO' })

      const filas = listarAuditoria({ productoId: 3, campo: 'estado' })
      expect(filas.length).toBe(1)
      expect(filas[0].valorAnterior).toBe('ACTIVO')
      expect(filas[0].valorNuevo).toBe('INACTIVO')
    })

    it('los dos cambios juntos dan dos filas, como la prueba 14.1', () => {
      actualizarProducto(1, { precio: 1700 })
      actualizarProducto(3, { estado: 'INACTIVO' })

      expect(listarAuditoria().length).toBe(2)
    })

    /* Prueba 14.2 del SQL: un precio invalido no llega a
       cambiar nada, asi que la auditoria no se mueve. */
    it('un precio invalido no deja rastro', () => {
      expect(actualizarProducto(1, { precio: -11000 }).ok).toBe(false)
      expect(listarAuditoria().length).toBe(0)
      expect(obtenerProducto(1).precio).toBe(1500)
    })

    it('guardar sin cambiar nada no agrega filas', () => {
      actualizarProducto(1, { precio: 1500, estado: 'ACTIVO' })
      expect(listarAuditoria().length).toBe(0)
    })

    /* El stock NO se audita: ese queda en MOVIMIENTO_STOCK */
    it('reponer stock no toca la auditoria', () => {
      reponerStock(1, 10)
      expect(listarAuditoria().length).toBe(0)
    })
  })

  describe('filtros', () => {
    it('filtra por producto y por campo', () => {
      actualizarProducto(1, { precio: 1700 })
      actualizarProducto(1, { estado: 'INACTIVO' })
      actualizarProducto(3, { precio: 2000 })

      expect(listarAuditoria().length).toBe(3)
      expect(listarAuditoria({ productoId: 1 }).length).toBe(2)
      expect(listarAuditoria({ campo: 'precio' }).length).toBe(2)
      expect(listarAuditoria({ productoId: 1, campo: 'estado' }).length).toBe(1)
    })
  })
})
