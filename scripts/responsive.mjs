/* =========================================================
   MIDDLE-EARTH: THE LOST AGE
   responsive.mjs — Revision automatica del diseno responsivo
   ---------------------------------------------------------
   Tarea #35.

   QUE HACE
   Abre las 20 paginas en Chrome a tres anchos (375, 768 y
   1280 px) y mide si alguna DESBORDA, es decir, si aparece
   barra de scroll horizontal. Cuando una desborda, nombra los
   elementos culpables con su clase y su ancho.

   POR QUE UN SCRIPT Y NO MIRARLO A OJO
   Porque a ojo no se ve. Asi se encontro que las 7 paginas
   del panel se salian hasta 572 px en el celular: a la
   columna de la rejilla le faltaba min-width:0. Mirando las
   paginas no se notaba, porque el navegador deja hacer scroll.

   COMO SE USA
   Hacen falta tres cosas a la vez, en tres terminales:

     1. npm run build && npx vite preview --port 4173
     2. google-chrome --headless --remote-debugging-port=9222 \
          --user-data-dir=/tmp/chrome-resp about:blank
        (en Windows: "C:\Program Files\Google\Chrome\Application\chrome.exe")
     3. node scripts/responsive.mjs

   Termina con codigo 0 si ninguna pagina desborda, y con 1 si
   alguna lo hace.

   No usa ninguna libreria: habla con Chrome por el protocolo
   DevTools con el WebSocket que ya trae Node.
   ========================================================= */

const BASE = process.env.BASE || 'http://localhost:4173'
const CDP = 'http://localhost:9222'

const ANCHOS = [
  { nombre: 'celular', ancho: 375, alto: 812 },
  { nombre: 'tablet', ancho: 768, alto: 1024 },
  { nombre: 'escritorio', ancho: 1280, alto: 900 },
]

const RUTAS = [
  { ruta: '/', sesion: null },
  { ruta: '/catalogo', sesion: null },
  { ruta: '/categorias', sesion: null },
  { ruta: '/ofertas', sesion: null },
  { ruta: '/productos/4', sesion: null },
  { ruta: '/login', sesion: null },
  { ruta: '/registro', sesion: null },
  { ruta: '/carrito', sesion: 'jugador' },
  { ruta: '/checkout', sesion: 'jugador' },
  { ruta: '/compra-fallida', sesion: 'jugador' },
  { ruta: '/mis-pedidos', sesion: 'jugador' },
  { ruta: '/perfil', sesion: 'jugador' },
  { ruta: '/admin', sesion: 'mercader' },
  { ruta: '/admin/productos', sesion: 'mercader' },
  { ruta: '/admin/movimientos', sesion: 'mercader' },
  { ruta: '/admin/auditoria', sesion: 'mercader' },
  { ruta: '/admin/jugadores', sesion: 'mercader' },
  { ruta: '/admin/mercaderes', sesion: 'mercader' },
  { ruta: '/admin/pedidos', sesion: 'mercader' },
]

const SESIONES = {
  jugador: { tipo: 'JUGADOR', id: 4 },
  mercader: { tipo: 'MERCADER', id: 2 },
}

/* --- cliente minimo del protocolo DevTools --- */
let ws, siguienteId = 1
const pendientes = new Map()

function enviar(metodo, params = {}) {
  const id = siguienteId++
  ws.send(JSON.stringify({ id, method: metodo, params }))
  return new Promise((ok, falla) => {
    pendientes.set(id, { ok, falla })
    setTimeout(() => falla(new Error('timeout ' + metodo)), 20000)
  })
}

async function conectar() {
  const objetivos = await (await fetch(`${CDP}/json/list`)).json()
  const pagina = objetivos.find((t) => t.type === 'page')
  ws = new WebSocket(pagina.webSocketDebuggerUrl)

  await new Promise((ok) => { ws.onopen = ok })

  ws.onmessage = (evento) => {
    const msg = JSON.parse(evento.data)
    if (!msg.id) return
    const p = pendientes.get(msg.id)
    if (!p) return
    pendientes.delete(msg.id)
    msg.error ? p.falla(new Error(JSON.stringify(msg.error))) : p.ok(msg.result)
  }

  await enviar('Page.enable')
  await enviar('Runtime.enable')
}

async function evaluar(expresion) {
  const r = await enviar('Runtime.evaluate', {
    expression: expresion,
    returnByValue: true,
    awaitPromise: true,
  })
  return r.result?.value
}

async function irA(url) {
  await enviar('Page.navigate', { url })
  /* Espera a que React haya pintado algo dentro de #root */
  for (let i = 0; i < 60; i++) {
    const listo = await evaluar(
      "document.readyState === 'complete' && !!document.querySelector('#root')?.firstChild",
    ).catch(() => false)
    if (listo) break
    await new Promise((r) => setTimeout(r, 150))
  }
  await new Promise((r) => setTimeout(r, 250))   // respiro para el layout
}

/* Mide el desborde y nombra a los culpables */
const MEDIDA = `(() => {
  const doc = document.documentElement
  const limite = doc.clientWidth
  const desborde = Math.round(doc.scrollWidth - limite)

  const culpables = []
  if (desborde > 0) {
    for (const el of document.querySelectorAll('body *')) {
      const caja = el.getBoundingClientRect()
      if (caja.width === 0) continue
      if (Math.round(caja.right) > limite + 1) {
        const padre = el.parentElement
        const padreDesborda = padre &&
          Math.round(padre.getBoundingClientRect().right) > limite + 1
        if (padreDesborda) continue   // solo el mas externo
        culpables.push({
          etiqueta: el.tagName.toLowerCase(),
          clase: (el.className && el.className.baseVal === undefined
            ? String(el.className) : '').slice(0, 60),
          derecha: Math.round(caja.right),
          ancho: Math.round(caja.width),
        })
      }
      if (culpables.length >= 4) break
    }
  }
  return { desborde, limite, culpables }
})()`

async function main() {
  await conectar()

  /* Siembra los datos una vez y crea una venta confirmada,
     para que las tablas tengan filas de verdad que medir. */
  await irA(BASE + '/')
  await evaluar(`(() => {
    const leer = (k) => JSON.parse(localStorage.getItem(k) || 'null')
    const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v))
    guardar('me_ventas', [{ ventaId: 1001, jugadorId: 4, mercaderId: 1,
      fechaVenta: new Date().toISOString(), estado: 'CONFIRMADA' }])
    guardar('me_detalles_venta', [
      { detalleId: 1, ventaId: 1001, productoId: 6, cantidad: 3, precioUnitario: 50 },
      { detalleId: 2, ventaId: 1001, productoId: 5, cantidad: 1, precioUnitario: 900 }])
    guardar('me_movimientos_stock', [
      { movimientoId: 1, productoId: 6, fechaMovimiento: new Date().toISOString(),
        tipoMovimiento: 'SALIDA', cantidad: 3, ventaId: 1001, observacion: 'Salida por venta' }])
    guardar('me_auditoria_producto', [
      { auditoriaId: 1, productoId: 1, fechaCambio: new Date().toISOString(),
        usuarioBd: 'elrond@rivendel.me', campoModificado: 'PRECIO',
        valorAnterior: '1500', valorNuevo: '1700' }])
    return leer('me_productos')?.length
  })()`)

  const problemas = []

  for (const { nombre, ancho, alto } of ANCHOS) {
    await enviar('Emulation.setDeviceMetricsOverride', {
      width: ancho, height: alto, deviceScaleFactor: 1,
      mobile: ancho < 768,
    })

    console.log(`\n===== ${nombre} (${ancho} px) =====`)

    for (const { ruta, sesion } of RUTAS) {
      await evaluar(sesion
        ? `localStorage.setItem('me_sesion', '${JSON.stringify(SESIONES[sesion])}')`
        : `localStorage.removeItem('me_sesion')`)

      await irA(BASE + ruta)
      const r = await evaluar(MEDIDA)

      if (!r) { console.log(`  ?  ${ruta}  (no se pudo medir)`); continue }

      if (r.desborde > 0) {
        problemas.push({ ancho: nombre, ruta, ...r })
        console.log(`  ✗  ${ruta.padEnd(22)} desborda ${r.desborde} px`)
        r.culpables.forEach((c) =>
          console.log(`        <${c.etiqueta} class="${c.clase}"> ancho ${c.ancho}, llega a ${c.derecha}`))
      } else {
        console.log(`  OK ${ruta}`)
      }
    }
  }

  console.log(problemas.length === 0
    ? '\nNINGUNA PAGINA DESBORDA'
    : `\n${problemas.length} CASOS CON DESBORDE`)

  ws.close()
  process.exit(problemas.length === 0 ? 0 : 1)
}

main().catch((e) => { console.error('ERROR', e.message); process.exit(2) })
