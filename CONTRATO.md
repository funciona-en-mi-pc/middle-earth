# CONTRATO del proyecto

Acuerdo entre Javier y José. **Todo lo que está aquí es obligatorio**: si los dos respetamos estos nombres, el código de uno encaja con el del otro sin tocarlo.

**Si algo de aquí hay que cambiar, se avisa al otro antes.** No se cambia por cuenta propia.

---

## 1. De dónde sale cada cosa

| | Fuente |
|---|---|
| **Datos, entidades y reglas** | `tienda_tierra_media.sql` |
| **Solo el estilo visual** | El mockup de la etapa 1 (colores, fuentes, navbar, fichas, cintas de región) |

Lo que el mockup tenía y **no existe** en el SQL, no se usa: `rareza`, `codigo` (ARM-LEG-001), `bonos`, `razaRequerida`, `peso`, `edad`, y los roles CLIENTE y VENDEDOR del mockup.

---

## 2. Modelo de datos

Los nombres van en **camelCase**, porque así los devolverá Spring Boot en la etapa 3.

| Entidad | Campos |
|---|---|
| `raza` | `razaId`, `nombre` |
| `categoria` | `categoriaId`, `nombre` |
| `jugador` | `jugadorId`, `razaId`, `nombre`, `nivel`, `email`, `password`, `estado` |
| `mercader` | `mercaderId`, `nombre`, `cargo`, `email`, `password`, `estado` |
| `producto` | `productoId`, `categoriaId`, `nombre`, `precio`, `stock`, `nivelRequerido`, `estado`, `imagen` |
| `venta` | `ventaId`, `jugadorId`, `mercaderId`, `fechaVenta`, `estado` |
| `detalleVenta` | `detalleId`, `ventaId`, `productoId`, `cantidad`, `precioUnitario` |
| `movimientoStock` | `movimientoId`, `productoId`, `fechaMovimiento`, `tipoMovimiento`, `cantidad`, `ventaId`, `observacion` |
| `auditoriaProducto` | `auditoriaId`, `productoId`, `fechaCambio`, `usuarioBd`, `campoModificado`, `valorAnterior`, `valorNuevo` |

**Valores fijos:**

| Campo | Valores posibles |
|---|---|
| `estado` de jugador, mercader y producto | `'ACTIVO'` · `'INACTIVO'` |
| `estado` de venta | `'ABIERTA'` · `'CONFIRMADA'` · `'ANULADA'` |
| `tipoMovimiento` | `'ENTRADA'` · `'SALIDA'` |
| `cargo` de mercader | `'VENDEDOR'` · `'ADMINISTRADOR'` · `'HERRERO'` |

**Reglas de forma:** las fechas se guardan como texto ISO (`new Date().toISOString()`). Los ID son números, no texto. Los `email` se comparan en minúsculas.

**Tres campos que el SQL no tiene** y hay que agregar a la base de datos en la etapa 3: `password` en `JUGADOR` y `MERCADER`, `email` en `MERCADER`, e `imagen` en `PRODUCTO`.

---

## 3. Cómo responden los services

**Todas** las funciones que pueden fallar devuelven la misma forma:

```js
{ ok: true,  ...datos }              // salió bien
{ ok: false, error: 'mensaje' }      // falló, con el mensaje listo para mostrar
```

Las que solo consultan devuelven el dato directo: un arreglo, un objeto o `null`.

Los mensajes de error son los mismos del SQL, para poder defenderlos en la presentación: "Stock insuficiente. Disponible: 3", "Nivel insuficiente...", "Jugador inexistente o inactivo".

### `services/storage.js` — Javier, ya hecho
```js
CLAVES                                  // nombres de los cajones de localStorage
leer(clave, porDefecto)
guardar(clave, valor)
siguienteId(lista, campo, desde = 1)    // lo que en Oracle hace una secuencia
siguienteIdVenta(ventas)                // empieza en 1001, como SEQ_VENTA
sembrarDatos()
reiniciarDatos()
```

### `services/authService.js` — Javier, tarea #9
```js
iniciarSesion(email, password)  // { ok, usuario } | { ok: false, error }
cerrarSesion()
usuarioActivo()                 // el usuario o null
esMercader()
esAdministrador()
```
El **usuario con la sesión abierta** siempre tiene esta forma, y es lo que José recibe desde `AuthContext`:
```js
{ id, nombre, email, tipo: 'JUGADOR' | 'MERCADER', nivel, cargo }
```
`nivel` solo viene si es jugador; `cargo` solo si es mercader.

### `context/AuthContext.jsx` — Javier, tarea #9
```js
const { usuario, login, logout } = useAuth()
```
`usuario` es `null` si nadie entró. **José usa esto** para saber el nivel del jugador en el catálogo y en el carrito. Nadie lee `localStorage` directamente desde una página.

### `services/jugadorService.js` — Javier, tarea #17
```js
listarJugadores()
obtenerJugador(id)
buscarPorEmail(email)
crearJugador(datos)             // nivel 1 y estado ACTIVO
actualizarJugador(id, cambios)
eliminarJugador(id)             // con ventas: no borra, avisa de dejarlo INACTIVO
listarRazas()
```

### `services/mercaderService.js` — Javier, tarea #44
```js
listarMercaderes()
obtenerMercader(id)
crearMercader(datos)
actualizarMercader(id, cambios)
eliminarMercader(id)
```

### `services/auditoriaService.js` — Javier, tarea #43
```js
registrarCambio(productoId, campo, valorAnterior, valorNuevo)
listarAuditoria()
```
José la llama desde el CRUD de productos al cambiar precio o estado.

### `services/productoService.js` — José, tarea #14
```js
listarProductos({ categoriaId, soloActivos } = {})
obtenerProducto(id)
listarCategorias()
productosDestacados(n)
crearProducto(datos)            // nace con stock 0
actualizarProducto(id, cambios) // precio, nivelRequerido y estado; NUNCA el stock
eliminarProducto(id)
```

### `services/inventarioService.js` — José, tareas #22 y #42
```js
stockDisponible(productoId)
descontarStock(productoId, cantidad, ventaId)   // SALIDA
devolverStock(productoId, cantidad, ventaId)    // ENTRADA
reponerStock(productoId, cantidad)              // ENTRADA, ventaId null
listarMovimientos({ productoId, tipo } = {})
```

### `services/ventaService.js` — José, tarea #22
```js
crearVenta(jugadorId)
agregarProducto(ventaId, productoId, cantidad)
confirmarVenta(ventaId)
anularVenta(ventaId)
ventaAbiertaDe(jugadorId)
ventasDeJugador(jugadorId)      // lo usa Mis pedidos (Javier)
listarVentas({ estado } = {})
totalVenta(ventaId)
cantidadProductos(ventaId)
cantidadItemsCarrito(jugadorId) // lo usa la Navbar (Javier)
```

### `utils/formatos.js` — José, tarea #14
```js
formatearOro(precio)   // 1500  -> "1.500 oro"
formatearFecha(iso)    // ISO   -> "05/10/2026"
```

### `utils/validaciones.js` — Javier, tareas #8 y #18
Funciones puras: reciben un valor y devuelven `''` si está bien, o el mensaje de error.
```js
validarEmail(valor)        // obligatorio, formato, máx. 120
validarPassword(valor)     // obligatoria, 4 a 10
validarNombre(valor)       // obligatorio, máx. 100
validarConfirmacion(valor, original)
validarNivel(valor)        // entero mayor que 0
validarPrecio(valor)       // mayor que 0
validarStock(valor)        // entero, 0 o más
```

---

## 4. Rutas

| Ruta | Página | Dueño |
|---|---|---|
| `/` | Inicio | ⚔️ José |
| `/catalogo` | Catálogo | ⚔️ José |
| `/productos/:id` | Detalle de producto | ⚔️ José |
| `/carrito` | Carrito | ⚔️ José |
| `/login` | Login | 🧙 Javier |
| `/registro` | Registro | 🧙 Javier |
| `/perfil` | Perfil | 🧙 Javier |
| `/mis-pedidos` | Mis pedidos | 🧙 Javier |
| `/admin` | Tablero | ⚔️ José |
| `/admin/productos` | Productos | ⚔️ José |
| `/admin/movimientos` | Movimientos de stock | ⚔️ José |
| `/admin/auditoria` | Auditoría | 🧙 Javier |
| `/admin/jugadores` | Jugadores | 🧙 Javier |
| `/admin/mercaderes` | Mercaderes | 🧙 Javier |
| `/admin/pedidos` | Pedidos | ⚔️ José |
| `*` | No encontrado | 🧙 Javier |

---

## 5. Archivos compartidos

**Solo se tocan en las reuniones de hito, o avisando al otro.**

| Archivo | Dueño |
|---|---|
| `src/App.jsx` | Nadie: ya tiene todas las rutas, no hace falta tocarlo |
| `src/main.jsx` | Javier |
| `src/components/Navbar.jsx` | Javier |
| `src/components/Footer.jsx` | Javier |
| `src/layouts/TiendaLayout.jsx` | Javier |
| `src/layouts/AdminLayout.jsx` | Javier |
| `src/styles/styles.css` | Los dos: cada uno agrega al final, en su propia sección con comentario |
| `package.json` | Los dos, pero avisando siempre |

**Caso concreto:** el contador del carrito va en la Navbar, que es de Javier. José **no toca la Navbar**: expone `ventaService.cantidadItemsCarrito(jugadorId)` y Javier la conecta.

---

## 6. Componentes compartidos

| Componente | Dueño | Cómo se usa |
|---|---|---|
| `CintaRegion` | Javier | `<CintaRegion region="erebor" nombre="Erebor" subtitulo="..." />`. Pone el color de acento de la página |
| `ProductoCard` | José (tarea #15) | `<ProductoCard producto={producto} />` |
| `RutaProtegida` | Javier (tarea #27) | `<RutaProtegida tipo="MERCADER">` |

**Regiones disponibles:** `rivendel`, `erebor`, `comarca`, `minas-tirith`, `lothlorien`, `rohan`, `moria`, `bree`, `orthanc`.

---

## 7. Clases de CSS que ya existen

No hace falta inventar estilos: `styles.css` ya trae estas clases del mockup.

| Para | Clases |
|---|---|
| Cabecera de página | `page-head`, `eyebrow`, `lede`, `section` |
| Ficha de producto | `item-card`, `item-thumb`, `item-categoria`, `item-name`, `item-meta`, `item-price`, `coin` |
| Filtros | `filtros`, `filtros-grupo`, `filtros-titulo`, `filter-btn` (con `active`) |
| Formularios | `form-wrap`, `form-card`, `form-logo`, `sigil-big`, `field` |
| Tablas | `table-card`, y `<Table>` de react-bootstrap |
| Indicadores | `kpi` con `.n` (la cifra) y `.l` (el rótulo) |
| Etiquetas | `badge` más `ok`, `alerta` o `aviso` |
| Botones | `btn btn-oro` (principal), `btn btn-linea` (secundario), `btn-sm` |
| Sin resultados | `empty-state` |

---

## 8. Reglas de negocio del SQL y dónde se cumplen

| # | Regla | Dónde |
|---|---|---|
| 1 | Solo venden y compran jugadores y mercaderes ACTIVOS | `ventaService.crearVenta` |
| 2 | El producto debe estar ACTIVO y con stock suficiente | `inventarioService.descontarStock` |
| 3 | El jugador solo compra productos de su nivel o menor | `ventaService.agregarProducto` |
| 4 | La venta nace ABIERTA; luego se CONFIRMA o se ANULA | `ventaService` |
| 5 | No se confirma una venta sin productos | `ventaService.confirmarVenta` |
| 6 | Al vender, el stock baja y queda una SALIDA | `inventarioService.descontarStock` |
| 7 | Al anular, el stock vuelve y queda una ENTRADA | `inventarioService.devolverStock` |
| 8 | El precio se copia al detalle al momento de vender | `ventaService.agregarProducto` |
| 9 | No se elimina lo que tiene ventas: se deja INACTIVO | `jugadorService`, `productoService`, `mercaderService` |
| 10 | Todo cambio de precio o estado queda auditado | `auditoriaService.registrarCambio` |

**Dos reglas de diseño:** el stock **solo** cambia desde `inventarioService` (por eso `actualizarProducto` no lo toca), y un producto nuevo nace con stock 0 y lo recibe con `reponerStock`, para que todo quede en el historial.

---

## 9. Usuarios de prueba

**Jugadores** (entran a la tienda):

| Nombre | Correo | Contraseña | Nivel |
|---|---|---|---|
| Aragorn | `aragorn@gondor.me` | `aragorn123` | 25 |
| Frodo Bolson | `frodo@comarca.me` | `frodo123` | 5 |
| Legolas | `legolas@bosqueverde.me` | `legolas123` | 20 |
| Gimli | `gimli@erebor.me` | `gimli123` | 18 |
| Gandalf | `gandalf@istari.me` | `gandalf123` | 50 |
| Boromir | `boromir@gondor.me` | `boromir123` | 22, **INACTIVO** |

**Mercaderes** (entran al panel):

| Nombre | Correo | Contraseña | Cargo |
|---|---|---|---|
| Elrond | `elrond@rivendel.me` | `elrond123` | ADMINISTRADOR |
| Cebadilla Mantecona | `cebadilla@pony.me` | `cebadilla1` | VENDEDOR |
| Grimbold Martillo | `grimbold@erebor.me` | `grimbold1` | HERRERO |
| Grima | `grima@isengard.me` | `grima123` | **INACTIVO** |

Boromir y Grima existen para probar los errores de "inactivo".

---

## 10. Convenciones de trabajo

**Ramas:** cada uno hace commit solo en la suya, `dev-javier` o `dev-jose`. A `main` se llega únicamente en las reuniones de hito.

**Mensajes de commit:**

| Prefijo | Para qué |
|---|---|
| `feat:` | Algo nuevo: una página, un componente, un service |
| `fix:` | Arreglar un error |
| `chore:` | Configuración, dependencias, estructura |
| `test:` | Pruebas unitarias y cobertura |
| `docs:` | README y documentación |
| `style:` | Solo CSS o formato |
| `refactor:` | Reordenar sin cambiar el comportamiento |

**No instalar librerías nuevas sin avisar.** Las aprobadas son: `react`, `react-dom`, `react-bootstrap`, `bootstrap`, `react-router-dom`, más las de pruebas que agregue la tarea #12.

**Antes de hacer commit:** `npm run lint` tiene que pasar sin errores.
