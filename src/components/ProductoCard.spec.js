import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ProductoCard from './ProductoCard.jsx'
import { sembrarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de ProductoCard — Jose, tarea #12
   ---------------------------------------------------------
   El segundo ejemplo: un COMPONENTE. Karma lo dibuja en un
   Chrome de verdad, asi que se puede comprobar lo que ve el
   usuario.

   DOS COSAS QUE HAY QUE SABER
     MemoryRouter ... el componente usa <Link>, que necesita
                      un router alrededor. MemoryRouter es uno
                      de mentira, para pruebas.
     cleanup ........ borra lo dibujado despues de cada prueba,
                      para que una no ensucie a la siguiente.
   ========================================================= */

const ESPADA = {
  productoId: 1,
  categoriaId: 1,
  nombre: 'Espada Dardo',
  precio: 1500,
  stock: 5,
  nivelRequerido: 5,
  estado: 'ACTIVO',
  imagen: '1.jpg',
}

function dibujar(props) {
  return render(
    <MemoryRouter>
      <ProductoCard {...props} />
    </MemoryRouter>,
  )
}

describe('ProductoCard', () => {
  beforeEach(() => sembrarDatos())   // la ficha pide el nombre de la categoria
  afterEach(() => cleanup())

  it('muestra el nombre del producto', () => {
    dibujar({ producto: ESPADA })
    expect(screen.getByText('Espada Dardo')).toBeTruthy()
  })

  it('muestra el precio en oro', () => {
    dibujar({ producto: ESPADA })
    expect(screen.getByText('1.500 oro')).toBeTruthy()
  })

  it('muestra el nombre de la categoria', () => {
    dibujar({ producto: ESPADA })
    expect(screen.getByText('Armas')).toBeTruthy()
  })

  it('muestra cuantas unidades quedan', () => {
    dibujar({ producto: ESPADA })
    expect(screen.getByText('Quedan 5')).toBeTruthy()
  })

  it('dice Agotado cuando el stock es cero', () => {
    dibujar({ producto: { ...ESPADA, stock: 0 } })
    expect(screen.getByText('Agotado')).toBeTruthy()
  })

  it('enlaza al detalle del producto', () => {
    dibujar({ producto: ESPADA })
    const enlace = screen.getByText('Ver objeto')
    expect(enlace.getAttribute('href')).toBe('/productos/1')
  })

  /* Regla 3 del SQL: el jugador solo compra lo que su nivel
     le permite. Frodo es nivel 5 y el Baston pide 40. */
  it('avisa cuando al jugador no le alcanza el nivel', () => {
    dibujar({ producto: { ...ESPADA, nivelRequerido: 40 }, nivelJugador: 5 })
    expect(screen.getByText('Necesitas nivel 40')).toBeTruthy()
  })

  it('no avisa cuando el nivel alcanza', () => {
    dibujar({ producto: ESPADA, nivelJugador: 25 })
    expect(screen.queryByText(/Necesitas nivel/)).toBeNull()
  })
})
