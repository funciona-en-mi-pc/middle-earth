import { enOferta, ofertaDe, precioAntes } from './oferta.js'

/* =========================================================
   Pruebas de oferta.js — Javier
   ---------------------------------------------------------
   La oferta se DERIVA del stock, que es un dato real del SQL.
   Estas pruebas fijan los tramos y, sobre todo, la cuenta del
   precio anterior: si esa cuenta se rompe, la ficha miente y
   la boleta dice otra cosa.
   ========================================================= */

const obj = (stock, precio = 1000) => ({ stock, precio, estado: 'ACTIVO' })

describe('oferta derivada del stock', () => {
  it('stock 25 o mas se liquida al 25 por ciento', () => {
    expect(ofertaDe(obj(25))).toBe(25)
    expect(ofertaDe(obj(40))).toBe(25)    // Lembas
  })

  it('stock 15 a 24 se liquida al 15 por ciento', () => {
    expect(ofertaDe(obj(15))).toBe(15)
    expect(ofertaDe(obj(24))).toBe(15)
  })

  it('stock 10 a 14 se liquida al 10 por ciento', () => {
    expect(ofertaDe(obj(10))).toBe(10)    // Hacha Enana
    expect(ofertaDe(obj(12))).toBe(10)    // Capa Elfica
    expect(ofertaDe(obj(14))).toBe(10)
  })

  it('bajo stock 10 no hay oferta', () => {
    expect(ofertaDe(obj(9))).toBe(0)
    expect(ofertaDe(obj(0))).toBe(0)      // Agotado
    expect(enOferta(obj(5))).toBe(false)  // Espada Dardo
  })

  /* REGLA 2: lo INACTIVO no se muestra en la tienda, asi que
     tampoco se liquida, por mucho stock que tenga. */
  it('un objeto INACTIVO nunca esta en oferta', () => {
    expect(ofertaDe({ stock: 40, precio: 50, estado: 'INACTIVO' })).toBe(0)
  })
})

describe('precio anterior', () => {
  /* La cuenta va HACIA ARRIBA: el precio del producto ya es
     el rebajado (regla 8), y reconstruimos el de antes. */
  it('reconstruye lo que costaba antes de la rebaja', () => {
    expect(precioAntes(obj(40, 50))).toBe(67)      // 50 / 0.75
    expect(precioAntes(obj(25, 120))).toBe(160)    // Miruvor
    expect(precioAntes(obj(12, 900))).toBe(1000)   // Capa Elfica
    expect(precioAntes(obj(10, 1800))).toBe(2000)  // Hacha Enana
  })

  it('el precio anterior siempre es mayor que el vigente', () => {
    const producto = obj(40, 50)
    expect(precioAntes(producto)).toBeGreaterThan(producto.precio)
  })

  it('sin oferta no hay precio anterior', () => {
    expect(precioAntes(obj(5, 1500))).toBeNull()   // Espada Dardo
  })
})

describe('aguanta datos rotos', () => {
  it('no revienta con basura', () => {
    expect(ofertaDe(null)).toBe(0)
    expect(ofertaDe(undefined)).toBe(0)
    expect(ofertaDe({})).toBe(0)
    expect(precioAntes(null)).toBeNull()
  })
})
