import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { crearJugador, listarRazas } from '../services/jugadorService.js'
import {
  validarConfirmacion,
  validarEmail,
  validarNombre,
  validarPassword,
} from '../utils/validaciones.js'

/* Crear cuenta — DUENO: Javier · tarea #18
   ---------------------------------------------------------
   Da de alta un JUGADOR, igual que SP_INSERTAR_JUGADOR.

   REGLA DEL SQL QUE SE RESPETA AQUI
   El registro publico crea SIEMPRE un jugador de nivel 1 y
   ACTIVO. Ni el nivel ni el estado se eligen: eso solo se
   toca desde el panel, donde ya hay un mercader con sesion.
   Los mercaderes tampoco se crean aqui (tarea #44).

   COMO ESTA HECHO
   Un solo useState con todos los campos y otro con todos los
   errores. REGLAS dice que validador le toca a cada campo, y
   asi validar() recorre el objeto entero sin repetir codigo.
   Agregar un campo nuevo es agregar una linea en REGLAS. */

/* La confirmacion necesita ademas el valor de la otra
   contrasena: por eso los validadores reciben (valor, campos). */
const REGLAS = {
  nombre: (valor) => validarNombre(valor),
  email: (valor) => validarEmail(valor),
  razaId: (valor) => (valor === '' ? 'Elige una raza.' : ''),
  password: (valor) => validarPassword(valor),
  password2: (valor, campos) => validarConfirmacion(valor, campos.password),
}

const VACIO = { nombre: '', email: '', razaId: '', password: '', password2: '' }

function Registro() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const razas = listarRazas()

  const [campos, setCampos] = useState(VACIO)
  const [errores, setErrores] = useState(VACIO)
  const [alerta, setAlerta] = useState(null)

  if (usuario) {
    return <Navigate to={usuario.tipo === 'MERCADER' ? '/admin' : '/'} replace />
  }

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    const siguientes = { ...campos, [name]: value }
    setCampos(siguientes)

    // Solo corregimos en vivo lo que ya estaba marcado en rojo
    if (errores[name]) {
      setErrores((previos) => ({ ...previos, [name]: REGLAS[name](value, siguientes) }))
    }
  }

  const alSalirDelCampo = (evento) => {
    const { name, value } = evento.target
    setErrores((previos) => ({ ...previos, [name]: REGLAS[name](value, campos) }))
  }

  const alEnviar = (evento) => {
    evento.preventDefault()

    /* Pasa todos los campos por su regla de una sola vez. */
    const revision = {}
    Object.keys(REGLAS).forEach((campo) => {
      revision[campo] = REGLAS[campo](campos[campo], campos)
    })
    setErrores(revision)

    if (Object.values(revision).some((mensaje) => mensaje !== '')) {
      setAlerta({ tipo: 'danger', texto: 'Revisa los campos marcados antes de continuar.' })
      return
    }

    const intento = crearJugador({
      nombre: campos.nombre,
      email: campos.email,
      razaId: campos.razaId,
      password: campos.password,
    })

    /* Correo repetido o raza inexistente: el service ya trae
       el mensaje escrito. */
    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    setAlerta({ tipo: 'success', texto: 'Cuenta creada. Ya puedes entrar al reino.' })
    setCampos(VACIO)
    setTimeout(() => navigate('/login'), 1200)
  }

  return (
    <>
      <CintaRegion region="bree" nombre="Bree" subtitulo="El Poney Pisador" />

      <div className="form-wrap">

        <div className="form-logo">
          <div className="sigil-big" aria-hidden="true"></div>
          <h2>Middle Earth</h2>
          <p className="form-logo-sub">The Lost Age</p>
        </div>

        <div className="form-card">
          <h1>Crear cuenta</h1>
          <p className="lede">Tu heroe empieza en el nivel 1. El resto se gana.</p>

          {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

          <Form noValidate onSubmit={alEnviar}>

            <Form.Group className="field" controlId="nombre">
              <Form.Label>Nombre <span className="req">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={campos.nombre}
                onChange={alEscribir}
                onBlur={alSalirDelCampo}
                isInvalid={errores.nombre !== ''}
                maxLength={100}
                placeholder="Samsagaz Gamyi"
              />
              <Form.Control.Feedback type="invalid">{errores.nombre}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="email">
              <Form.Label>Correo <span className="req">*</span></Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={campos.email}
                onChange={alEscribir}
                onBlur={alSalirDelCampo}
                isInvalid={errores.email !== ''}
                maxLength={120}
                placeholder="sam@comarca.me"
                autoComplete="email"
              />
              <Form.Control.Feedback type="invalid">{errores.email}</Form.Control.Feedback>
            </Form.Group>

            {/* Las razas salen de la tabla RAZA, no de una lista
                escrita a mano: si manana se agrega una, aparece
                sola. */}
            <Form.Group className="field" controlId="razaId">
              <Form.Label>Raza <span className="req">*</span></Form.Label>
              <Form.Select
                name="razaId"
                value={campos.razaId}
                onChange={alEscribir}
                onBlur={alSalirDelCampo}
                isInvalid={errores.razaId !== ''}
              >
                <option value="">Elige tu linaje</option>
                {razas.map((raza) => (
                  <option key={raza.razaId} value={raza.razaId}>{raza.nombre}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errores.razaId}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="password">
              <Form.Label>Contrasena <span className="req">*</span></Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={campos.password}
                onChange={alEscribir}
                onBlur={alSalirDelCampo}
                isInvalid={errores.password !== ''}
                maxLength={10}
                autoComplete="new-password"
              />
              <Form.Text>Entre 4 y 10 caracteres</Form.Text>
              <Form.Control.Feedback type="invalid">{errores.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="password2">
              <Form.Label>Repite la contrasena <span className="req">*</span></Form.Label>
              <Form.Control
                type="password"
                name="password2"
                value={campos.password2}
                onChange={alEscribir}
                onBlur={alSalirDelCampo}
                isInvalid={errores.password2 !== ''}
                maxLength={10}
                autoComplete="new-password"
              />
              <Form.Control.Feedback type="invalid">{errores.password2}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" className="btn-oro w-100">Crear mi heroe</Button>
          </Form>

          <p className="form-foot">
            Ya tienes cuenta? <Link to="/login">Entra al reino</Link>
          </p>
        </div>

      </div>
    </>
  )
}

export default Registro
