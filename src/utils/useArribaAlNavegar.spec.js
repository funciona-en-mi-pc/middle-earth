import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { useArribaAlNavegar } from './useArribaAlNavegar.js'

/* =========================================================
   Pruebas de useArribaAlNavegar.js — Javier
   ---------------------------------------------------------
   Fijan las dos mitades de la regla: una pagina nueva empieza
   arriba, pero el boton Atras deja el scroll donde estaba.
   ========================================================= */

function Prueba() {
  useArribaAlNavegar()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <>
      <p>ruta {pathname}</p>
      <button onClick={() => navigate('/otra')}>ir</button>
      <button onClick={() => navigate(-1)}>atras</button>
    </>
  )
}

function dibujar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="*" element={<Prueba />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('useArribaAlNavegar', () => {
  beforeEach(() => spyOn(window, 'scrollTo'))
  afterEach(cleanup)

  it('sube al pasar a una pagina nueva', async () => {
    dibujar()
    fireEvent.click(screen.getByText('ir'))

    await waitFor(() => expect(screen.getByText('ruta /otra')).toBeTruthy())
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('no sube al volver con Atras', async () => {
    dibujar()
    fireEvent.click(screen.getByText('ir'))
    await waitFor(() => expect(screen.getByText('ruta /otra')).toBeTruthy())
    window.scrollTo.calls.reset()

    fireEvent.click(screen.getByText('atras'))

    await waitFor(() => expect(screen.getByText('ruta /')).toBeTruthy())
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
