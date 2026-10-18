import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'

import { useAuth } from '../../context/useAuth.js'
import {
  CARGOS,
  actualizarMercader,
  crearMercader,
  eliminarMercader,
  listarMercaderes,
  ventasDeMercader,
} from '../../services/mercaderService.js'
import { validarEmail, validarNombre, validarPassword } from '../../utils/validaciones.js'

/* Panel · Mercaderes — DUENO: Javier · tarea #44
   ---------------------------------------------------------
   El CRUD de la tabla MERCADER: quien atiende la tienda.

   DOS COLUMNAS QUE EL SQL NO TIENE
   MERCADER no tiene `email` ni `password`, pero el login las
   necesita. Se agregaron en el frontend y quedan anotadas
   como cambio pendiente de la base de datos para la etapa 3.

   LOS TRES CARGOS
     ADMINISTRADOR ... manda en todo el panel
     HERRERO ......... repone stock, que es su oficio
     VENDEDOR ........ atiende ventas, pero solo mira el panel

   DOS PROTECCIONES
     REGLA 9: quien atendio ventas no se borra, se deja
     INACTIVO, porque se perderia el historial.

     Y una que el SQL no tiene: nunca se puede dejar el reino
     sin ningun ADMINISTRADOR activo. Si no, nadie podria
     volver a administrar nada. */

const VACIO = { nombre: '', email: '', cargo: '', password: '', estado: 'ACTIVO' }

function AdminMercaderes() {
  const { usuario } = useAuth()
  const puedeTocar = usuario.cargo === 'ADMINISTRADOR'

  const [alerta, setAlerta] = useState(null)
  const [editando, setEditando] = useState(null)
  const [campos, setCampos] = useState(VACIO)
  const [errores, setErrores] = useState(VACIO)

  const mercaderes = listarMercaderes()

  const abrirNuevo = () => {
    setCampos(VACIO)
    setErrores(VACIO)
    setEditando('nuevo')
  }

  const abrirEdicion = (mercader) => {
    setCampos({
      nombre: mercader.nombre,
      email: mercader.email,
      cargo: mercader.cargo,
      password: '',                 // vacia = no se cambia
      estado: mercader.estado,
    })
    setErrores(VACIO)
    setEditando(mercader)
  }

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setCampos((previos) => ({ ...previos, [name]: value }))
  }

  const guardar = (evento) => {
    evento.preventDefault()
    const esNuevo = editando === 'nuevo'

    const revision = {
      nombre: validarNombre(campos.nombre),
      email: validarEmail(campos.email),
      cargo: campos.cargo === '' ? 'Elige un cargo.' : '',
      password: (esNuevo || campos.password !== '') ? validarPassword(campos.password) : '',
      estado: '',
    }
    setErrores(revision)
    if (Object.values(revision).some((m) => m !== '')) return

    const intento = esNuevo
      ? crearMercader(campos)
      : actualizarMercader(editando.mercaderId, campos)

    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    setAlerta({
      tipo: 'success',
      texto: esNuevo
        ? `${intento.mercader.nombre} creado como ${intento.mercader.cargo}.`
        : `${intento.mercader.nombre} actualizado.`,
    })
    setEditando(null)
  }

  const borrar = (mercader) => {
    const intento = eliminarMercader(mercader.mercaderId)
    setAlerta(intento.ok
      ? { tipo: 'success', texto: `${mercader.nombre} eliminado.` }
      : { tipo: 'danger', texto: intento.error })
  }

  const cambiarEstado = (mercader) => {
    const nuevo = mercader.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    const intento = actualizarMercader(mercader.mercaderId, { estado: nuevo })

    setAlerta(intento.ok
      ? { tipo: 'success', texto: `${mercader.nombre} ahora esta ${nuevo}.` }
      : { tipo: 'danger', texto: intento.error })
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Mercaderes</h1>
          <p className="lede">
            El personal de la tienda. Quien atendio ventas no se borra: se deja INACTIVO.
          </p>
        </div>
        {puedeTocar && (
          <Button className="btn-oro btn-sm" onClick={abrirNuevo}>Nuevo mercader</Button>
        )}
      </div>

      {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

      {!puedeTocar && (
        <Alert variant="danger">
          Solo un ADMINISTRADOR puede crear, editar o eliminar. Tu cargo es {usuario.cargo}.
        </Alert>
      )}

      <div className="table-card">
        <Table responsive hover className="mb-0">
          <thead>
            <tr>
              <th className="num">ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Cargo</th>
              <th className="num">Ventas</th>
              <th>Estado</th>
              {puedeTocar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {mercaderes.map((mercader) => (
              <tr key={mercader.mercaderId}>
                <td className="num">{mercader.mercaderId}</td>
                <td>{mercader.nombre}</td>
                <td>{mercader.email}</td>
                <td>{mercader.cargo}</td>
                <td className="num">{ventasDeMercader(mercader.mercaderId).length}</td>
                <td>
                  <Badge className={mercader.estado === 'ACTIVO' ? 'ok' : 'alerta'}>
                    {mercader.estado}
                  </Badge>
                </td>
                {puedeTocar && (
                  <td className="acciones">
                    <Button size="sm" className="btn-linea" onClick={() => abrirEdicion(mercader)}>
                      Editar
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => cambiarEstado(mercader)}>
                      {mercader.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => borrar(mercader)}>
                      Eliminar
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal show={editando !== null} onHide={() => setEditando(null)} centered>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>
            {editando === 'nuevo' ? 'Nuevo mercader' : `Editar ${editando?.nombre ?? ''}`}
          </Modal.Title>
        </Modal.Header>

        <Form noValidate onSubmit={guardar}>
          <Modal.Body>
            <Form.Group className="field" controlId="nombre">
              <Form.Label>Nombre <span className="req">*</span></Form.Label>
              <Form.Control
                name="nombre" value={campos.nombre} onChange={alEscribir}
                isInvalid={errores.nombre !== ''} maxLength={100}
              />
              <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="email">
              <Form.Label>Correo <span className="req">*</span></Form.Label>
              <Form.Control
                type="email" name="email" value={campos.email} onChange={alEscribir}
                isInvalid={errores.email !== ''} maxLength={120}
              />
              <Form.Control.Feedback type="invalid">{errores.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="cargo">
              <Form.Label>Cargo <span className="req">*</span></Form.Label>
              <Form.Select
                name="cargo" value={campos.cargo} onChange={alEscribir}
                isInvalid={errores.cargo !== ''}
              >
                <option value="">Elige un cargo</option>
                {CARGOS.map((cargo) => (
                  <option key={cargo} value={cargo}>{cargo}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errores.cargo}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="password">
              <Form.Label>
                Contrasena {editando === 'nuevo' && <span className="req">*</span>}
              </Form.Label>
              <Form.Control
                type="password" name="password" value={campos.password} onChange={alEscribir}
                isInvalid={errores.password !== ''} maxLength={10}
              />
              {editando !== 'nuevo' && (
                <Form.Text>Dejala vacia para no cambiarla.</Form.Text>
              )}
              <Form.Control.Feedback type="invalid">{errores.password}</Form.Control.Feedback>
            </Form.Group>

            {editando !== 'nuevo' && (
              <Form.Group className="field" controlId="estado">
                <Form.Label>Estado</Form.Label>
                <Form.Select name="estado" value={campos.estado} onChange={alEscribir}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button className="btn-linea" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button type="submit" className="btn-oro">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

export default AdminMercaderes
