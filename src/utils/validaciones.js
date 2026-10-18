/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   validaciones.js — Las reglas de los formularios
   ---------------------------------------------------------
   TODAS LAS FUNCIONES SIGUEN EL MISMO CONTRATO
     reciben un valor
     devuelven '' si esta bien
     devuelven el mensaje de error si esta mal

   Son funciones PURAS: no tocan la pantalla, no leen el DOM y
   no guardan nada. Solo miran lo que reciben y responden. Eso
   trae dos ventajas:

     1. La pagina decide que hacer con el mensaje (React lo
        pinta solo al cambiar el estado). En el mockup, en
        cambio, la funcion buscaba el input y le pintaba el
        error encima.
     2. Se pueden probar sin navegador:
        expect(validarEmail('')).toBe('El correo es obligatorio.')

   Las reglas van arriba como constantes, para cambiarlas en
   un solo sitio y para que el codigo se lea como el enunciado.
   Los largos maximos son los de las columnas del SQL.
   ========================================================= */

export const EMAIL_MAX = 120     // JUGADOR.email VARCHAR2(120)
export const NOMBRE_MAX = 100    // JUGADOR.nombre VARCHAR2(100)
export const PASSWORD_MIN = 4
export const PASSWORD_MAX = 10

/* algo + @ + algo + . + algo, sin espacios. Deliberadamente
   simple: el enunciado pide validacion basica y asi entran
   los correos del SQL (aragorn@gondor.me, frodo@comarca.me). */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ?? '' cubre null y undefined; String() cubre los numeros que
   llegan de un input de tipo number. */
function limpiar(valor) {
  return String(valor ?? '').trim()
}


export function validarEmail(valor) {
  const texto = limpiar(valor)

  if (texto === '') return 'El correo es obligatorio.'
  if (texto.length > EMAIL_MAX) return `El correo no puede superar los ${EMAIL_MAX} caracteres.`
  if (!FORMATO_EMAIL.test(texto)) return 'Escribe un correo valido, por ejemplo aragorn@gondor.me'

  return ''
}

/* Sin limpiar(): en una contrasena los espacios cuentan como
   caracter, asi que no se recortan. */
export function validarPassword(valor) {
  const texto = String(valor ?? '')

  if (texto === '') return 'La contrasena es obligatoria.'
  if (texto.length < PASSWORD_MIN) return `La contrasena debe tener al menos ${PASSWORD_MIN} caracteres.`
  if (texto.length > PASSWORD_MAX) return `La contrasena no puede superar los ${PASSWORD_MAX} caracteres.`

  return ''
}

export function validarNombre(valor) {
  const texto = limpiar(valor)

  if (texto === '') return 'El nombre es obligatorio.'
  if (texto.length > NOMBRE_MAX) return `El nombre no puede superar los ${NOMBRE_MAX} caracteres.`

  return ''
}

/* La unica que necesita dos valores: el repetido y el original. */
export function validarConfirmacion(valor, original) {
  if (String(valor ?? '') === '') return 'Confirma la contrasena.'
  if (String(valor ?? '') !== String(original ?? '')) return 'Las contrasenas no coinciden.'

  return ''
}

/* JUGADOR.nivel: CHECK (nivel > 0) */
export function validarNivel(valor) {
  const texto = limpiar(valor)
  if (texto === '') return 'El nivel es obligatorio.'

  const numero = Number(texto)
  if (Number.isNaN(numero)) return 'El nivel debe ser un numero.'
  if (!Number.isInteger(numero)) return 'El nivel debe ser un numero entero.'
  if (numero <= 0) return 'El nivel debe ser mayor que cero.'

  return ''
}

/* PRODUCTO.precio: CHECK (precio > 0) */
export function validarPrecio(valor) {
  const texto = limpiar(valor)
  if (texto === '') return 'El precio es obligatorio.'

  const numero = Number(texto)
  if (Number.isNaN(numero)) return 'El precio debe ser un numero.'
  if (numero <= 0) return 'El precio debe ser mayor que cero.'

  return ''
}

/* PRODUCTO.stock: CHECK (stock >= 0). El cero si vale: un
   producto nuevo nace con stock 0 y lo recibe con una
   reposicion, para que todo quede en el historial. */
export function validarStock(valor) {
  const texto = limpiar(valor)
  if (texto === '') return 'El stock es obligatorio.'

  const numero = Number(texto)
  if (Number.isNaN(numero)) return 'El stock debe ser un numero.'
  if (!Number.isInteger(numero)) return 'El stock debe ser un numero entero.'
  if (numero < 0) return 'El stock no puede ser negativo.'

  return ''
}

/* Atajo para los formularios: recibe un objeto de errores y
   dice si estan todos vacios. */
export function sinErrores(errores) {
  return Object.values(errores).every((mensaje) => mensaje === '')
}
