import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import CompraExitosa from './CompraExitosa.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { reiniciarDatos } from '../services/storage.js'
import { agregarProducto, confirmarVenta, crearVenta } from '../services/ventaService.js'

/* =========================================================
   Pruebas de CompraExitosa.jsx — Javier, Anexo 1
   ---------------------------------------------------------
   La boleta se lee de la base por el ventaId de la URL, no
   del estado del router. Estas pruebas fijan justamente eso:
   entrar directo al enlace tiene que funcionar, y la unica
   parte que puede faltar al recargar es la direccion.

   Y fijan lo otro que trae un id en la URL: que la boleta sea
   de quien la pidio, y que corresponda a una venta pagada.
   ========================================================= */

const ENVIO = {
  direccion: 'Ciudadela Blanca 7',
  reino: 'Minas Tirith',
  entrega: 'Aguilas de Manwe',
}

function dibujar(ventaId, state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/compra-exitosa/${ventaId}`, state }]}>
      <AuthProvider>
        <Routes>
          <Route path="/compra-exitosa/:ventaId" element={<CompraExitosa />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* La compra 10.1 del SQL, ya confirmada: 3 Lembas + 1 Capa */
function comprar() {
  const { venta } = crearVenta(4)
  agregarProducto(venta.ventaId, 6, 3)
  agregarProducto(venta.ventaId, 5, 1)
  confirmarVenta(venta.ventaId)
  return venta
}

describe('CompraExitosa', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
    iniciarSesion('aragorn@gondor.me', 'aragorn123')   // el jugador 4, el que compra
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('muestra el numero de la boleta', () => {
    const venta = comprar()
    dibujar(venta.ventaId)
    expect(screen.getByText(`ME-${venta.ventaId}`)).toBeTruthy()
  })

  it('detalla los objetos comprados y el total', () => {
    const venta = comprar()
    dibujar(venta.ventaId)

    expect(screen.getByText('Lembas')).toBeTruthy()
    expect(screen.getByText('Capa Elfica')).toBeTruthy()
    expect(screen.getByText('1.050 oro')).toBeTruthy()
  })

  /* Renderizado condicional: la direccion viene del router */
  it('muestra la entrega si le llega del checkout', () => {
    const venta = comprar()
    dibujar(venta.ventaId, { envio: ENVIO })

    expect(screen.getByText('Ciudadela Blanca 7, Minas Tirith')).toBeTruthy()
    expect(screen.getByText('Aguilas de Manwe')).toBeTruthy()
  })

  /* Al recargar se pierde el state, pero la boleta sigue */
  it('sin los datos de envio la boleta se ve igual', () => {
    const venta = comprar()
    dibujar(venta.ventaId)

    expect(screen.queryByText('Entrega')).toBeNull()
    expect(screen.getByText('Lembas')).toBeTruthy()
  })

  it('avisa si la boleta no existe', () => {
    dibujar(9999)
    expect(screen.getByText('Esa boleta no existe.')).toBeTruthy()
  })

  /* El id va en la URL: sin esta comprobacion, cualquier
     jugador leeria la compra de otro cambiando el numero. */
  it('no muestra la boleta de otro jugador', () => {
    const { venta } = crearVenta(5)                    // Gandalf, no Aragorn
    agregarProducto(venta.ventaId, 6, 1)
    confirmarVenta(venta.ventaId)

    dibujar(venta.ventaId)

    expect(screen.getByText('Esa boleta no existe.')).toBeTruthy()
    expect(screen.queryByText('Compra realizada')).toBeNull()
  })

  /* Una venta ABIERTA es un carrito, no una compra */
  it('no da por pagada una venta que sigue abierta', () => {
    const { venta } = crearVenta(4)
    agregarProducto(venta.ventaId, 6, 1)               // sin confirmarVenta

    dibujar(venta.ventaId)

    expect(screen.getByText('Esa boleta no existe.')).toBeTruthy()
  })
})
