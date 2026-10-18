# Especificación de Requisitos de Software (ERS) — Versión 2

**Middle-earth: The Lost Age** — Tienda de equipamiento para un RPG de la Tierra Media
Asignatura DSY1104 · Evaluación Parcial 2 (30%)
Equipo: Javier Vega y José Fierro · Duoc UC, Escuela de Informática y Telecomunicaciones

| | |
|---|---|
| **Versión** | 2.0 |
| **Reemplaza a** | ERS v1.0 (Etapa 1: mockup HTML + base de datos Oracle) |
| **Estado** | Vigente para la Etapa 2 (frontend React) |
| **Repositorio** | https://github.com/funciona-en-mi-pc/middle-earth |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requisitos de la tienda en línea **Middle-earth: The Lost
Age** al cierre de la Etapa 2. Actualiza la versión 1 incorporando la migración completa
a React, el nuevo flujo de compra con pago, las vistas de categorías y ofertas, y el
entorno de pruebas unitarias.

Está dirigido al docente evaluador y al propio equipo, que lo usa como contrato técnico
durante el desarrollo.

### 1.2 Ámbito

El sistema es una **tienda de equipamiento para un videojuego RPG**: un **jugador**
compra armas, armaduras, pociones y accesorios, y lo atiende un **mercader**.

Lo que el sistema hace en esta etapa:

- Muestra un catálogo público con filtros por categoría y por nivel del jugador.
- Permite registrarse, iniciar sesión y mantener un perfil.
- Permite armar un carrito, pagarlo y consultar el historial de pedidos.
- Ofrece un panel de administración para mercaderes: productos, stock, ventas,
  jugadores, mercaderes y auditoría.

Lo que **no** hace todavía: no hay servidor, no hay pasarela de pago real, y no hay
envío de correos. Eso llega en la Etapa 3.

### 1.3 Definiciones y acrónimos

| Término | Significado |
|---|---|
| **Jugador** | Cliente de la tienda. Equivale a CLIENTE en un comercio normal. Tiene un **nivel**. |
| **Mercader** | Empleado. Equivale a EMPLEADO. Tiene un **cargo**: VENDEDOR, ADMINISTRADOR o HERRERO. |
| **Nivel** | Atributo del jugador. Limita qué productos puede comprar (ver RN-03). |
| **Venta ABIERTA** | El carrito. No existe una estructura de carrito aparte. |
| **Oro** | La moneda del sistema. Se formatea como `1.500 oro`. |
| **Rareza** | Clasificación visual derivada del nivel requerido. No existe en la base de datos. |
| **Oferta** | Descuento derivado del stock. No existe en la base de datos. |
| **ERS** | Especificación de Requisitos de Software |
| **RF / RNF / RN** | Requisito Funcional / No Funcional / Regla de Negocio |

### 1.4 Referencias

1. `tienda_tierra_media.sql` — script Oracle PL/SQL de la Etapa 1. **Fuente única de
   verdad para el modelo de datos y las reglas de negocio.**
2. `CONTRATO.md` — acuerdo de trabajo del equipo: nombres de campos, firmas de los
   services, propiedad de cada archivo.
3. *DSY1104 Evaluación Parcial 2 - Anexo 1 Instrucciones* — requisitos de la entrega.
4. Mockup HTML de la Etapa 1 — **solo** como referencia de estilo visual.
5. `docs/cobertura-testing.md` — documento de cobertura del testing.

---

## 2. Descripción general

### 2.1 Perspectiva del producto

Aplicación web de una sola página (SPA) construida con React 19 y React Router 7.

**Decisión arquitectónica central:** toda la lectura y escritura de datos pasa por
`src/services/`. Hoy esos services guardan en `localStorage`; en la Etapa 3 pasarán a
llamar a la API REST de Spring Boot. **Las páginas no cambiarán.** Esa frontera es lo
que hace que la migración al backend sea un trabajo acotado.

```
  páginas (React)  ->  services/  ->  localStorage      (Etapa 2, hoy)
  páginas (React)  ->  services/  ->  API REST          (Etapa 3)
       sin cambios      cambian       Spring Boot
```

### 2.2 Funciones del producto

| Bloque | Funciones |
|---|---|
| **Catálogo público** | Portada con destacados, catálogo con filtros, categorías, ofertas, detalle de producto |
| **Cuenta** | Registro, inicio y cierre de sesión, perfil |
| **Compra** | Carrito, checkout con datos de entrega y pago, boleta, historial de pedidos |
| **Administración** | Tablero con indicadores, CRUD de productos, movimientos de stock, ventas, jugadores, mercaderes, auditoría |

### 2.3 Características de los usuarios

| Perfil | Acceso | Qué puede hacer |
|---|---|---|
| **Visitante** | Público | Ver portada, catálogo, categorías, ofertas y detalle. No compra. |
| **Jugador** | Sesión iniciada, `tipo = 'JUGADOR'` | Todo lo anterior, más carrito, pago, pedidos y perfil. |
| **Mercader VENDEDOR / HERRERO** | Sesión iniciada, `tipo = 'MERCADER'` | Panel de administración en modo consulta y reposición de stock. |
| **Mercader ADMINISTRADOR** | Sesión iniciada, `cargo = 'ADMINISTRADOR'` | Todo el panel, incluidas altas, bajas y modificaciones. |

### 2.4 Restricciones

- **RC-01** — El modelo de datos lo manda `tienda_tierra_media.sql`. Lo que no está en
  el SQL no se inventa como columna.
- **RC-02** — Nombres de campos en camelCase, porque es como los devolverá Spring Boot.
- **RC-03** — Librerías aprobadas: `react`, `react-dom`, `react-router-dom`,
  `react-bootstrap`, `bootstrap`, más las de prueba. No se agregan otras sin acuerdo.
- **RC-04** — Ninguna página lee `localStorage` directamente. Siempre a través de un service.
- **RC-05** — `npm run lint` debe pasar sin errores antes de cada commit.

### 2.5 Supuestos y dependencias

- El navegador tiene `localStorage` disponible. Si falla, `services/storage.js` degrada
  sin romper la aplicación (está probado en `storage.spec.js`).
- Las contraseñas se guardan en texto plano. **Es una limitación consciente de la etapa
  sin servidor**; el cifrado corresponde al backend de la Etapa 3.
- Tres campos no existen en el SQL y habrá que agregarlos a la base en la Etapa 3:
  `password` en `JUGADOR` y `MERCADER`, `email` en `MERCADER`, e `imagen` en `PRODUCTO`.

---

## 3. Requisitos específicos

### 3.1 Interfaces externas

**Interfaz de usuario.** React Bootstrap 2.10 sobre Bootstrap 5.3, con un tema propio en
`src/styles/`. Paleta oscura (obsidiana, hierro, oro) y tipografías Cinzel y Spectral
servidas localmente en formato woff2, sin depender de Google Fonts.

**Interfaz de software.** Node.js con Vite 8 como servidor de desarrollo y empaquetador.
Navegadores objetivo: Chrome, Firefox y Edge actuales.

**Interfaz de comunicaciones.** Ninguna en esta etapa. En la Etapa 3: API REST sobre
HTTPS contra Spring Boot.

### 3.2 Requisitos funcionales

#### Catálogo y navegación

| ID | Requisito | Ruta | Prioridad |
|---|---|---|---|
| RF-01 | La portada muestra cuatro objetos destacados y accesos a las cuatro categorías | `/` | Alta |
| RF-02 | El catálogo lista todos los productos ACTIVOS | `/catalogo` | Alta |
| RF-03 | El catálogo filtra por categoría, y el filtro queda en la URL para poder compartirla | `/catalogo?categoria=N` | Alta |
| RF-04 | El jugador con sesión puede filtrar por "lo que puedo usar" según su nivel | `/catalogo` | Media |
| RF-05 | **La vista de categorías muestra los cuatro gremios con su recuento y precio mínimo, y enlaza al catálogo filtrado** | `/categorias` | Alta |
| RF-06 | **La vista de ofertas muestra los productos rebajados, ordenados de mayor a menor descuento** | `/ofertas` | Alta |
| RF-07 | El detalle de producto muestra ficha completa y permite elegir cantidad y agregar al carrito | `/productos/:id` | Alta |
| RF-08 | Una ruta inexistente muestra una página 404 | `*` | Baja |

#### Cuenta de usuario

| ID | Requisito | Ruta | Prioridad |
|---|---|---|---|
| RF-09 | El visitante puede registrarse como jugador. Nace en nivel 1 y estado ACTIVO | `/registro` | Alta |
| RF-10 | El registro valida nombre, correo, raza, contraseña y su confirmación | `/registro` | Alta |
| RF-11 | Jugadores y mercaderes inician sesión con el mismo formulario | `/login` | Alta |
| RF-12 | Un usuario INACTIVO no puede iniciar sesión | `/login` | Alta |
| RF-13 | El usuario con sesión consulta su perfil: nivel, linaje y compras si es jugador; cargo y permisos si es mercader | `/perfil` | Media |
| RF-14 | La sesión sobrevive a recargar la página | — | Media |

#### Compra

| ID | Requisito | Ruta | Prioridad |
|---|---|---|---|
| RF-15 | El carrito muestra las líneas de la venta ABIERTA, con subtotales y total | `/carrito` | Alta |
| RF-16 | Vaciar el carrito anula la venta y devuelve el stock | `/carrito` | Alta |
| RF-17 | **El checkout pide nombre, correo, dirección, reino, forma de entrega y forma de pago** | `/checkout` | Alta |
| RF-18 | **Si el usuario tiene sesión iniciada, sus datos se rellenan automáticamente** | `/checkout` | Alta |
| RF-19 | **El checkout valida los datos antes de cobrar y señala cada campo con su error** | `/checkout` | Alta |
| RF-20 | **Un pago correcto confirma la venta y lleva a la boleta** | `/compra-exitosa/:ventaId` | Alta |
| RF-21 | **La boleta muestra número de venta, objetos, fecha, total y datos de entrega** | `/compra-exitosa/:ventaId` | Alta |
| RF-22 | **Un pago rechazado lleva a una vista de error que explica el motivo y permite reintentar** | `/compra-fallida` | Alta |
| RF-23 | **Un pago rechazado deja el carrito y el stock intactos** | `/compra-fallida` | Alta |
| RF-24 | El jugador consulta el historial de sus pedidos con su estado | `/mis-pedidos` | Media |

#### Administración

| ID | Requisito | Ruta | Prioridad |
|---|---|---|---|
| RF-25 | El tablero muestra indicadores, stock crítico y últimos movimientos | `/admin` | Alta |
| RF-26 | CRUD de productos. El stock no se edita aquí | `/admin/productos` | Alta |
| RF-27 | Registro y reposición de movimientos de stock | `/admin/movimientos` | Alta |
| RF-28 | Listado de ventas con filtro por estado, y anulación | `/admin/pedidos` | Alta |
| RF-29 | CRUD de jugadores | `/admin/jugadores` | Alta |
| RF-30 | CRUD de mercaderes, protegiendo que quede al menos un ADMINISTRADOR | `/admin/mercaderes` | Alta |
| RF-31 | Consulta de la auditoría de cambios de productos | `/admin/auditoria` | Media |
| RF-32 | Solo el cargo ADMINISTRADOR puede crear, editar y borrar | `/admin/*` | Alta |

#### Control de acceso

| ID | Requisito | Prioridad |
|---|---|---|
| RF-33 | `/perfil` exige sesión iniciada | Alta |
| RF-34 | `/carrito`, `/checkout`, `/compra-exitosa`, `/compra-fallida` y `/mis-pedidos` exigen sesión de **jugador** | Alta |
| RF-35 | Todo `/admin/*` exige sesión de **mercader** | Alta |
| RF-36 | Quien entra sin permiso ve un aviso y se le ofrece iniciar sesión | Media |

> Los requisitos en **negrita** son nuevos en esta versión.

### 3.3 Requisitos no funcionales

| ID | Requisito | Cómo se verifica |
|---|---|---|
| RNF-01 | **Diseño responsivo** en móvil, tableta y escritorio, sin desborde horizontal | `scripts/responsive.mjs` recorre todas las rutas y mide el ancho real del documento |
| RNF-02 | **Componentes de responsabilidad única**, con nombre descriptivo, datos por props y estado solo cuando hace falta | Revisión de código y `npm run lint` |
| RNF-03 | **Cobertura de pruebas ≥ 90 %** en sentencias, funciones y líneas | `npm run coverage` — hoy 95,98 % / 96,52 % / 97,09 % |
| RNF-04 | **Accesibilidad**: contraste suficiente, navegación por teclado, etiquetas en los formularios, `aria-label` en los controles sin texto | Consultas por rol en las pruebas, revisión de contraste |
| RNF-05 | **Reducción de movimiento**: quien lo pide en su sistema ve la interfaz quieta | `@media (prefers-reduced-motion: reduce)` en `styles.css` |
| RNF-06 | **Mantenibilidad**: ninguna página accede a `localStorage`; todo pasa por un service | Revisión de código |
| RNF-07 | **Rendimiento**: carga inicial por debajo de 500 kB sin comprimir; imágenes con `loading="lazy"` | `npm run build` — hoy 404 kB de JS, 120 kB comprimido |
| RNF-08 | **Portabilidad**: tipografías servidas localmente, sin dependencias de CDN externos | `src/assets/fonts/` |
| RNF-09 | **Trazabilidad con el SQL**: cada mensaje de error de negocio repite el del script Oracle | Pruebas de servicio |

### 3.4 Reglas de negocio

Vienen literalmente del script `tienda_tierra_media.sql` y son el núcleo del sistema.

| ID | Regla | Implementada en |
|---|---|---|
| RN-01 | Solo compran y venden jugadores y mercaderes **ACTIVOS** | `ventaService.crearVenta` |
| RN-02 | El producto debe estar **ACTIVO** y tener stock suficiente | `inventarioService.descontarStock` |
| RN-03 | El jugador solo compra productos de **su nivel o menor** | `ventaService.agregarProducto` |
| RN-04 | La venta nace **ABIERTA**; luego se CONFIRMA o se ANULA | `ventaService` |
| RN-05 | No se confirma una venta **sin productos** | `ventaService.confirmarVenta` |
| RN-06 | Al vender, el stock baja y queda una **SALIDA** | `inventarioService.descontarStock` |
| RN-07 | Al anular, el stock vuelve y queda una **ENTRADA** | `inventarioService.devolverStock` |
| RN-08 | El precio se **copia al detalle** en el momento de vender | `ventaService.agregarProducto` |
| RN-09 | No se elimina lo que tiene ventas: se deja **INACTIVO** | `jugadorService`, `productoService`, `mercaderService` |
| RN-10 | Todo cambio de **precio o estado** de un producto queda **auditado** | `auditoriaService.registrarCambio` |

**Dos reglas de diseño propias del equipo:**

- El stock **solo** cambia desde `inventarioService`. Por eso `actualizarProducto` no lo toca.
- Un producto nuevo nace con stock 0 y lo recibe con `reponerStock`, para que todo quede
  en el historial.

### 3.5 Modelo de datos

Las nueve tablas del SQL, con los nombres en camelCase que usará la API:

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

| Campo | Valores |
|---|---|
| `estado` de jugador, mercader y producto | `ACTIVO` · `INACTIVO` |
| `estado` de venta | `ABIERTA` · `CONFIRMADA` · `ANULADA` |
| `tipoMovimiento` | `ENTRADA` · `SALIDA` |
| `cargo` de mercader | `VENDEDOR` · `ADMINISTRADOR` · `HERRERO` |

#### 3.5.1 Dos atributos derivados, y por qué no son columnas

La Etapa 1 pedía rareza visual y la Etapa 2 pide una vista de ofertas. Ninguna de las dos
cosas existe en el SQL. En vez de inventar columnas que luego habría que justificar ante
la base de datos, **se derivan de datos que ya existen**:

| Atributo | Se deriva de | Archivo | Justificación |
|---|---|---|---|
| **Rareza** | `nivelRequerido` | `utils/rareza.js` | El nivel requerido ya ordena los objetos de humilde a legendario |
| **Oferta** | `stock` | `utils/oferta.js` | Un mercader liquida lo que se le acumula |

**Nota importante sobre el precio de oferta.** Por RN-08, `ventaService` copia
`producto.precio` al detalle de la venta. Si la ficha mostrara un precio rebajado
distinto, la boleta diría otra cosa. Por eso **el precio del producto ya es el precio
vigente**, y lo que se muestra tachado es el **precio anterior**, reconstruido hacia
arriba:

```
precioAntes = precio / (1 - descuento)      →   50 oro con -25% venían de 67 oro
```

Así la vitrina y la boleta nunca se contradicen, y no hace falta tocar `ventaService` ni
los datos. Si en la Etapa 3 la tabla `PRODUCTO` gana una columna `descuento`, solo cambia
`utils/oferta.js`.

---

## 4. Arquitectura y estructura

```
src/
├── assets/      imágenes y tipografías
├── components/  piezas reutilizables: Navbar, Footer, CintaRegion, ProductoCard…
├── layouts/     el marco de la tienda y el del panel
├── pages/       una página por ruta (y pages/admin/ para el panel)
├── context/     la sesión, compartida por toda la aplicación
├── services/    acceso a datos. Hoy localStorage, en la Etapa 3 la API REST
├── utils/       funciones puras: validaciones, formatos, rareza, oferta
├── data/        los datos iniciales, copiados del SQL
└── styles/      la paleta y los estilos
```

### 4.1 Contrato de los services

Toda función que puede fallar devuelve siempre la misma forma:

```js
{ ok: true,  ...datos }              // salió bien
{ ok: false, error: 'mensaje' }      // falló, con el mensaje listo para mostrar
```

Las que solo consultan devuelven el dato directo: un arreglo, un objeto o `null`.

### 4.2 Mapa de rutas

```
TIENDA                                     PANEL (solo mercaderes)
  /                      Inicio              /admin               Tablero
  /catalogo              Catálogo            /admin/productos     Productos
  /categorias         ★  Categorías          /admin/movimientos   Stock
  /ofertas            ★  Ofertas             /admin/pedidos       Ventas
  /productos/:id         Detalle             /admin/jugadores     Jugadores
  /login                 Iniciar sesión      /admin/mercaderes    Mercaderes
  /registro              Crear cuenta        /admin/auditoria     Auditoría
  /perfil             ·  Perfil
  /carrito            ‡  Carrito
  /checkout           ★‡ Pagar
  /compra-exitosa/:id ★‡ Boleta
  /compra-fallida     ★‡ Pago rechazado
  /mis-pedidos        ‡  Mis pedidos
  *                      No encontrado

  ★ nuevo en la V2    · exige sesión    ‡ exige sesión de jugador
```

### 4.3 El flujo de compra

```
  /catalogo  →  /productos/:id  →  /carrito  →  /checkout  ┬→  /compra-exitosa/:ventaId
                                                           └→  /compra-fallida  →  reintentar
```

El stock se descuenta al **agregar al carrito** (RN-06), no al pagar. Por eso el carrito
es la venta ABIERTA y vaciarlo es anularla (RN-07). Confirmar en el checkout solo cambia
el estado a CONFIRMADA: no vuelve a tocar el stock.

---

## 5. Matriz de trazabilidad

Cada requisito nuevo, con el archivo que lo implementa y la prueba que lo defiende.

| Requisito | Implementación | Prueba |
|---|---|---|
| RF-05 Categorías | `pages/Categorias.jsx` | `pages/Categorias.spec.js` (6 casos) |
| RF-06 Ofertas | `pages/Ofertas.jsx`, `utils/oferta.js` | `pages/Ofertas.spec.js` (8), `utils/oferta.spec.js` (9) |
| RF-17 Checkout | `pages/Checkout.jsx` | `pages/Checkout.spec.js` (14) |
| RF-18 Autorrelleno | `pages/Checkout.jsx` | `Checkout.spec.js` — "rellena solo los datos del jugador" |
| RF-19 Validación | `utils/validaciones.js` | `utils/validaciones.spec.js` (29) |
| RF-20 Pago correcto | `pages/Checkout.jsx`, `ventaService.confirmarVenta` | `Checkout.spec.js` — "confirma la venta y lleva a la boleta" |
| RF-21 Boleta | `pages/CompraExitosa.jsx` | `pages/CompraExitosa.spec.js` (5) |
| RF-22 Pago rechazado | `pages/CompraFallida.jsx` | `pages/CompraFallida.spec.js` (4) |
| RF-23 Carrito intacto | `pages/Checkout.jsx` | `Checkout.spec.js` — "deja el carrito y el stock como estaban" |
| RF-34/35 Rutas protegidas | `components/RutaProtegida.jsx` | `components/RutaProtegida.spec.js` (12) |
| RN-01 a RN-10 | `services/` | ver `docs/cobertura-testing.md`, sección 3 |

**Estado global:** 448 pruebas en 34 archivos, todas pasando. Cobertura: 95,98 % de
sentencias, 91,63 % de ramas, 96,52 % de funciones, 97,09 % de líneas.

---

## 6. Qué cambió respecto a la versión 1

| Área | V1 (Etapa 1) | V2 (Etapa 2) |
|---|---|---|
| **Tecnología** | HTML, CSS y JavaScript sueltos | React 19, React Router 7, React Bootstrap |
| **Datos** | Datos escritos a mano en el HTML | `localStorage` detrás de 8 services, con los datos del SQL |
| **Navegación** | Un archivo `.html` por página | SPA con rutas y layouts compartidos |
| **Sesión** | No existía | `AuthContext` + rutas protegidas por tipo de usuario |
| **Compra** | Carrito estático | Carrito real + **checkout + boleta + pago rechazado** |
| **Catálogo** | Lista fija | Filtros por categoría (en la URL) y por nivel, **categorías**, **ofertas** |
| **Administración** | 8 páginas de maqueta | 7 páginas funcionales con CRUD, stock y auditoría |
| **Pruebas** | Ninguna | **448 pruebas con Jasmine y Karma, 97 % de líneas** |
| **Responsivo** | Parcial | Verificado automáticamente en todas las rutas |

**Requisitos de la V1 que se retiraron.** El mockup proponía `rareza`, `codigo`
(ARM-LEG-001), `bonos`, `razaRequerida`, `peso`, `edad` y los roles CLIENTE y VENDEDOR.
Ninguno existe en el SQL, así que se descartaron por RC-01. La rareza volvió, pero como
atributo **derivado** (ver 3.5.1), no como columna.

---

## 7. Requisitos previstos para la Etapa 3

| ID | Requisito | Nota |
|---|---|---|
| RF-37 | Los services llaman a una API REST de Spring Boot en vez de `localStorage` | Las páginas no cambian |
| RF-38 | Autenticación con contraseñas cifradas y token | Reemplaza el `password` en texto plano |
| RF-39 | Agregar a la base: `password` en JUGADOR y MERCADER, `email` en MERCADER, `imagen` en PRODUCTO | Ya identificado en la Etapa 1 |
| RF-40 | Pasarela de pago real en lugar del pago simulado del checkout | |
| RNF-10 | Despliegue en AWS EC2 y Azure | |
| RNF-11 | Pruebas de integración contra la API y pruebas end-to-end | Ver `docs/cobertura-testing.md`, sección 6 |
