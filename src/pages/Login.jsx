import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Link, Navigate, useSearchParams } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { validarEmail, validarPassword } from '../utils/validaciones.js'

/* Iniciar sesion — DUENO: Javier · tarea #10
   ---------------------------------------------------------
   Un mismo formulario para jugadores y mercaderes. Al entrar,
   el jugador va a la tienda y el mercader al panel.

   LA GRAN DIFERENCIA CON EL MOCKUP
   Alla el JavaScript buscaba el input con getElementById y le
   pintaba el error encima. Aqui nadie toca el HTML: el valor
   y el error de cada campo viven en useState, y React vuelve
   a dibujar lo que cambio.

   A DONDE VA CADA UNO
   El jugador a la tienda y el mercader al panel. Lo decide el
   <Navigate> de mas abajo, no un navigate() a mano: asi la
   misma linea sirve para quien acaba de entrar y para quien
   ya tenia la sesion abierta.

   CUANDO SE VALIDA
     onBlur .... al salir del campo, siempre
     onChange .. mientras escribe, SOLO si ya estaba en rojo
     onSubmit .. todo de nuevo, antes de intentar entrar
   Asi no reganamos a nadie por la primera letra, pero el
   error desaparece en cuanto se corrige. */

/* Por que se llego aqui. Viaja en la URL: /login?motivo=... */
const MOTIVOS = {
  'entra-primero': 'Inicia sesion para continuar.',
  'sin-permiso': 'Tu cuenta no tiene permisos para entrar ahi.',
  'compra': 'Inicia sesion para terminar tu compra.',
}

function Login() {
  const { usuario, login } = useAuth()
  const [parametros] = useSearchParams()

  const [campos, setCampos] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({ email: '', password: '' })
  const [alerta, setAlerta] = useState(() => {
    const motivo = parametros.get('motivo')
    return motivo && MOTIVOS[motivo] ? { tipo: 'danger', texto: MOTIVOS[motivo] } : null
  })

  /* Este if hace DOS cosas:
       1. Si ya habia sesion, el login no tiene sentido.
       2. Cuando el login sale bien, `usuario` cambia, esta
          pagina se vuelve a dibujar y el redirect lleva a cada
          uno a su sitio: jugador a la tienda, mercader al
          panel.
     `replace` evita que el boton "atras" vuelva al login. */
  if (usuario) {
    return <Navigate to={usuario.tipo === 'MERCADER' ? '/admin' : '/'} replace />
  }

  const validarCampo = (nombre, valor) => (
    nombre === 'email' ? validarEmail(valor) : validarPassword(valor)
  )

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setCampos((previos) => ({ ...previos, [name]: value }))

    // Solo corregimos en vivo lo que ya estaba marcado en rojo
    if (errores[name]) {
      setErrores((previos) => ({ ...previos, [name]: validarCampo(name, value) }))
    }
  }

  const alSalirDelCampo = (evento) => {
    const { name, value } = evento.target
    setErrores((previos) => ({ ...previos, [name]: validarCampo(name, value) }))
  }

  const alEnviar = (evento) => {
    evento.preventDefault()   // sin esto el navegador recargaria la pagina

    /* Primero la forma: parece un correo, tiene el largo
       correcto. Despues el fondo: existe esa cuenta. */
    const revision = {
      email: validarEmail(campos.email),
      password: validarPassword(campos.password),
    }
    setErrores(revision)

    if (revision.email || revision.password) {
      setAlerta({ tipo: 'danger', texto: 'Revisa los campos marcados antes de continuar.' })
      return
    }

    const intento = login(campos.email.trim(), campos.password)

    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    /* Entro bien. No hace falta redirigir aqui: al cambiar el
       usuario del contexto, el <Navigate> de arriba se encarga. */
  }

  return (
    <>
      <CintaRegion region="moria" nombre="Puertas de Durin" subtitulo="Habla, amigo, y entra" />

      {/* form-wrap centra la tarjeta y le pone un ancho maximo
          de 560 px: en el celular ocupa todo, en el computador
          no se estira. Es responsivo sin media queries. */}
      <div className="form-wrap">

        <div className="form-logo">
          <div className="sigil-big" aria-hidden="true"></div>
          <h2>Middle Earth</h2>
          <p className="form-logo-sub">The Lost Age</p>
        </div>

        <div className="form-card">
          <h1>Iniciar sesion</h1>
          <p className="lede">Vuelve al reino con tus heroes donde los dejaste.</p>

          {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

          {/* noValidate apaga los mensajes del navegador: los
              nuestros estan en espanol y son mas claros. */}
          <Form noValidate onSubmit={alEnviar}>

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
                placeholder="aragorn@gondor.me"
                autoComplete="email"
              />
              {/* isInvalid pinta el borde rojo y destapa este
                  mensaje. Es el equivalente de la clase
                  .invalid que ponia el mockup a mano. */}
              <Form.Control.Feedback type="invalid">{errores.email}</Form.Control.Feedback>
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
                autoComplete="current-password"
              />
              <Form.Text>Entre 4 y 10 caracteres</Form.Text>
              <Form.Control.Feedback type="invalid">{errores.password}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" className="btn-oro w-100">Entrar al reino</Button>
          </Form>

          <p className="form-foot">
            Aun no tienes cuenta? <Link to="/registro">Crea tu heroe</Link>
          </p>
        </div>

      </div>
    </>
  )
}

export default Login
