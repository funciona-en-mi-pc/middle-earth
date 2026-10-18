import { formatearFecha, formatearFechaHora, formatearNumero, formatearOro } from './formatos.js'

/* =========================================================
   Pruebas de formatos.js — Jose, tarea #12
   ---------------------------------------------------------
   El ejemplo mas simple: una funcion pura.

     describe .... agrupa pruebas de un mismo tema
     it .......... una prueba. Se lee como una frase:
                   "formatearOro agrega el separador de miles"
     expect ...... lo que se comprueba
   ========================================================= */

describe('formatearOro', () => {
  it('agrega el separador de miles y la palabra oro', () => {
    expect(formatearOro(1500)).toBe('1.500 oro')
  })

  it('funciona con precios de cuatro cifras o mas', () => {
    expect(formatearOro(5000)).toBe('5.000 oro')
  })

  it('no pone separador bajo mil', () => {
    expect(formatearOro(50)).toBe('50 oro')
  })

  it('devuelve 0 oro cuando el valor no es un numero', () => {
    expect(formatearOro('nada')).toBe('0 oro')
  })
})

describe('formatearNumero', () => {
  it('deja el cero tal cual', () => {
    expect(formatearNumero(0)).toBe('0')
  })
})

describe('formatearFecha', () => {
  it('muestra la fecha como dd/mm/aaaa', () => {
    expect(formatearFecha('2026-10-05T14:30:00.000Z')).toBe('05/10/2026')
  })

  it('devuelve texto vacio si no hay fecha', () => {
    expect(formatearFecha(null)).toBe('')
    expect(formatearFecha('')).toBe('')
  })

  it('devuelve texto vacio si la fecha es invalida', () => {
    expect(formatearFecha('esto no es una fecha')).toBe('')
  })
})

describe('formatearFechaHora', () => {
  it('agrega la hora a la fecha', () => {
    expect(formatearFechaHora('2026-10-05T14:30:00')).toBe('05/10/2026 14:30')
  })
})
