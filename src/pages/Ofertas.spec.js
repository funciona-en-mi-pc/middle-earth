import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Ofertas from './Ofertas.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { CLAVES, guardar, leer, reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de Ofertas.jsx — Javier, Anexo 1
   ---------------------------------------------------------
   La oferta se deriva del stock (utils/oferta.js). Con los
   datos del SQL quedan cuatro objetos rebajados:

     Lembas       stock 40  -25%
     Miruvor      stock 25  -25%
     Capa Elfica  stock 12  -10%
     Hacha Enana  stock 10  -10%
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Ofertas />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const fichas = () => screen.queryAllByText('Ver objeto').length

describe('Ofertas', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  it('muestra solo los objetos rebajados', () => {
    dibujar()
    expect(fichas()).toBe(4)
    expect(screen.getByText('Lembas')).toBeTruthy()
    expect(screen.getByText('Hacha Enana')).toBeTruthy()
    expect(screen.queryByText('Espada Dardo')).toBeNull()   // stock 5
  })

  it('pinta el sello con el porcentaje', () => {
    dibujar()
    expect(screen.queryAllByText('-25%').length).toBe(2)
    expect(screen.queryAllByText('-10%').length).toBe(2)
  })

  /* El precio vigente es el del SQL; lo tachado es el de antes */
  it('muestra el precio anterior tachado', () => {
    dibujar()
    expect(screen.getByText('50 oro')).toBeTruthy()    // Lembas, vigente
    expect(screen.getByText('67 oro')).toBeTruthy()    // Lembas, antes
  })

  it('ordena de mayor a menor descuento', () => {
    dibujar()
    const nombres = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(nombres.slice(0, 2).sort()).toEqual(['Lembas', 'Miruvor'])
  })

  /* REGLA 2: lo INACTIVO no se liquida */
  it('no muestra los INACTIVOS por mucho stock que tengan', () => {
    const productos = leer(CLAVES.productos, [])
    productos[5].estado = 'INACTIVO'            // Lembas, stock 40
    guardar(CLAVES.productos, productos)

    dibujar()
    expect(fichas()).toBe(3)
    expect(screen.queryByText('Lembas')).toBeNull()
  })

  /* Renderizado condicional: sin rebajas, el aviso */
  it('avisa cuando no hay nada rebajado', () => {
    const productos = leer(CLAVES.productos, []).map((p) => ({ ...p, stock: 1 }))
    guardar(CLAVES.productos, productos)

    dibujar()
    expect(screen.getByText('Hoy el mercader no rebaja nada. Vuelve manana.')).toBeTruthy()
  })

  /* REGLA 3: la ficha avisa si no alcanza el nivel (prop) */
  it('a Frodo le avisa lo que no puede usar', () => {
    iniciarSesion('frodo@comarca.me', 'frodo123')   // nivel 5
    dibujar()
    expect(screen.getByText('Necesitas nivel 15')).toBeTruthy()   // Hacha Enana
  })

  it('sin sesion no avisa de niveles', () => {
    dibujar()
    expect(screen.queryByText(/Necesitas nivel/)).toBeNull()
  })
})
