import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'

import ConfirmarBorrado from '../../components/ConfirmarBorrado.jsx'
import { useAuth } from '../../context/useAuth.js'
import {
  actualizarJugador,
  crearJugador,
  eliminarJugador,
  listarJugadores,
  listarRazas,
  nombreRaza,
  ventasDeJugador,
} from '../../services/jugadorService.js'
import {
  validarEmail,
  validarNivel,
  validarNombre,
  validarPassword,
} from '../../utils/validaciones.js'

/* Panel · Jugadores — DUENO: Javier · tarea #28
   ---------------------------------------------------------
   El CRUD de la tabla JUGADOR, con las reglas de
   SP_INSERTAR_JUGADOR, SP_ACTUALIZAR_JUGADOR y
   SP_ELIMINAR_JUGADOR.

   LA DIFERENCIA CON EL REGISTRO PUBLICO
   En /registro el jugador nace siempre en nivel 1 y ACTIVO, y
   no puede elegir otra cosa. Aqui el mercader SI decide el
   nivel y el estado, porque ya hay alguien con permisos
   dentro. Es la misma distincion que hace el SQL entre el
   alta normal y la del panel.

   REGLA 9: un jugador con ventas NO se borra, porque se
   perderia su historial de compras. Se deja INACTIVO, que lo
   saca de las ventas nuevas sin borrar su pasado.

   Solo el ADMINISTRADOR crea, edita y borra. VENDEDOR y
   HERRERO miran.

   Las filas se leen del service en cada dibujado: despues de
   cada cambio, el setAlerta ya provoca el redibujado. */

const VACIO = { nombre: '', email: '', razaId: '', nivel: '', password: '', estado: 'ACTIVO' }

function AdminJugadores() {
  const { usuario } = useAuth()
  const puedeTocar = usuario.cargo === 'ADMINISTRADOR'

  const [alerta, setAlerta] = useState(null)
  const [aBorrar, setABorrar] = useState(null)   // null = nadie en la mira
  const [editando, setEditando] = useState(null)   // null = modal cerrado
  const [campos, setCampos] = useState(VACIO)
  const [errores, setErrores] = useState(VACIO)

  const jugadores = listarJugadores()
  const razas = listarRazas()

  const abrirNuevo = () => {
    setCampos(VACIO)
    setErrores(VACIO)
    setEditando('nuevo')
  }

  const abrirEdicion = (jugador) => {
    setCampos({
      nombre: jugador.nombre,
      email: jugador.email,
      razaId: String(jugador.razaId),
      nivel: String(jugador.nivel),
      password: '',                // vacia = no se cambia
      estado: jugador.estado,
    })
    setErrores(VACIO)
    setEditando(jugador)
  }

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setCampos((previos) => ({ ...previos, [name]: value }))
  }

  const guardar = (evento) => {
    evento.preventDefault()
    const esNuevo = editando === 'nuevo'

    /* Al editar, la contrasena vacia significa "no la
       cambies", asi que solo se valida si escribieron algo. */
    const revision = {
      nombre: validarNombre(campos.nombre),
      email: validarEmail(campos.email),
      razaId: campos.razaId === '' ? 'Elige una raza.' : '',
      nivel: esNuevo ? '' : validarNivel(campos.nivel),
      password: (esNuevo || campos.password !== '') ? validarPassword(campos.password) : '',
      estado: '',
    }
    setErrores(revision)
    if (Object.values(revision).some((m) => m !== '')) return

    const intento = esNuevo
      ? crearJugador(campos)
      : actualizarJugador(editando.jugadorId, campos)

    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    setAlerta({
      tipo: 'success',
      texto: esNuevo
        ? `${intento.jugador.nombre} creado en nivel ${intento.jugador.nivel}.`
        : `${intento.jugador.nombre} actualizado.`,
    })
    setEditando(null)
  }

  /* REGLA 9: si tiene ventas, no se borra */
  /* Borrar es en dos pasos: primero se pregunta, y solo
     despues se borra. Ver ConfirmarBorrado. */
  const borrar = () => {
    const jugador = aBorrar
    setABorrar(null)

    const intento = eliminarJugador(jugador.jugadorId)
    setAlerta(intento.ok
      ? { tipo: 'success', texto: `${jugador.nombre} eliminado.` }
      : { tipo: 'danger', texto: intento.error })
  }

  const cambiarEstado = (jugador) => {
    const nuevo = jugador.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    actualizarJugador(jugador.jugadorId, { estado: nuevo })
    setAlerta({ tipo: 'success', texto: `${jugador.nombre} ahora esta ${nuevo}.` })
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Jugadores</h1>
          <p className="lede">
            Los heroes del reino. Quien ya compro no se borra: se deja INACTIVO.
          </p>
        </div>
        {puedeTocar && (
          <Button className="btn-oro btn-sm" onClick={abrirNuevo}>Nuevo jugador</Button>
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
              <th>Raza</th>
              <th className="num">Nivel</th>
              <th className="num">Compras</th>
              <th>Estado</th>
              {puedeTocar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {jugadores.map((jugador) => (
              <tr key={jugador.jugadorId}>
                <td className="num">{jugador.jugadorId}</td>
                <td>{jugador.nombre}</td>
                <td>{jugador.email}</td>
                <td>{nombreRaza(jugador.razaId)}</td>
                <td className="num">{jugador.nivel}</td>
                <td className="num">{ventasDeJugador(jugador.jugadorId).length}</td>
                <td>
                  <Badge className={jugador.estado === 'ACTIVO' ? 'ok' : 'alerta'}>
                    {jugador.estado}
                  </Badge>
                </td>
                {puedeTocar && (
                  <td className="acciones">
                    <Button size="sm" className="btn-linea" onClick={() => abrirEdicion(jugador)}>
                      Editar
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => cambiarEstado(jugador)}>
                      {jugador.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => setABorrar(jugador)}>
                      Eliminar
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <ConfirmarBorrado
        mostrar={aBorrar !== null}
        nombre={aBorrar?.nombre}
        queEs="el jugador"
        onCancelar={() => setABorrar(null)}
        onConfirmar={borrar}
      />

      <Modal show={editando !== null} onHide={() => setEditando(null)} centered>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>
            {editando === 'nuevo' ? 'Nuevo jugador' : `Editar ${editando?.nombre ?? ''}`}
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

            <Form.Group className="field" controlId="razaId">
              <Form.Label>Raza <span className="req">*</span></Form.Label>
              <Form.Select
                name="razaId" value={campos.razaId} onChange={alEscribir}
                isInvalid={errores.razaId !== ''}
              >
                <option value="">Elige una raza</option>
                {razas.map((r) => (
                  <option key={r.razaId} value={r.razaId}>{r.nombre}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errores.razaId}</Form.Control.Feedback>
            </Form.Group>

            {/* El nivel solo se toca al editar: uno nuevo nace
                en 1, igual que en el registro publico. */}
            {editando !== 'nuevo' && (
              <Form.Group className="field" controlId="nivel">
                <Form.Label>Nivel <span className="req">*</span></Form.Label>
                <Form.Control
                  type="number" name="nivel" value={campos.nivel} onChange={alEscribir}
                  isInvalid={errores.nivel !== ''}
                />
                <Form.Control.Feedback type="invalid">{errores.nivel}</Form.Control.Feedback>
              </Form.Group>
            )}

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

            {editando === 'nuevo' && (
              <Form.Text>El jugador nace en nivel 1 y ACTIVO.</Form.Text>
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

export default AdminJugadores
