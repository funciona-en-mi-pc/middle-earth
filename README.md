# Middle-earth: The Lost Age

Tienda de equipamiento para un videojuego RPG de El Señor de los Anillos: un **jugador** compra armas, armaduras, pociones y accesorios, y lo atiende un **mercader**.

Proyecto Fullstack de Duoc UC — **Javier Vega** y **José Fierro**.

El modelo de datos y las reglas de negocio vienen del script Oracle `tienda_tierra_media.sql` de la etapa 1. El diseño visual viene del mockup HTML de la misma etapa.

## Etapas

| Etapa | Contenido | Estado |
|---|---|---|
| 1 | Mockup en HTML, CSS y JS + base de datos Oracle PL/SQL | Entregada |
| 2 | Frontend en React: React Bootstrap, diseño responsivo, pruebas con Jasmine y Karma, despliegue en AWS EC2 | En curso |
| 3 | Backend Spring Boot con API REST, Postman, despliegue en EC2 y Azure | Pendiente |

En la etapa 2 **no hay servidor**: las nueve tablas del SQL viven en `localStorage`, siempre a través de `src/services/`. En la etapa 3 solo cambian los services, que pasarán a llamar a la API. Las páginas no se tocan.

## Cómo arrancar

```bash
npm install     # la primera vez, y después de cada git pull
npm run dev     # abre http://localhost:5173
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo, con recarga automática |
| `npm run build` | Genera la versión final en `dist/` |
| `npm run preview` | Sirve `dist/` para probar la versión final |
| `npm run lint` | Revisa errores en el código |

## Estructura

```
src/
├── assets/      imágenes y tipografías (Cinzel, Spectral) del mockup
├── components/  piezas reutilizables: Navbar, Footer, CintaRegion…
├── layouts/     el marco de la tienda y el del panel de administración
├── pages/       una página por ruta (y pages/admin/ para el panel)
├── context/     estado compartido por toda la app: la sesión
├── services/    acceso a datos. Hoy localStorage, en la etapa 3 la API REST
├── utils/       funciones puras: validaciones y formatos
├── data/        los datos iniciales, copiados del script SQL
└── styles/      la paleta y los estilos del reino
```

Las nueve tablas del SQL tienen su reflejo en el frontend: catálogo, ventas, detalle, movimientos de stock y auditoría.

## Usuarios de prueba

| Tipo | Correo | Contraseña | Nota |
|---|---|---|---|
| Jugador | `aragorn@gondor.me` | `aragorn123` | Nivel 25 |
| Jugador | `frodo@comarca.me` | `frodo123` | Nivel 5 |
| Jugador | `boromir@gondor.me` | `boromir123` | INACTIVO: el login lo rechaza |
| Mercader | `elrond@rivendel.me` | `elrond123` | ADMINISTRADOR |
| Mercader | `cebadilla@pony.me` | `cebadilla1` | VENDEDOR |

La lista completa está en `CONTRATO.md`.

## Documentos de la entrega

| Documento | Qué es |
|---|---|
| [`docs/ERS-v2.md`](docs/ERS-v2.md) | Especificación de requisitos, versión 2 (etapa 2) |
| [`docs/cobertura-testing.md`](docs/cobertura-testing.md) | Propuesta y análisis de las pruebas |

## Para trabajar en equipo

- **`CONTRATO.md`** tiene los nombres de los campos, las firmas de los services, el dueño de cada archivo y las reglas de negocio. **Hay que leerlo antes de escribir código.**
- **Tablero de tareas:** https://github.com/orgs/funciona-en-mi-pc/projects/1
- Cada uno hace commit solo en su rama: `dev-javier` o `dev-jose`. A `main` se llega únicamente en las reuniones de hito.
