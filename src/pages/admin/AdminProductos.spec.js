import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import AdminProductos from './AdminProductos.jsx'
import AuthProvider from '../../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../../services/authService.js'
import { listarAuditoria } from '../../services/auditoriaService.js'
import { reponerStock } from '../../services/inventarioService.js'
import { listarProductos, obtenerProducto } from '../../services/productoService.js'
import { reiniciarDatos } from '../../services/storage.js'
import { agregarProducto, crearVenta } from '../../services/ventaService.js'

/* =========================================================
   Pruebas de AdminProductos.jsx — Jose, tarea #33
   ---------------------------------------------------------
   El CRUD del catalogo, con las reglas de los SP_*_PRODUCTO.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AdminProductos />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La fila de un producto, para poder pulsar SUS botones */
const fila = (nombre) => screen.getByText(nombre).closest('tr')
const pulsarEn = (nombre, boton) =>
  fireEvent.click(within(fila(nombre)).getByRole('button', { name: boton }))

/* Borrar son dos pasos: pulsar Eliminar y confirmar */
const borrarDeVerdad = (nombre) => {
  pulsarEn(nombre, 'Eliminar')
  fireEvent.click(screen.getByRole('button', { name: 'Si, eliminar' }))
}

const escribir = (etiqueta, valor) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })

describe('AdminProductos', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('elrond@rivendel.me', 'elrond123')   // ADMINISTRADOR
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('la tabla', () => {
    it('lista los ocho productos del SQL', () => {
      dibujar()
      expect(screen.getByText('Espada Dardo')).toBeTruthy()
      expect(screen.getByText('Baston de Mago')).toBeTruthy()
    })

    /* En el panel SI se ven los inactivos, para poder
       reactivarlos. En la tienda no. */
    it('muestra tambien los productos INACTIVOS', () => {
      pulsarEnInactivar()
      expect(screen.getByText('Hacha Enana')).toBeTruthy()
    })

    function pulsarEnInactivar() {
      dibujar()
      pulsarEn('Hacha Enana', 'Inactivar')
    }
  })

  describe('crear', () => {
    /* SP_INSERTAR_PRODUCTO: el producto nace con stock 0 */
    it('crea el producto con stock 0', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))

      escribir(/^Nombre/, 'Pocion de Athelas')
      escribir(/^Categoria/, '3')
      escribir(/^Precio/, '300')
      escribir(/^Nivel requerido/, '1')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      const creado = listarProductos().find((p) => p.nombre === 'Pocion de Athelas')
      expect(creado).toBeTruthy()
      expect(creado.stock).toBe(0)
      expect(creado.estado).toBe('ACTIVO')
    })

    it('avisa de que hay que reponerlo', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))

      escribir(/^Nombre/, 'Pocion de Athelas')
      escribir(/^Categoria/, '3')
      escribir(/^Precio/, '300')
      escribir(/^Nivel requerido/, '1')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.getByText(/creado con stock 0/)).toBeTruthy()
    })

    it('no crea nada si el formulario esta vacio', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.getByText('El nombre es obligatorio.')).toBeTruthy()
      expect(screen.getByText('Elige una categoria.')).toBeTruthy()
      expect(listarProductos().length).toBe(8)
    })

    /* CHECK (precio > 0) de la tabla PRODUCTO */
    it('no acepta un precio de cero', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))

      escribir(/^Nombre/, 'Objeto gratis')
      escribir(/^Categoria/, '1')
      escribir(/^Precio/, '0')
      escribir(/^Nivel requerido/, '1')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(screen.getByText('El precio debe ser mayor que cero.')).toBeTruthy()
      expect(listarProductos().length).toBe(8)
    })
  })

  describe('editar', () => {
    /* Prueba 14.1 del SQL: 1500 -> 1700 deja rastro */
    it('cambiar el precio queda auditado', () => {
      dibujar()
      pulsarEn('Espada Dardo', 'Editar')

      escribir(/^Precio/, '1700')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(obtenerProducto(1).precio).toBe(1700)

      const auditoria = listarAuditoria({ productoId: 1, campo: 'precio' })
      expect(auditoria.length).toBe(1)
      expect(auditoria[0].valorAnterior).toBe('1500')
      expect(auditoria[0].valorNuevo).toBe('1700')
    })

    /* El stock SOLO se mueve desde inventarioService */
    it('editar no toca el stock', () => {
      reponerStock(1, 10)                  // 5 + 10 = 15
      dibujar()

      pulsarEn('Espada Dardo', 'Editar')
      escribir(/^Precio/, '1700')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(obtenerProducto(1).stock).toBe(15)
    })

    it('inactivar queda auditado', () => {
      dibujar()
      pulsarEn('Hacha Enana', 'Inactivar')

      expect(obtenerProducto(3).estado).toBe('INACTIVO')

      const auditoria = listarAuditoria({ productoId: 3, campo: 'estado' })
      expect(auditoria[0].valorAnterior).toBe('ACTIVO')
      expect(auditoria[0].valorNuevo).toBe('INACTIVO')
    })
  })

  describe('eliminar', () => {
    it('borra un producto sin historial', () => {
      dibujar()
      fireEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))
      escribir(/^Nombre/, 'Piedra de Afilar')
      escribir(/^Categoria/, '4')
      escribir(/^Precio/, '100')
      escribir(/^Nivel requerido/, '1')
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      borrarDeVerdad('Piedra de Afilar')
      expect(screen.getByText('Piedra de Afilar eliminado.')).toBeTruthy()
      expect(listarProductos().length).toBe(8)
    })

    it('pregunta antes de borrar y respeta el Cancelar', () => {
      dibujar()
      pulsarEn('Lembas', 'Eliminar')

      expect(screen.getByText('Confirmar')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(listarProductos().length).toBe(8)
    })

    /* REGLA 9 — prueba 15.10 del SQL */
    it('NO borra un producto con ventas', () => {
      const { venta } = crearVenta(4)
      agregarProducto(venta.ventaId, 6, 1)   // Lembas

      dibujar()
      borrarDeVerdad('Lembas')

      expect(screen.getByText(/Dejalo INACTIVO/)).toBeTruthy()
      expect(obtenerProducto(6)).not.toBeNull()
    })

    it('tampoco si solo tiene movimientos de stock', () => {
      reponerStock(1, 5)

      dibujar()
      borrarDeVerdad('Espada Dardo')

      expect(screen.getByText(/Dejalo INACTIVO/)).toBeTruthy()
    })
  })

  /* VENDEDOR y HERRERO miran, pero no tocan */
  describe('permisos', () => {
    it('un VENDEDOR no ve los botones de accion', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()

      expect(screen.queryByRole('button', { name: 'Nuevo producto' })).toBeNull()
      expect(screen.getByText(/Solo un ADMINISTRADOR/)).toBeTruthy()
    })

    it('pero si ve la tabla', () => {
      cerrarSesion()
      iniciarSesion('cebadilla@pony.me', 'cebadilla1')
      dibujar()

      expect(screen.getByText('Espada Dardo')).toBeTruthy()
    })
  })
})
