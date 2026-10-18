import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Catalogo from './Catalogo.jsx'
import AuthProvider from '../context/AuthProvider.jsx'
import { cerrarSesion, iniciarSesion } from '../services/authService.js'
import { CLAVES, guardar, leer, reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de Catalogo.jsx — Jose, tarea #23
   ---------------------------------------------------------
   El filtro de categoria vive en la URL, asi que se puede
   probar entrando directo a /catalogo?categoria=1.
   ========================================================= */

function dibujar(ruta = '/catalogo') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <Catalogo />
      </AuthProvider>
    </MemoryRouter>,
  )
}

/* Cuenta las fichas por su boton "Ver objeto" */
const fichas = () => screen.queryAllByText('Ver objeto').length

/* Los botones de filtro se piden por su ROL, no por su texto:
   "Armas" aparece tambien como etiqueta en cada ficha, y
   getByText encontraria varios. */
const filtro = (nombre) => screen.getByRole('button', { name: nombre })

describe('Catalogo', () => {
  beforeEach(() => {
    reiniciarDatos()
    cerrarSesion()
  })

  afterEach(() => {
    cleanup()
    cerrarSesion()
  })

  describe('sin sesion', () => {
    it('muestra los ocho productos', () => {
      dibujar()
      expect(fichas()).toBe(8)
    })

    it('muestra los botones de las cuatro categorias', () => {
      dibujar()
      expect(filtro('Armas')).toBeTruthy()
      expect(filtro('Armaduras')).toBeTruthy()
      expect(filtro('Pociones')).toBeTruthy()
      expect(filtro('Accesorios')).toBeTruthy()
    })

    /* El filtro de nivel no tiene sentido si no sabemos el
       nivel de nadie. */
    it('no ofrece el filtro de nivel', () => {
      dibujar()
      expect(screen.queryByRole('button', { name: /Solo lo que puedo usar/ })).toBeNull()
    })
  })

  describe('filtro por categoria', () => {
    it('al pulsar Armas deja tres fichas', () => {
      dibujar()
      fireEvent.click(filtro('Armas'))
      expect(fichas()).toBe(3)
    })

    it('entra ya filtrado si la URL trae la categoria', () => {
      dibujar('/catalogo?categoria=3')   // Pociones
      expect(fichas()).toBe(2)
    })

    it('el boton de la categoria activa se marca', () => {
      dibujar('/catalogo?categoria=1')
      expect(filtro('Armas').className).toContain('active')
      expect(filtro('Todas').className).not.toContain('active')
    })

    it('Todas vuelve a mostrar los ocho', () => {
      dibujar('/catalogo?categoria=1')
      fireEvent.click(filtro('Todas'))
      expect(fichas()).toBe(8)
    })
  })

  describe('con un jugador dentro', () => {
    /* REGLA 3: Frodo es nivel 5 */
    it('Frodo puede filtrar por su nivel y ve tres objetos', () => {
      iniciarSesion('frodo@comarca.me', 'frodo123')
      dibujar()

      expect(fichas()).toBe(8)
      fireEvent.click(filtro(/Solo lo que puedo usar/))
      expect(fichas()).toBe(3)
    })

    it('el filtro muestra el nivel del jugador', () => {
      iniciarSesion('aragorn@gondor.me', 'aragorn123')
      dibujar()
      expect(filtro('Solo lo que puedo usar (nivel 25)')).toBeTruthy()
    })

    it('los dos filtros se combinan', () => {
      iniciarSesion('frodo@comarca.me', 'frodo123')
      dibujar('/catalogo?categoria=1')          // Armas: 3

      fireEvent.click(filtro(/Solo lo que puedo usar/))
      expect(fichas()).toBe(1)                  // solo la Espada Dardo
      expect(screen.getByText('Espada Dardo')).toBeTruthy()
    })

    it('avisa cuando ningun objeto cumple el filtro', () => {
      iniciarSesion('frodo@comarca.me', 'frodo123')
      dibujar('/catalogo?categoria=4')          // Accesorios: solo el Baston, nivel 40

      fireEvent.click(filtro(/Solo lo que puedo usar/))
      expect(screen.getByText('No hay objetos que cumplan ese filtro.')).toBeTruthy()
    })
  })

  /* REGLA 2: los INACTIVOS no se venden, asi que no se ven */
  it('no muestra los productos INACTIVOS', () => {
    const productos = leer(CLAVES.productos, [])
    productos[2].estado = 'INACTIVO'            // Hacha Enana
    guardar(CLAVES.productos, productos)

    dibujar()
    expect(fichas()).toBe(7)
    expect(screen.queryByText('Hacha Enana')).toBeNull()
  })

  /* El mercader mira el catalogo, pero no compra */
  it('a un mercader no le ofrece el filtro de nivel', () => {
    iniciarSesion('elrond@rivendel.me', 'elrond123')
    dibujar()
    expect(screen.queryByText(/Solo lo que puedo usar/)).toBeNull()
  })
})
