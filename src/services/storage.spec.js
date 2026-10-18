import {
  CLAVES,
  guardar,
  leer,
  reiniciarDatos,
  sembrarDatos,
  siguienteId,
  siguienteIdVenta,
} from './storage.js'

/* =========================================================
   Pruebas de storage.js — Javier, tarea #36
   ---------------------------------------------------------
   Es la "base de datos" del frontend. Lo que mas importa
   probar aqui no es el caso normal, sino los dos casos en que
   localStorage FALLA de verdad:

     - el navegador esta en modo privado con el almacenamiento
       bloqueado
     - se lleno la cuota

   En los dos, localStorage lanza una excepcion. La pagina
   tiene que seguir en pie, no romperse. Eso se prueba
   haciendo que los metodos lancen a proposito, con spyOn.
   ========================================================= */

describe('storage', () => {
  beforeEach(() => reiniciarDatos())

  describe('leer y guardar', () => {
    it('guarda y devuelve objetos, no texto', () => {
      guardar('prueba', { a: 1, b: [2, 3] })
      expect(leer('prueba')).toEqual({ a: 1, b: [2, 3] })
      localStorage.removeItem('prueba')
    })

    it('devuelve el valor por defecto si la clave no existe', () => {
      expect(leer('no-existe', [])).toEqual([])
      expect(leer('no-existe')).toBeNull()
    })

    it('siembra las nueve tablas del SQL', () => {
      expect(leer(CLAVES.razas).length).toBe(5)
      expect(leer(CLAVES.categorias).length).toBe(4)
      expect(leer(CLAVES.jugadores).length).toBe(6)
      expect(leer(CLAVES.mercaderes).length).toBe(4)
      expect(leer(CLAVES.productos).length).toBe(8)
      expect(leer(CLAVES.ventas)).toEqual([])
    })

    /* Sembrar dos veces no pisa lo que el usuario hizo */
    it('sembrar de nuevo no borra lo que ya habia', () => {
      guardar(CLAVES.ventas, [{ ventaId: 1001 }])
      sembrarDatos()

      expect(leer(CLAVES.ventas).length).toBe(1)
    })

    it('reiniciar si lo deja todo como al principio', () => {
      guardar(CLAVES.ventas, [{ ventaId: 1001 }])
      reiniciarDatos()

      expect(leer(CLAVES.ventas)).toEqual([])
    })
  })

  /* Los ID: lo que en Oracle hacen las secuencias */
  describe('siguienteId', () => {
    it('empieza en 1 cuando la lista esta vacia', () => {
      expect(siguienteId([], 'jugadorId')).toBe(1)
    })

    it('es el mayor que ya existe, mas uno', () => {
      const lista = [{ id: 1 }, { id: 7 }, { id: 3 }]
      expect(siguienteId(lista, 'id')).toBe(8)
    })

    it('respeta el numero de partida', () => {
      expect(siguienteId([], 'ventaId', 1001)).toBe(1001)
    })

    /* SEQ_VENTA del SQL: START WITH 1001 */
    it('la primera venta es la 1001', () => {
      expect(siguienteIdVenta([])).toBe(1001)
    })

    it('y la siguiente la 1002', () => {
      expect(siguienteIdVenta([{ ventaId: 1001 }])).toBe(1002)
    })

    /* Aunque hubiera ids viejos mas bajos, nunca baja de 1001 */
    it('nunca devuelve un numero menor que el de partida', () => {
      expect(siguienteIdVenta([{ ventaId: 5 }])).toBe(1001)
    })
  })

  /* =========================================================
     LO IMPORTANTE: que un localStorage roto no tumbe la pagina
     ========================================================= */
  describe('cuando localStorage falla', () => {
    it('leer devuelve el valor por defecto en vez de reventar', () => {
      spyOn(console, 'warn')
      spyOn(Storage.prototype, 'getItem').and.throwError('almacenamiento bloqueado')

      expect(() => leer(CLAVES.productos, [])).not.toThrow()
      expect(leer(CLAVES.productos, [])).toEqual([])
      expect(console.warn).toHaveBeenCalled()
    })

    it('guardar avisa y devuelve false en vez de reventar', () => {
      spyOn(console, 'warn')
      spyOn(Storage.prototype, 'setItem').and.throwError('cuota llena')

      expect(() => guardar('x', { a: 1 })).not.toThrow()
      expect(guardar('x', { a: 1 })).toBe(false)
      expect(console.warn).toHaveBeenCalled()
    })

    it('reiniciar aguanta aunque no se pueda borrar', () => {
      spyOn(console, 'warn')
      spyOn(Storage.prototype, 'removeItem').and.throwError('bloqueado')

      expect(() => reiniciarDatos()).not.toThrow()
    })

    /* Un JSON corrupto no deberia tumbar la pagina tampoco */
    it('leer aguanta un valor que no es JSON valido', () => {
      spyOn(console, 'warn')
      localStorage.setItem('roto', '{esto no es json')

      expect(leer('roto', 'por defecto')).toBe('por defecto')
      localStorage.removeItem('roto')
    })
  })
})
