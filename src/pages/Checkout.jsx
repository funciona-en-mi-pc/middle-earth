import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import { Link, useNavigate } from 'react-router-dom'

import CintaRegion from '../components/CintaRegion.jsx'
import { useAuth } from '../context/useAuth.js'
import { obtenerProducto } from '../services/productoService.js'
import {
  cantidadProductos,
  confirmarVenta,
  detallesDeVenta,
  totalVenta,
  ventaAbiertaDe,
} from '../services/ventaService.js'
import { formatearOro } from '../utils/formatos.js'
import { validarDireccion, validarEmail, validarNombre } from '../utils/validaciones.js'

/* Checkout — Anexo 1, vista "COMPRAR" (paso de pago)
   ---------------------------------------------------------
   EL PASO QUE FALTABA ENTRE EL CARRITO Y LA BOLETA
   Antes, "Confirmar compra" llamaba a confirmarVenta desde el
   carrito. El Anexo pide un paso intermedio: direccion de
   entrega, forma de envio y pago, y de ahi salen dos caminos,
   pago correcto o pago con error.

   LO QUE NO SE GUARDA, Y POR QUE
   La tabla VENTA del SQL no tiene direccion ni forma de pago.
   Antes que inventar columnas, estos datos se validan, se
   muestran en el resumen de la compra y ahi mueren. Si en la
   etapa 3 la API los pide, entran como campos de VENTA y
   esta pagina no cambia de forma.

   COMO SE PRUEBA EL PAGO FALLIDO
   Con el "Pagare de Isengard": siempre lo rechazan. Hace
   falta una forma honesta de llegar a la vista de error sin
   romper nada a proposito, y Saruman nunca paga sus deudas.

   AL FALLAR, EL CARRITO NO SE PIERDE
   La venta sigue ABIERTA y el stock sigue descontado, asi
   que desde la vista de error se vuelve a intentar.

   El formulario usa el mismo molde que Registro: un REGLAS
   con el validador de cada campo, y validar() lo recorre. */

const REGLAS = {
  nombre: validarNombre,
  email: validarEmail,
  direccion: validarDireccion,
}

/* Las mismas regiones que usa CintaRegion. */
const REINOS = [
  'La Comarca', 'Bree', 'Rivendel', 'Lothlorien', 'Erebor',
  'Rohan', 'Minas Tirith', 'Moria',
]

const ENTREGAS = [
  { id: 'mensajero', nombre: 'Mensajero de Rohan', detalle: 'Tres jornadas a caballo' },
  { id: 'aguilas', nombre: 'Aguilas de Manwe', detalle: 'Llega al amanecer' },
]

const PAGOS = [
  { id: 'oro', nombre: 'Oro de la Comarca', detalle: 'Monedas contantes y sonantes' },
  {
    id: 'pagare',
    nombre: 'Pagare de Isengard',
    detalle: 'Saruman jamas responde: este pago sera rechazado',
  },
]

function Checkout() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  /* NOTA DEL ANEXO: si el usuario inicio sesion, sus datos se
     rellenan solos. El carrito ya exige sesion de jugador. */
  const [campos, setCampos] = useState(() => ({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    direccion: '',
    reino: REINOS[0],
    entrega: ENTREGAS[0].id,
    pago: PAGOS[0].id,
  }))
  const [errores, setErrores] = useState({ nombre: '', email: '', direccion: '' })
  const [alerta, setAlerta] = useState(null)

  /* RutaProtegida ya exige sesion de jugador, pero la pagina
     se defiende sola por si se usa fuera de esa ruta. */
  if (!usuario || usuario.tipo !== 'JUGADOR') {
    return (
      <>
        <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="La casa del tesoro" />
        <Container fluid="xxl" className="px-3 px-lg-4">
          <header className="page-head"><h1>Pagar</h1></header>
          <Alert variant="danger">
            Para comprar, <Link to="/login?motivo=compra">inicia sesion</Link> como jugador.
          </Alert>
        </Container>
      </>
    )
  }

  const venta = ventaAbiertaDe(usuario.id)
  const lineas = venta ? detallesDeVenta(venta.ventaId) : []

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setCampos((previos) => ({ ...previos, [name]: value }))

    // Solo corregimos en vivo lo que ya estaba marcado en rojo
    if (errores[name]) {
      setErrores((previos) => ({ ...previos, [name]: REGLAS[name](value) }))
    }
  }

  const alSalirDelCampo = (evento) => {
    const { name, value } = evento.target
    if (!REGLAS[name]) return
    setErrores((previos) => ({ ...previos, [name]: REGLAS[name](value) }))
  }

  const alEnviar = (evento) => {
    evento.preventDefault()

    const revision = {}
    Object.keys(REGLAS).forEach((campo) => {
      revision[campo] = REGLAS[campo](campos[campo])
    })
    setErrores(revision)

    if (Object.values(revision).some((mensaje) => mensaje !== '')) {
      setAlerta({ tipo: 'danger', texto: 'Revisa los campos marcados antes de pagar.' })
      return
    }

    const entrega = ENTREGAS.find((e) => e.id === campos.entrega)
    const envio = { direccion: campos.direccion, reino: campos.reino, entrega: entrega.nombre }

    /* Camino del pago rechazado: la venta queda ABIERTA. */
    if (campos.pago === 'pagare') {
      navigate('/compra-fallida', {
        state: { error: 'El pagare de Isengard fue rechazado. Saruman no responde.', envio },
      })
      return
    }

    /* REGLA 5 y estado de la venta: el service manda. */
    const intento = confirmarVenta(venta.ventaId)
    if (!intento.ok) {
      navigate('/compra-fallida', { state: { error: intento.error, envio } })
      return
    }

    /* El ventaId va en la URL y no en el estado del router:
       asi la boleta sobrevive a recargar la pagina. */
    navigate(`/compra-exitosa/${venta.ventaId}`, { state: { envio } })
  }

  return (
    <>
      <CintaRegion region="minas-tirith" nombre="Minas Tirith" subtitulo="La casa del tesoro" />

      <Container fluid="xxl" className="px-3 px-lg-4">
        <header className="page-head">
          <p className="eyebrow">Ultimo paso</p>
          <h1>Pagar</h1>
          <p className="lede">Di adonde mandamos el encargo y cierra el trato.</p>
        </header>

        {lineas.length === 0 ? (
          <div className="empty-state">
            <p>No tienes nada que pagar.</p>
            <Link className="btn btn-oro" to="/catalogo">Ir al mercado</Link>
          </div>
        ) : (
          <Row className="g-4 pb-5">

            <Col lg={7}>
              <div className="form-card">
                <h2>Datos de entrega</h2>

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
                      autoComplete="email"
                    />
                    <Form.Control.Feedback type="invalid">{errores.email}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="field" controlId="direccion">
                    <Form.Label>Direccion <span className="req">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="direccion"
                      value={campos.direccion}
                      onChange={alEscribir}
                      onBlur={alSalirDelCampo}
                      isInvalid={errores.direccion !== ''}
                      maxLength={150}
                      placeholder="Bolson Cerrado 1, Hobbiton"
                    />
                    <Form.Control.Feedback type="invalid">{errores.direccion}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="field" controlId="reino">
                    <Form.Label>Reino</Form.Label>
                    <Form.Select name="reino" value={campos.reino} onChange={alEscribir}>
                      {REINOS.map((reino) => (
                        <option key={reino} value={reino}>{reino}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <fieldset className="field">
                    <legend>Forma de entrega</legend>
                    {ENTREGAS.map((opcion) => (
                      <Form.Check
                        key={opcion.id}
                        type="radio"
                        id={`entrega-${opcion.id}`}
                        name="entrega"
                        value={opcion.id}
                        checked={campos.entrega === opcion.id}
                        onChange={alEscribir}
                        label={`${opcion.nombre} — ${opcion.detalle}`}
                      />
                    ))}
                  </fieldset>

                  <fieldset className="field">
                    <legend>Forma de pago</legend>
                    {PAGOS.map((opcion) => (
                      <Form.Check
                        key={opcion.id}
                        type="radio"
                        id={`pago-${opcion.id}`}
                        name="pago"
                        value={opcion.id}
                        checked={campos.pago === opcion.id}
                        onChange={alEscribir}
                        label={`${opcion.nombre} — ${opcion.detalle}`}
                      />
                    ))}
                  </fieldset>

                  <div className="btn-row">
                    <Button type="submit" className="btn-oro">
                      Pagar {formatearOro(totalVenta(venta.ventaId))}
                    </Button>
                    <Link className="btn btn-linea" to="/carrito">Volver al carrito</Link>
                  </div>

                </Form>
              </div>
            </Col>

            <Col lg={5}>
              <div className="table-card p-3">
                <h2>Tu encargo</h2>

                <ul className="resumen-lineas">
                  {lineas.map((linea) => {
                    const producto = obtenerProducto(linea.productoId)

                    return (
                      <li key={linea.detalleId}>
                        <span>{producto ? producto.nombre : 'Objeto retirado'} x{linea.cantidad}</span>
                        <span className="num">
                          {formatearOro(linea.cantidad * linea.precioUnitario)}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <div className="carrito-resumen">
                  <div>
                    <span className="carrito-items">
                      {cantidadProductos(venta.ventaId)} objeto(s)
                    </span>
                    <span className="carrito-total">
                      <span className="coin" aria-hidden="true"></span>
                      {formatearOro(totalVenta(venta.ventaId))}
                    </span>
                  </div>
                </div>
              </div>
            </Col>

          </Row>
        )}
      </Container>
    </>
  )
}

export default Checkout
