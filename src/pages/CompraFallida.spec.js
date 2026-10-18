import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import CompraFallida from './CompraFallida.jsx'

/* =========================================================
   Pruebas de CompraFallida.jsx — Javier, Anexo 1
   ---------------------------------------------------------
   La pagina no toca la base: solo explica por que fallo y
   ofrece reintentar. El mensaje llega en el state del router,
   puesto por quien fallo (el pagare o una regla del SQL).
   ========================================================= */

function dibujar(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/compra-fallida', state }]}>
      <CompraFallida />
    </MemoryRouter>,
  )
}

describe('CompraFallida', () => {
  afterEach(cleanup)

  it('muestra el motivo que le llega', () => {
    dibujar({ error: 'El pagare de Isengard fue rechazado. Saruman no responde.' })
    expect(screen.getByText(/El pagare de Isengard fue rechazado/)).toBeTruthy()
  })

  it('repite el error del service tal cual', () => {
    dibujar({ error: 'La venta no tiene productos.' })
    expect(screen.getByText('La venta no tiene productos.')).toBeTruthy()
  })

  /* Renderizado condicional: si se entra sin pasar por el
     checkout, hay un mensaje de respaldo. */
  it('sin motivo usa uno generico', () => {
    dibujar()
    expect(screen.getByText('No se pudo completar el pago.')).toBeTruthy()
  })

  it('ofrece reintentar y volver al carrito', () => {
    dibujar()
    expect(screen.getByRole('link', { name: 'Reintentar el pago' }).getAttribute('href')).toBe('/checkout')
    expect(screen.getByRole('link', { name: 'Volver al carrito' }).getAttribute('href')).toBe('/carrito')
  })
})
