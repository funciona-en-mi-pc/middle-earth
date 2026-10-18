import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

/* =========================================================
   ConfirmarBorrado — la pregunta antes de un paso sin vuelta
   ---------------------------------------------------------
   DUENO: Javier · mejora de UX del Hito 4

   POR QUE EXISTE
   Antes, el boton "Eliminar" de las tablas del panel borraba
   en el acto. Un clic de mas y la fila se iba sin preguntar.
   Es el error de interfaz mas tipico en un CRUD, y el mas
   facil de evitar.

   POR QUE NO SE USA window.confirm()
   Porque sale con el aspecto del sistema operativo, no se
   puede estilar, bloquea el navegador y en las pruebas hay
   que interceptarlo. Un Modal de React Bootstrap se ve como
   el resto del reino y se prueba como cualquier componente.

   USO:
     <ConfirmarBorrado
       mostrar={aBorrar !== null}
       nombre={aBorrar?.nombre}
       queEs="jugador"
       onCancelar={() => setABorrar(null)}
       onConfirmar={borrarDeVerdad}
     />
   ========================================================= */

function ConfirmarBorrado({ mostrar, nombre, queEs, onCancelar, onConfirmar }) {
  return (
    <Modal show={mostrar} onHide={onCancelar} centered>
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title>Confirmar</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          Vas a eliminar {queEs} <strong>{nombre}</strong>.
        </p>
        <p className="lede mb-0">
          Esto no se puede deshacer. Si solo quieres sacarlo de circulacion,
          cierra esto y usa <strong>Inactivar</strong>: asi conserva su historial.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button className="btn-linea" onClick={onCancelar}>Cancelar</Button>
        {/* autoFocus en Cancelar, no en Eliminar: si alguien
            pulsa Enter sin leer, no borra nada. */}
        <Button className="btn-oro" onClick={onConfirmar}>Si, eliminar</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmarBorrado
