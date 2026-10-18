import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Categorias from './Categorias.jsx'
import { CLAVES, guardar, leer, reiniciarDatos } from '../services/storage.js'

/* =========================================================
   Pruebas de Categorias.jsx — Javier, Anexo 1
   ---------------------------------------------------------
   La pagina no tiene estado ni eventos: es la puerta de los
   gremios. Lo que hay que fijar es que cuente bien y que
   enlace al catalogo ya filtrado, que es la "CATEGORIA #1"
   del diagrama del Anexo.
   ========================================================= */

function dibujar() {
  return render(
    <MemoryRouter>
      <Categorias />
    </MemoryRouter>,
  )
}

/* El enlace de un gremio, por su texto visible */
const tarjeta = (nombre) => screen.getByRole('link', { name: new RegExp(nombre) })

describe('Categorias', () => {
  beforeEach(reiniciarDatos)
  afterEach(cleanup)

  it('muestra los cuatro gremios de la tabla CATEGORIA', () => {
    dibujar()
    expect(screen.getByText('Armas')).toBeTruthy()
    expect(screen.getByText('Armaduras')).toBeTruthy()
    expect(screen.getByText('Pociones')).toBeTruthy()
    expect(screen.getByText('Accesorios')).toBeTruthy()
  })

  it('cuenta los objetos de cada gremio', () => {
    dibujar()
    expect(tarjeta('Armas').textContent).toContain('3 objetos')
    expect(tarjeta('Armaduras').textContent).toContain('2 objetos')
    expect(tarjeta('Accesorios').textContent).toContain('1 objeto')
  })

  it('muestra el precio mas bajo de cada gremio', () => {
    dibujar()
    expect(tarjeta('Armas').textContent).toContain('Desde 1.500 oro')   // Espada Dardo
    expect(tarjeta('Pociones').textContent).toContain('Desde 50 oro')   // Lembas
  })

  it('cada gremio enlaza al catalogo ya filtrado', () => {
    dibujar()
    expect(tarjeta('Armas').getAttribute('href')).toBe('/catalogo?categoria=1')
    expect(tarjeta('Accesorios').getAttribute('href')).toBe('/catalogo?categoria=4')
  })

  /* REGLA 2: lo INACTIVO no se vende, asi que no se cuenta */
  it('no cuenta los productos INACTIVOS', () => {
    const productos = leer(CLAVES.productos, [])
    productos[2].estado = 'INACTIVO'            // Hacha Enana, de Armas
    guardar(CLAVES.productos, productos)

    dibujar()
    expect(tarjeta('Armas').textContent).toContain('2 objetos')
  })

  /* Renderizado condicional: un gremio vacio no muestra precio */
  it('un gremio sin existencias lo dice y no muestra precio', () => {
    const productos = leer(CLAVES.productos, []).filter((p) => p.categoriaId !== 4)
    guardar(CLAVES.productos, productos)

    dibujar()
    expect(tarjeta('Accesorios').textContent).toContain('Sin existencias')
    expect(tarjeta('Accesorios').textContent).not.toContain('Desde')
  })
})
