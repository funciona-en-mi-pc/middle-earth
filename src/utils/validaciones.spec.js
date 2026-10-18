import {
  DIRECCION_MAX,
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  sinErrores,
  validarConfirmacion,
  validarDireccion,
  validarEmail,
  validarNivel,
  validarNombre,
  validarPassword,
  validarPrecio,
  validarStock,
} from './validaciones.js'

/* =========================================================
   Pruebas de validaciones.js — Javier, tarea #19
   ---------------------------------------------------------
   Son funciones puras, asi que se prueban solas: no hace
   falta dibujar nada ni tocar localStorage.

   Cada describe cubre una funcion, y dentro hay un it por
   cada camino: el caso valido, cada motivo de error y los
   bordes (el largo justo, el cero).
   ========================================================= */

describe('validarEmail', () => {
  it('acepta los correos del SQL', () => {
    expect(validarEmail('aragorn@gondor.me')).toBe('')
    expect(validarEmail('frodo@comarca.me')).toBe('')
    expect(validarEmail('elrond@rivendel.me')).toBe('')
  })

  it('no acepta cualquier dominio mientras tenga forma de correo', () => {
    expect(validarEmail('alguien@duocuc.cl')).toBe('')
    expect(validarEmail('alguien@gmail.com')).toBe('')
  })

  it('exige el correo', () => {
    expect(validarEmail('')).toBe('El correo es obligatorio.')
    expect(validarEmail('   ')).toBe('El correo es obligatorio.')
    expect(validarEmail(null)).toBe('El correo es obligatorio.')
  })

  it('rechaza lo que no tiene forma de correo', () => {
    const mensaje = 'Escribe un correo valido, por ejemplo aragorn@gondor.me'
    expect(validarEmail('aragorn.me')).toBe(mensaje)       // sin arroba
    expect(validarEmail('@gondor.me')).toBe(mensaje)       // sin nada delante
    expect(validarEmail('aragorn@gondor')).toBe(mensaje)   // sin punto
    expect(validarEmail('ara gorn@gondor.me')).toBe(mensaje) // con espacio
  })

  it('respeta el largo maximo de la columna del SQL', () => {
    const justo = 'a'.repeat(EMAIL_MAX - 5) + '@a.me'      // exactamente 120
    const pasado = 'a'.repeat(EMAIL_MAX - 4) + '@a.me'     // 121

    expect(justo.length).toBe(EMAIL_MAX)
    expect(validarEmail(justo)).toBe('')
    expect(validarEmail(pasado)).toBe(`El correo no puede superar los ${EMAIL_MAX} caracteres.`)
  })

  it('ignora los espacios de los lados', () => {
    expect(validarEmail('  aragorn@gondor.me  ')).toBe('')
  })
})


describe('validarPassword', () => {
  it('acepta una contrasena del largo correcto', () => {
    expect(validarPassword('aragorn123')).toBe('')
    expect(validarPassword('1234')).toBe('')           // el minimo justo
    expect(validarPassword('1234567890')).toBe('')     // el maximo justo
  })

  it('exige la contrasena', () => {
    expect(validarPassword('')).toBe('La contrasena es obligatoria.')
  })

  it('rechaza las muy cortas y las muy largas', () => {
    expect(validarPassword('abc')).toBe(`La contrasena debe tener al menos ${PASSWORD_MIN} caracteres.`)
    expect(validarPassword('12345678901')).toBe(`La contrasena no puede superar los ${PASSWORD_MAX} caracteres.`)
  })

  it('cuenta los espacios como caracteres', () => {
    expect(validarPassword('    ')).toBe('')   // cuatro espacios son validos
  })
})


describe('validarNombre', () => {
  it('acepta un nombre normal', () => {
    expect(validarNombre('Samsagaz Gamyi')).toBe('')
  })

  it('exige el nombre', () => {
    expect(validarNombre('   ')).toBe('El nombre es obligatorio.')
  })

  it('rechaza mas de 100 caracteres', () => {
    expect(validarNombre('a'.repeat(101))).toBe('El nombre no puede superar los 100 caracteres.')
  })
})


describe('validarConfirmacion', () => {
  it('acepta dos contrasenas iguales', () => {
    expect(validarConfirmacion('aragorn123', 'aragorn123')).toBe('')
  })

  it('exige repetir la contrasena', () => {
    expect(validarConfirmacion('', 'aragorn123')).toBe('Confirma la contrasena.')
  })

  it('avisa cuando no coinciden', () => {
    expect(validarConfirmacion('aragorn123', 'aragorn124')).toBe('Las contrasenas no coinciden.')
  })
})


/* CHECK (nivel > 0) de la tabla JUGADOR */
describe('validarNivel', () => {
  it('acepta un entero mayor que cero', () => {
    expect(validarNivel(1)).toBe('')
    expect(validarNivel(25)).toBe('')
    expect(validarNivel('50')).toBe('')   // desde un formulario llega texto
  })

  it('rechaza el cero y los negativos', () => {
    expect(validarNivel(0)).toBe('El nivel debe ser mayor que cero.')
    expect(validarNivel(-3)).toBe('El nivel debe ser mayor que cero.')
  })

  it('rechaza los decimales y lo que no es numero', () => {
    expect(validarNivel(2.5)).toBe('El nivel debe ser un numero entero.')
    expect(validarNivel('alto')).toBe('El nivel debe ser un numero.')
  })
})


/* CHECK (precio > 0) de la tabla PRODUCTO */
describe('validarPrecio', () => {
  it('acepta precios validos, con o sin decimales', () => {
    expect(validarPrecio(1500)).toBe('')
    expect(validarPrecio(0.5)).toBe('')
  })

  it('rechaza el cero y los negativos', () => {
    expect(validarPrecio(0)).toBe('El precio debe ser mayor que cero.')
    expect(validarPrecio(-100)).toBe('El precio debe ser mayor que cero.')
  })
})


/* CHECK (stock >= 0): aqui el cero SI vale, porque un
   producto nuevo nace con stock 0 */
describe('validarStock', () => {
  it('acepta el cero', () => {
    expect(validarStock(0)).toBe('')
  })

  it('rechaza los negativos y los decimales', () => {
    expect(validarStock(-1)).toBe('El stock no puede ser negativo.')
    expect(validarStock(2.5)).toBe('El stock debe ser un numero entero.')
  })
})


describe('sinErrores', () => {
  it('es true cuando todos los mensajes estan vacios', () => {
    expect(sinErrores({ email: '', password: '' })).toBe(true)
  })

  it('es false si queda aunque sea un mensaje', () => {
    expect(sinErrores({ email: '', password: 'La contrasena es obligatoria.' })).toBe(false)
  })
})


describe('validarDireccion', () => {
  it('acepta una direccion normal', () => {
    expect(validarDireccion('Bolson Cerrado 1, Hobbiton')).toBe('')
  })

  it('la exige', () => {
    expect(validarDireccion('')).toBe('La direccion de entrega es obligatoria.')
    expect(validarDireccion('   ')).toBe('La direccion de entrega es obligatoria.')
    expect(validarDireccion(null)).toBe('La direccion de entrega es obligatoria.')
  })

  it('rechaza una direccion demasiado corta', () => {
    expect(validarDireccion('ahi')).toBe('Escribe una direccion mas completa.')
  })

  it('rechaza una direccion demasiado larga', () => {
    expect(validarDireccion('a'.repeat(DIRECCION_MAX + 1)))
      .toBe(`La direccion no puede superar los ${DIRECCION_MAX} caracteres.`)
  })
})
