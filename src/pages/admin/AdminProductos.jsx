import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Modal from 'react-bootstrap/Modal'
import Table from 'react-bootstrap/Table'

import { useAuth } from '../../context/useAuth.js'
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  listarCategorias,
  listarProductos,
  nombreCategoria,
} from '../../services/productoService.js'
import { formatearOro } from '../../utils/formatos.js'
import { validarNivel, validarNombre, validarPrecio } from '../../utils/validaciones.js'

/* Panel · Productos — DUENO: Jose · tarea #32
   ---------------------------------------------------------
   El CRUD del catalogo, con las reglas de SP_INSERTAR_PRODUCTO,
   SP_ACTUALIZAR_PRODUCTO y SP_ELIMINAR_PRODUCTO.

   TRES COSAS QUE NO SE PUEDEN HACER AQUI, Y POR QUE
     1. Editar el stock. Solo lo mueve inventarioService, para
        que todo cambio quede en MOVIMIENTO_STOCK. Se repone
        desde la pagina de movimientos.
     2. Borrar un producto con ventas o movimientos (regla 9):
        se perderia el historial. Se deja INACTIVO.
     3. Crear, editar o borrar si no eres ADMINISTRADOR.
        VENDEDOR y HERRERO miran, pero no tocan.

   Cambiar el precio o el estado deja rastro en la auditoria
   (regla 10). De eso se encarga actualizarProducto, no este
   formulario: asi nadie puede saltarselo.

   POR QUE NO HAY UN ESTADO CON LA LISTA
   Las filas se LEEN del service en cada dibujado. Despues de
   cada cambio llamamos a setAlerta, que ya provoca un nuevo
   dibujado, asi que la tabla sale con los datos frescos sin
   guardar nada ni forzar recargas. */

const VACIO = { nombre: '', categoriaId: '', precio: '', nivelRequerido: '' }

function AdminProductos() {
  const { usuario } = useAuth()
  const puedeTocar = usuario.cargo === 'ADMINISTRADOR'

  const [alerta, setAlerta] = useState(null)
  const [editando, setEditando] = useState(null)   // null = modal cerrado
  const [campos, setCampos] = useState(VACIO)
  const [errores, setErrores] = useState(VACIO)

  const productos = listarProductos()
  const categorias = listarCategorias()

  const abrirNuevo = () => {
    setCampos(VACIO)
    setErrores(VACIO)
    setEditando('nuevo')
  }

  const abrirEdicion = (producto) => {
    setCampos({
      nombre: producto.nombre,
      categoriaId: String(producto.categoriaId),
      precio: String(producto.precio),
      nivelRequerido: String(producto.nivelRequerido),
    })
    setErrores(VACIO)
    setEditando(producto)
  }

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setCampos((previos) => ({ ...previos, [name]: value }))
  }

  const guardar = (evento) => {
    evento.preventDefault()

    const revision = {
      nombre: validarNombre(campos.nombre),
      categoriaId: campos.categoriaId === '' ? 'Elige una categoria.' : '',
      precio: validarPrecio(campos.precio),
      nivelRequerido: validarNivel(campos.nivelRequerido),
    }
    setErrores(revision)
    if (Object.values(revision).some((m) => m !== '')) return

    const intento = editando === 'nuevo'
      ? crearProducto(campos)
      : actualizarProducto(editando.productoId, campos)

    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    setAlerta({
      tipo: 'success',
      texto: editando === 'nuevo'
        ? `${intento.producto.nombre} creado con stock 0. Reponlo desde Movimientos.`
        : `${intento.producto.nombre} actualizado.`,
    })
    setEditando(null)
  }

  /* REGLA 9: si tiene historial, no se borra */
  const borrar = (producto) => {
    const intento = eliminarProducto(producto.productoId)
    setAlerta(intento.ok
      ? { tipo: 'success', texto: `${producto.nombre} eliminado.` }
      : { tipo: 'danger', texto: intento.error })
  }

  /* Pasa por actualizarProducto para que quede auditado */
  const cambiarEstado = (producto) => {
    const nuevo = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    actualizarProducto(producto.productoId, { estado: nuevo })
    setAlerta({ tipo: 'success', texto: `${producto.nombre} ahora esta ${nuevo}.` })
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Productos</h1>
          <p className="lede">
            El catalogo del reino. El stock no se edita aqui: se repone desde Movimientos.
          </p>
        </div>
        {puedeTocar && (
          <Button className="btn-oro btn-sm" onClick={abrirNuevo}>Nuevo producto</Button>
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
              <th>Objeto</th>
              <th>Categoria</th>
              <th className="num">Precio</th>
              <th className="num">Stock</th>
              <th className="num">Nivel</th>
              <th>Estado</th>
              {puedeTocar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.productoId}>
                <td className="num">{producto.productoId}</td>
                <td>{producto.nombre}</td>
                <td>{nombreCategoria(producto.categoriaId)}</td>
                <td className="num">{formatearOro(producto.precio)}</td>
                <td className="num">{producto.stock}</td>
                <td className="num">{producto.nivelRequerido}</td>
                <td>
                  <Badge className={producto.estado === 'ACTIVO' ? 'ok' : 'alerta'}>
                    {producto.estado}
                  </Badge>
                </td>
                {puedeTocar && (
                  <td className="acciones">
                    <Button size="sm" className="btn-linea" onClick={() => abrirEdicion(producto)}>
                      Editar
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => cambiarEstado(producto)}>
                      {producto.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" className="btn-linea" onClick={() => borrar(producto)}>
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
            {editando === 'nuevo' ? 'Nuevo producto' : `Editar ${editando?.nombre ?? ''}`}
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

            <Form.Group className="field" controlId="categoriaId">
              <Form.Label>Categoria <span className="req">*</span></Form.Label>
              <Form.Select
                name="categoriaId" value={campos.categoriaId} onChange={alEscribir}
                isInvalid={errores.categoriaId !== ''}
              >
                <option value="">Elige una categoria</option>
                {categorias.map((c) => (
                  <option key={c.categoriaId} value={c.categoriaId}>{c.nombre}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errores.categoriaId}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="precio">
              <Form.Label>Precio en oro <span className="req">*</span></Form.Label>
              <Form.Control
                type="number" name="precio" value={campos.precio} onChange={alEscribir}
                isInvalid={errores.precio !== ''}
              />
              <Form.Control.Feedback type="invalid">{errores.precio}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="field" controlId="nivelRequerido">
              <Form.Label>Nivel requerido <span className="req">*</span></Form.Label>
              <Form.Control
                type="number" name="nivelRequerido" value={campos.nivelRequerido} onChange={alEscribir}
                isInvalid={errores.nivelRequerido !== ''}
              />
              <Form.Control.Feedback type="invalid">{errores.nivelRequerido}</Form.Control.Feedback>
            </Form.Group>

            {editando === 'nuevo' && (
              <Form.Text>
                El producto nace con stock 0. Se le da stock desde Movimientos, para que esa
                primera entrada quede en el historial.
              </Form.Text>
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

export default AdminProductos
