/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   auditoriaService.js — El rastro de los cambios
   ---------------------------------------------------------
   Es el equivalente del trigger TR_AUDITAR_PRODUCTO del SQL:

     AFTER UPDATE OF precio, estado ON PRODUCTO
     FOR EACH ROW

   REGLA 10: todo cambio de precio o de estado de un producto
   queda registrado, con el valor anterior, el nuevo, la fecha
   y quien lo hizo.

   POR QUE VIVE EN EL SERVICE Y NO EN LA PAGINA
   En Oracle, el trigger se dispara haga el UPDATE quien lo
   haga: ni el panel ni nadie puede saltarselo. Para imitar
   eso, quien llama a registrarCambio es
   productoService.actualizarProducto, no el formulario. Asi,
   cualquier parte de la aplicacion que cambie un producto
   deja su rastro, sin tener que acordarse.

   POR QUE SE COMPARA ANTES DE REGISTRAR
   El formulario manda siempre precio y estado, aunque solo se
   haya tocado uno. El trigger del SQL evita eso con
   IF NVL(:OLD.precio,-1) <> NVL(:NEW.precio,-1). Aqui se hace
   lo mismo: si el valor quedo igual, no se anota nada.

   EL USUARIO
   El SQL guarda USER, el usuario de Oracle. Aqui se guarda el
   correo del mercader con la sesion abierta, que es lo mas
   parecido que tenemos.
   ========================================================= */

import { usuarioActivo } from './authService.js'
import { CLAVES, guardar, leer, siguienteId } from './storage.js'


/* Los dos unicos campos auditados, igual que en el
   UPDATE OF precio, estado del trigger. Un cambio de stock no
   se audita: ese queda en MOVIMIENTO_STOCK. */
export const CAMPOS_AUDITADOS = ['precio', 'estado']


export function listarAuditoria({ productoId, campo } = {}) {
  let filas = leer(CLAVES.auditoria, [])

  if (productoId !== undefined && productoId !== null && productoId !== '') {
    filas = filas.filter((f) => f.productoId === Number(productoId))
  }
  if (campo) {
    filas = filas.filter((f) => f.campoModificado === campo.toUpperCase())
  }

  return filas
}

/* Escribe una fila de AUDITORIA_PRODUCTO.
   Devuelve true solo si de verdad registro algo, para poder
   comprobarlo en las pruebas. */
export function registrarCambio(productoId, campo, valorAnterior, valorNuevo) {
  /* Si no cambio nada, no hay nada que auditar. Se comparan
     como texto porque el formulario manda "1700" y la tabla
     guarda 1700. */
  if (String(valorAnterior) === String(valorNuevo)) return false

  const filas = leer(CLAVES.auditoria, [])
  const mercader = usuarioActivo()

  filas.push({
    auditoriaId: siguienteId(filas, 'auditoriaId'),
    productoId: Number(productoId),
    fechaCambio: new Date().toISOString(),
    usuarioBd: mercader ? mercader.email : 'sistema',
    campoModificado: String(campo).toUpperCase(),
    valorAnterior: String(valorAnterior),
    valorNuevo: String(valorNuevo),
  })

  guardar(CLAVES.auditoria, filas)
  return true
}

/* Compara el producto de antes con el de despues y registra
   cada campo auditado que haya cambiado. Devuelve cuantas
   filas escribio. */
export function auditarCambios(productoId, antes, despues) {
  return CAMPOS_AUDITADOS
    .filter((campo) => registrarCambio(productoId, campo, antes[campo], despues[campo]))
    .length
}
