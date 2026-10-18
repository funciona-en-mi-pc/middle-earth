import { claseRareza, nombreRareza, rarezaDe } from './rareza.js'

/* =========================================================
   Pruebas de rareza.js — Javier
   ---------------------------------------------------------
   La rareza se DERIVA del nivel requerido, que es un dato
   real del SQL. Estas pruebas fijan los tramos para que nadie
   los mueva sin darse cuenta.
   ========================================================= */

const obj = (nivelRequerido) => ({ nivelRequerido })

describe('rareza derivada del nivel', () => {
  it('nivel 1 a 5 es Comun', () => {
    expect(nombreRareza(obj(1))).toBe('Comun')    // Lembas, Miruvor
    expect(nombreRareza(obj(5))).toBe('Comun')    // Espada Dardo
  })

  it('nivel 6 a 14 es Raro', () => {
    expect(nombreRareza(obj(6))).toBe('Raro')
    expect(nombreRareza(obj(10))).toBe('Raro')    // Capa Elfica
    expect(nombreRareza(obj(14))).toBe('Raro')
  })

  it('nivel 15 a 24 es Epico', () => {
    expect(nombreRareza(obj(15))).toBe('Epico')   // Hacha Enana, Cota de Mithril
    expect(nombreRareza(obj(20))).toBe('Epico')   // Arco de los Galadhrim
    expect(nombreRareza(obj(24))).toBe('Epico')
  })

  it('nivel 25 o mas es Legendario', () => {
    expect(nombreRareza(obj(25))).toBe('Legendario')
    expect(nombreRareza(obj(40))).toBe('Legendario')   // Baston de Mago
  })

  it('devuelve la clase CSS que pinta el filo', () => {
    expect(claseRareza(obj(1))).toBe('rareza-comun')
    expect(claseRareza(obj(40))).toBe('rareza-legendario')
  })

  /* Si llega basura, no revienta: lo mas humilde */
  it('aguanta un producto sin nivel', () => {
    expect(nombreRareza({})).toBe('Comun')
    expect(nombreRareza(null)).toBe('Comun')
    expect(rarezaDe(undefined).clase).toBe('comun')
  })
})
