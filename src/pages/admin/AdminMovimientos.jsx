import { useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Table from 'react-bootstrap/Table'

import { useAuth } from '../../context/useAuth.js'
import { listarMovimientos, reponerStock } from '../../services/inventarioService.js'
import { listarProductos } from '../../services/productoService.js'
import { formatearFechaHora } from '../../utils/formatos.js'
import { validarStock } from '../../utils/validaciones.js'

/* Panel · Movimientos de stock — DUENO: Jose · tarea #42
   ---------------------------------------------------------
   La tabla MOVIMIENTO_STOCK: el historial completo de
   entradas y salidas del almacen.

   PARA QUE SIRVE ESTA PAGINA EN LA PRESENTACION
   Demuestra la regla de diseno mas importante del proyecto:
   el stock no cambia "por arte de magia". Cada unidad que
   entra o sale tiene su fila, con su motivo y, si vino de una
   venta, con el numero de esa venta.

   Filtrando por un producto se ve su trazabilidad completa,
   que es la prueba 17 del script SQL: la SALIDA por la venta
   y la ENTRADA por la anulacion.

   REPONER STOCK
   Es PKG_INVENTARIO.REPONER_STOCK, el trabajo del herrero.
   Suma unidades y deja una ENTRADA sin venta asociada. Es
   tambien la forma de darle stock a un producto nuevo, que
   nace en 0 justamente para que esa primera entrada quede
   registrada.

   POR QUE NO HAY UN ESTADO CON LA LISTA
   Las filas se LEEN del service en cada dibujado. Despues de
   cada cambio llamamos a setAlerta, que ya provoca un nuevo
   dibujado, asi que la tabla sale con los datos frescos sin
   guardar nada ni forzar recargas. */

const TIPOS = ['ENTRADA', 'SALIDA']

function AdminMovimientos() {
  const { usuario } = useAuth()
  const puedeTocar = usuario.cargo === 'ADMINISTRADOR' || usuario.cargo === 'HERRERO'

  const [filtroProducto, setFiltroProducto] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [alerta, setAlerta] = useState(null)
  const [reposicion, setReposicion] = useState({ productoId: '', cantidad: '' })
  const [errores, setErrores] = useState({ productoId: '', cantidad: '' })

  const productos = listarProductos()
  const movimientos = listarMovimientos({
    productoId: filtroProducto === '' ? undefined : filtroProducto,
    tipo: filtroTipo === '' ? undefined : filtroTipo,
  })

  const nombreProducto = (id) => {
    const producto = productos.find((p) => p.productoId === id)
    return producto ? producto.nombre : `#${id}`
  }

  const alEscribir = (evento) => {
    const { name, value } = evento.target
    setReposicion((previa) => ({ ...previa, [name]: value }))
  }

  const reponer = (evento) => {
    evento.preventDefault()

    const revision = {
      productoId: reposicion.productoId === '' ? 'Elige un objeto.' : '',
      /* El SQL exige cantidad > 0 (error -20002), asi que el
         cero no vale aunque validarStock lo acepte. */
      cantidad: validarStock(reposicion.cantidad) ||
        (Number(reposicion.cantidad) <= 0 ? 'La cantidad debe ser mayor que cero.' : ''),
    }
    setErrores(revision)
    if (revision.productoId || revision.cantidad) return

    const intento = reponerStock(reposicion.productoId, reposicion.cantidad)
    if (!intento.ok) {
      setAlerta({ tipo: 'danger', texto: intento.error })
      return
    }

    setAlerta({
      tipo: 'success',
      texto: `${intento.producto.nombre} quedo con ${intento.producto.stock} unidades.`,
    })
    setReposicion({ productoId: '', cantidad: '' })
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Movimientos de stock</h1>
          <p className="lede">
            Cada unidad que entra o sale del almacen deja su rastro aqui.
          </p>
        </div>
      </div>

      {alerta && <Alert variant={alerta.tipo}>{alerta.texto}</Alert>}

      {puedeTocar ? (
        <Form noValidate onSubmit={reponer} className="form-linea">
          <Form.Group controlId="productoId">
            <Form.Label>Reponer objeto</Form.Label>
            <Form.Select
              name="productoId" value={reposicion.productoId} onChange={alEscribir}
              isInvalid={errores.productoId !== ''}
            >
              <option value="">Elige un objeto</option>
              {productos.map((p) => (
                <option key={p.productoId} value={p.productoId}>
                  {p.nombre} (stock {p.stock})
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errores.productoId}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="cantidad">
            <Form.Label>Unidades</Form.Label>
            <Form.Control
              type="number" name="cantidad" value={reposicion.cantidad} onChange={alEscribir}
              isInvalid={errores.cantidad !== ''}
            />
            <Form.Control.Feedback type="invalid">{errores.cantidad}</Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" className="btn-oro">Reponer</Button>
        </Form>
      ) : (
        <Alert variant="danger">
          Solo un ADMINISTRADOR o un HERRERO puede reponer stock. Tu cargo es {usuario.cargo}.
        </Alert>
      )}

      <div className="filtros">
        <div className="filtros-grupo">
          <span className="filtros-titulo">Objeto</span>
          <Form.Select
            className="filtro-select"
            aria-label="Filtrar por objeto"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          >
            <option value="">Todos</option>
            {productos.map((p) => (
              <option key={p.productoId} value={p.productoId}>{p.nombre}</option>
            ))}
          </Form.Select>
        </div>

        <div className="filtros-grupo">
          <span className="filtros-titulo">Tipo</span>
          <button
            type="button"
            className={`filter-btn${filtroTipo === '' ? ' active' : ''}`}
            onClick={() => setFiltroTipo('')}
          >
            Todos
          </button>
          {TIPOS.map((tipo) => (
            <button
              key={tipo}
              type="button"
              className={`filter-btn${filtroTipo === tipo ? ' active' : ''}`}
              onClick={() => setFiltroTipo(tipo)}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {movimientos.length === 0 ? (
        <p className="empty-state">No hay movimientos con ese filtro.</p>
      ) : (
        <div className="table-card">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th className="num">ID</th>
                <th>Fecha</th>
                <th>Objeto</th>
                <th>Tipo</th>
                <th className="num">Cantidad</th>
                <th>Venta</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.slice().reverse().map((m) => (
                <tr key={m.movimientoId}>
                  <td className="num">{m.movimientoId}</td>
                  <td>{formatearFechaHora(m.fechaMovimiento)}</td>
                  <td>{nombreProducto(m.productoId)}</td>
                  <td>
                    <Badge className={m.tipoMovimiento === 'ENTRADA' ? 'ok' : 'alerta'}>
                      {m.tipoMovimiento}
                    </Badge>
                  </td>
                  <td className="num">{m.cantidad}</td>
                  {/* Una reposicion no viene de ninguna venta */}
                  <td>{m.ventaId ? `ME-${m.ventaId}` : '—'}</td>
                  <td>{m.observacion}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  )
}

export default AdminMovimientos
