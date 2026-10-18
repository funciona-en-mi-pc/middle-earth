import {
  actualizarProducto,
  estaAgotado,
  inactivarProducto,
  listarCategorias,
  listarProductos,
  nombreCategoria,
  obtenerProducto,
  productosDestacados,
  rutaImagen,
} from './productoService.js'
import { listarAuditoria } from './auditoriaService.js'
import { CLAVES, guardar, leer, reiniciarDatos } from './storage.js'

/* =========================================================
   Pruebas de productoService.js — Jose, tarea #23
   ---------------------------------------------------------
   El catalogo del SQL: 8 productos y 4 categorias.
   ========================================================= */

describe('productoService', () => {
  beforeEach(() => reiniciarDatos())

  describe('categorias', () => {
    it('trae las cuatro del SQL', () => {
      expect(listarCategorias().length).toBe(4)
    })

    it('traduce el id al nombre', () => {
      expect(nombreCategoria(1)).toBe('Armas')
      expect(nombreCategoria(3)).toBe('Pociones')
    })

    it('no revienta con una categoria que no existe', () => {
      expect(nombreCategoria(99)).toBe('Sin categoria')
    })
  })

  describe('listarProductos', () => {
    it('sin filtros trae los ocho', () => {
      expect(listarProductos().length).toBe(8)
    })

    it('filtra por categoria', () => {
      expect(listarProductos({ categoriaId: 1 }).length).toBe(3)   // Armas
      expect(listarProductos({ categoriaId: 3 }).length).toBe(2)   // Pociones
      expect(listarProductos({ categoriaId: 4 }).length).toBe(1)   // Accesorios
    })

    it('acepta la categoria como texto, que es como llega de la URL', () => {
      expect(listarProductos({ categoriaId: '1' }).length).toBe(3)
    })

    /* REGLA 2: un producto INACTIVO no se muestra en la tienda */
    it('con soloActivos deja fuera los dados de baja', () => {
      const productos = leer(CLAVES.productos, [])
      productos[2].estado = 'INACTIVO'                 // Hacha Enana
      guardar(CLAVES.productos, productos)

      expect(listarProductos().length).toBe(8)
      expect(listarProductos({ soloActivos: true }).length).toBe(7)
    })

    /* REGLA 3: cada jugador ve lo que su nivel le permite */
    it('filtra por el nivel del jugador', () => {
      expect(listarProductos({ nivelMaximo: 5 }).length).toBe(3)    // Frodo: Dardo y las 2 pociones
      expect(listarProductos({ nivelMaximo: 50 }).length).toBe(8)   // Gandalf lo puede todo
      expect(listarProductos({ nivelMaximo: 1 }).length).toBe(2)    // solo las pociones
    })

    it('combina los dos filtros con Y', () => {
      // Armas de nivel 5 o menos: solo la Espada Dardo
      const resultado = listarProductos({ categoriaId: 1, nivelMaximo: 5 })

      expect(resultado.length).toBe(1)
      expect(resultado[0].nombre).toBe('Espada Dardo')
    })
  })

  describe('obtenerProducto', () => {
    it('encuentra por id', () => {
      expect(obtenerProducto(4).nombre).toBe('Cota de Mithril')
      expect(obtenerProducto('4').nombre).toBe('Cota de Mithril')
    })

    it('devuelve null si no existe', () => {
      expect(obtenerProducto(999)).toBeNull()
      expect(obtenerProducto('abc')).toBeNull()
    })

    it('trae los datos del SQL sin cambiarlos', () => {
      const cota = obtenerProducto(4)

      expect(cota.precio).toBe(5000)
      expect(cota.stock).toBe(3)
      expect(cota.nivelRequerido).toBe(15)
      expect(cota.categoriaId).toBe(2)
    })
  })

  describe('productosDestacados', () => {
    it('devuelve los cuatro primeros', () => {
      expect(productosDestacados(4).length).toBe(4)
      expect(productosDestacados(4)[0].nombre).toBe('Espada Dardo')
    })

    it('nunca devuelve mas de los que hay', () => {
      expect(productosDestacados(100).length).toBe(8)
    })
  })

  describe('ayudas de la ficha', () => {
    it('sabe cuando un producto esta agotado', () => {
      expect(estaAgotado(obtenerProducto(6))).toBe(false)
      expect(estaAgotado({ stock: 0 })).toBe(true)
      expect(estaAgotado(null)).toBe(true)
    })

    /* Las imagenes se llaman por el id, asi se pueden
       reemplazar sin tocar codigo. */
    it('arma la ruta de la imagen', () => {
      expect(rutaImagen(obtenerProducto(1))).toBe('/img/productos/1.jpg')
      expect(rutaImagen(null)).toBe('')
    })
  })

  /* El atajo para dar de baja un producto. Pasa por
     actualizarProducto a proposito, para que el cambio de
     estado quede auditado (regla 10). */
  describe('inactivarProducto', () => {
    it('lo deja INACTIVO', () => {
      expect(inactivarProducto(1).ok).toBe(true)
      expect(obtenerProducto(1).estado).toBe('INACTIVO')
    })

    it('el cambio queda auditado', () => {
      inactivarProducto(1)

      const auditoria = listarAuditoria({ productoId: 1, campo: 'estado' })
      expect(auditoria.length).toBe(1)
      expect(auditoria[0].valorNuevo).toBe('INACTIVO')
    })

    /* REGLA 2: un producto INACTIVO sale de la tienda */
    it('deja de aparecer en el catalogo de la tienda', () => {
      inactivarProducto(1)
      expect(listarProductos({ soloActivos: true }).length).toBe(7)
    })

    it('avisa si el producto no existe', () => {
      expect(inactivarProducto(999).error).toBe('Producto inexistente.')
    })
  })

  /* El stock se protege: aunque llegue en los cambios, se
     ignora. Solo inventarioService lo mueve. */
  describe('actualizarProducto no toca el stock', () => {
    it('ignora el stock aunque se lo manden', () => {
      actualizarProducto(1, { precio: 1700, stock: 999 })
      expect(obtenerProducto(1).stock).toBe(5)
    })

    it('y ese intento no queda en la auditoria', () => {
      actualizarProducto(1, { stock: 999 })
      expect(listarAuditoria().length).toBe(0)
    })
  })
})
