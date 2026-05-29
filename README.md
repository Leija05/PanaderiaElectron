# DulceHorno - Punto de Venta para Panadería

DulceHorno es una aplicación de escritorio creada con Electron para administrar una panadería desde una sola interfaz: ventas, autocobro, inventario, usuarios, proveedores, recepciones, devoluciones, reportes y cortes de turno. El proyecto usa una ventana Electron con una interfaz web local y una base de datos MySQL llamada `panaderia`.

## Índice

- [Descripción general](#descripción-general)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Requisitos](#requisitos)
- [Instalación y ejecución local](#instalación-y-ejecución-local)
- [Configuración de base de datos](#configuración-de-base-de-datos)
- [Scripts disponibles](#scripts-disponibles)
- [Flujo de arranque de la aplicación](#flujo-de-arranque-de-la-aplicación)
- [Módulos funcionales](#módulos-funcionales)
- [Roles y permisos](#roles-y-permisos)
- [Canales de venta](#canales-de-venta)
- [API IPC entre renderer y main process](#api-ipc-entre-renderer-y-main-process)
- [Modelo de datos](#modelo-de-datos)
- [Actualizaciones automáticas](#actualizaciones-automáticas)
- [Empaquetado y distribución](#empaquetado-y-distribución)
- [Consideraciones de seguridad y mantenimiento](#consideraciones-de-seguridad-y-mantenimiento)
- [Solución de problemas](#solución-de-problemas)

## Descripción general

La aplicación está orientada a la operación diaria de una panadería. Permite:

- Iniciar sesión como gerente, empleado o cliente.
- Registrar ventas desde caja de empleado o desde autocobro.
- Mantener inventario de productos con mínimos y alertas de reorden.
- Registrar productos, usuarios y proveedores.
- Recibir mercancía de proveedores y devolver recepciones.
- Procesar devoluciones de clientes y reintegrar inventario.
- Consultar ventas, detalles, reportes operativos y movimientos auxiliares.
- Realizar cortes de turno autorizados por un gerente.
- Bloquear el uso cuando existe una actualización obligatoria pendiente.

## Arquitectura del proyecto

DulceHorno sigue la arquitectura típica de Electron:

1. **Proceso principal (`src/main.js`)**
   - Crea la ventana principal de Electron.
   - Configura `electron-updater` y emite estados de actualización.
   - Se conecta a MySQL mediante el módulo de conexión.
   - Expone operaciones de negocio a través de `ipcMain.handle`.
   - Ejecuta transacciones para ventas, recepciones, devoluciones y cortes.
   - Crea tablas de soporte si no existen y carga datos demo cuando la base está vacía.

2. **Preload (`src/preload.js`)**
   - Expone una API segura en `window.api` con `contextBridge`.
   - Encapsula todas las llamadas `ipcRenderer.invoke` usadas por la interfaz.
   - Registra un listener para recibir el estado de actualización desde el proceso principal.

3. **Renderer (`src/views/index.html`, `src/views/js/app.js`, `src/views/css/styles.css`)**
   - Renderiza toda la UI en el contenedor `#app-container`.
   - Controla navegación por rol, carrito, formularios, modales, reportes y tema visual.
   - Usa `window.api` para llamar al proceso principal.

4. **Base de datos (`src/database/Panaderia.sql`)**
   - Define el esquema base de MySQL.
   - Incluye datos iniciales para categorías, usuarios, proveedores, productos, ventas, detalles y envíos.
   - El proceso principal complementa el esquema con tablas operativas agregadas en tiempo de ejecución.

## Estructura de carpetas

```text
PanaderiaElectron/
├── assets/
│   └── icon.ico                     # Icono usado por electron-builder en Windows
├── src/
│   ├── database/
│   │   └── Panaderia.sql             # Script base para crear y poblar la BD MySQL
│   ├── includes/
│   │   └── conexion.js               # Configuración de conexión MySQL
│   ├── views/
│   │   ├── css/
│   │   │   └── styles.css            # Estilos de toda la interfaz
│   │   ├── js/
│   │   │   └── app.js                # Aplicación frontend y navegación
│   │   └── index.html                # HTML raíz cargado por Electron
│   ├── main.js                       # Proceso principal, IPC, lógica de negocio y updater
│   └── preload.js                    # Puente seguro entre renderer y main
└── package.json                      # Metadatos, scripts, dependencias y configuración de build
```

## Requisitos

- Node.js compatible con Electron 26.
- npm.
- MySQL Server ejecutándose en la máquina local.
- Una base de datos llamada `panaderia` o permisos para crearla con el script SQL.
- En Windows, para empaquetar instaladores NSIS, un entorno compatible con `electron-builder`.

Dependencias principales:

- `electron`: shell de escritorio.
- `mysql`: conexión a la base de datos.
- `electron-updater`: búsqueda, descarga e instalación de actualizaciones.
- `electron-log`: registro de eventos de actualización.
- `electron-builder`: empaquetado y publicación.

## Instalación y ejecución local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear la base de datos con el script incluido:

   ```bash
   mysql -u root < src/database/Panaderia.sql
   ```

3. Revisar la conexión en `src/includes/conexion.js`. Por defecto usa:

   ```js
   host: 'localhost'
   user: 'root'
   database: 'panaderia'
   password: ''
   ```

4. Iniciar la aplicación:

   ```bash
   npm start
   ```

## Configuración de base de datos

El proyecto espera una instancia MySQL local. El archivo `src/includes/conexion.js` crea una única conexión con:

- Host: `localhost`.
- Usuario: `root`.
- Base de datos: `panaderia`.
- Contraseña: vacía.

> Nota: el script `Panaderia.sql` crea `Panaderia` con mayúscula inicial. En sistemas donde MySQL distingue mayúsculas y minúsculas en nombres de base de datos, asegúrate de que el nombre real coincida con `panaderia` o ajusta `conexion.js`.

### Datos iniciales

El script SQL incluye:

- Categorías: panes, pasteles, galletas y bebidas.
- Usuarios base: gerente, empleados y clientes.
- Proveedores de ejemplo.
- Artículos de inventario.
- Ventas, detalles de venta y envíos de demostración.

Además, `src/main.js` ejecuta `seedRandomDataIfEmpty()` al arrancar. Si detecta que no hay artículos, usuarios operativos o ventas, inserta datos demo adicionales para facilitar pruebas.

### Tablas creadas o aseguradas en tiempo de ejecución

Al iniciar, `ensureSupportTables()` crea tablas complementarias si no existen:

- `VentasCanal`: clasifica ventas como `Autocobro`, `CajaEmpleado` o `SinClasificar`.
- `CortesTurno`: registra cortes autorizados por gerente.
- `RecepcionesProveedor`: encabezado de recepciones de proveedores.
- `RecepcionProveedorDetalle`: detalle de productos recibidos.
- `DevolucionesCliente`: encabezado de devoluciones a cliente.
- `DevolucionClienteDetalle`: detalle de productos devueltos.

## Scripts disponibles

Los scripts están definidos en `package.json`:

| Script | Comando | Uso |
| --- | --- | --- |
| `start` | `electron .` | Ejecuta la aplicación en modo local. |
| `clean` | `rimraf dist` | Elimina la carpeta de salida de builds. |
| `prebuild` | `npm run clean` | Limpieza automática antes de construir. |
| `predist` | `npm run clean` | Limpieza automática antes de distribuir. |
| `build` | `electron-builder` | Genera el paquete instalable local. |
| `dist` | `electron-builder --publish always` | Genera y publica releases según configuración. |

## Flujo de arranque de la aplicación

1. Electron inicia desde `src/main.js`, indicado por el campo `main` de `package.json`.
2. Se importa la conexión MySQL desde `src/includes/conexion.js`.
3. Se crean o validan tablas de soporte.
4. Se siembran datos demo si la base está vacía.
5. `createWindow()` crea una ventana de 1200 x 800 pixeles con `preload.js`.
6. Se carga `src/views/index.html`.
7. `src/views/js/app.js` inicializa el tema, comprueba actualizaciones y renderiza login o la última vista por rol.
8. La UI invoca operaciones mediante `window.api`, que viaja por IPC hacia `src/main.js`.

## Módulos funcionales

### Inicio de sesión

- Valida usuario, contraseña y estado activo.
- Distingue roles `Cliente`, `Empleado` y `Gerente`.
- Evita el acceso si el usuario está desactivado.

### Dashboard

- Muestra opciones según el rol autenticado.
- Conserva la última vista en `localStorage`.
- Incluye controles de tema claro/oscuro y estado de actualización.

### Gestión de usuarios

- Alta de clientes, empleados y gerentes.
- Edición de datos generales.
- Desactivación o reactivación segura.
- Eliminación lógica cuando existen ventas relacionadas, para preservar historial.

### Gestión de proveedores

- Alta de proveedores con dirección, teléfono, correo, contacto y RUC.
- Listado y cambio de estado a través del canal de estado compartido.

### Inventario y productos

- Alta de artículos con nombre, descripción, cantidad, mínimo, precio de venta y precio de compra.
- Incremento manual de cantidad.
- Disminución/eliminación de cantidad con movimiento de inventario.
- Verificación de existencia antes de vender.
- Alertas cuando la cantidad está por debajo del mínimo.

### Ventas y carrito

- Carrito en memoria en el renderer.
- Validación de stock antes de registrar venta.
- Registro transaccional de venta, detalle y movimientos de inventario.
- Clasificación por canal (`Autocobro` o `CajaEmpleado`).
- Ticket visual al finalizar venta.

### Recepciones de proveedor

- Registro de recepción con folio generado.
- Captura de líneas con producto, cantidad y costo unitario.
- Actualización de existencias y precio de compra.
- Registro de movimientos de inventario de entrada.
- Edición de recepciones mediante reversión y reaplicación de cantidades.
- Devolución de recepción, restando inventario cuando hay existencias suficientes.

### Devoluciones de cliente

- Consulta de venta y productos vendidos.
- Captura de cantidades a devolver.
- Reintegro del inventario.
- Registro del folio de devolución y detalle.
- Movimiento de inventario tipo entrada con referencia a la venta.

### Reportes

- Rango diario, semanal, mensual, anual o personalizado.
- Resumen de ventas, ingresos, artículos vendidos y productos con stock bajo.
- Ventas por día.
- Ventas por canal.
- Productos más vendidos.
- Inventario actual y exportación CSV.
- Estimación de kilos de bolillo vendidos usando el peso constante de 0.065 kg por pieza.

### Cortes de turno

- Solicitan autorización de gerente.
- Calculan ventas desde el último corte para el canal y usuario correspondiente.
- Guardan resumen JSON, total de ventas, total de importe, fecha de inicio y fin.

### Tema y persistencia local

La interfaz guarda preferencias en `localStorage`:

- `panaderia-tema`: tema visual.
- `panaderia-ultima-vista`: última vista abierta por rol.
- `panaderia-update-vista`: control de notificaciones de actualización.

## Roles y permisos

| Rol | Capacidades principales |
| --- | --- |
| Cliente | Modo autocobro, carrito, compra de productos y visualización de ticket. |
| Empleado | Operación de caja, ventas, consulta de productos e inventario operativo. |
| Gerente | Administración completa: usuarios, proveedores, inventario, reportes, recepciones, devoluciones y cortes. |

La lógica de navegación vive principalmente en `renderDashboard()` y `renderPage()` dentro del renderer. La autorización crítica de cortes se refuerza en el proceso principal al validar credenciales de gerente.

## Canales de venta

El sistema maneja tres valores:

- `Autocobro`: venta realizada por un cliente sin empleado cajero.
- `CajaEmpleado`: venta realizada por empleado.
- `SinClasificar`: respaldo para ventas históricas sin canal registrado.

`sanitizeChannel()` normaliza el canal antes de persistirlo, y `VentasCanal` permite separar reportes y cortes por origen.

## API IPC entre renderer y main process

El preload expone métodos en `window.api`. Estos métodos invocan handlers registrados en `src/main.js`.

### Autenticación y usuarios

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `login(username, password, activo)` | `login` | Inicia sesión. |
| `registrarUsuario(data)` | `registrarUsuario` | Crea cliente, empleado o gerente. |
| `modificarUsuario(data)` | `modificarUsuario` | Actualiza datos de usuario. |
| `deleteUsuario(idEmpleado)` | `deleteUsuario` | Elimina o desactiva usuario según dependencias. |
| `cambiarEstadoUsuario(idEmpleado, nuevoEstado)` | `cambiarEstadoUsuario` | Activa o desactiva usuario. |

### Proveedores

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `registrarProveedor(data)` | `registrarProveedor` | Crea proveedor. |
| `getProveedores()` | `getProveedores` | Lista proveedores. |
| `cambiarEstadoProveedor(idProveedor, nuevoEstado)` | `cambiarEstadoUsuario` | Cambia estado usando el mismo handler expuesto. |

> Observación: `cambiarEstadoProveedor` en el preload apunta al handler `cambiarEstadoUsuario`. Si se requiere diferenciar proveedores y usuarios, conviene crear un handler exclusivo para proveedores.

### Productos e inventario

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `getProductos()` | `getProductos` | Lista artículos. |
| `registrarProducto(data)` | `registrarProducto` | Expone registro de producto desde renderer. |
| `agregarProducto(productoData)` | `agregarProducto` | Inserta producto. |
| `agregarCantidadProducto(idArticulo, cantidad)` | `agregarCantidadProducto` | Aumenta existencias. |
| `eliminarProducto(idArticulo, cantidad)` | `eliminarProducto` | Disminuye existencias. |
| `verificarExistencia(idArticulo, cantidad)` | `verificarExistencia` | Valida stock disponible. |
| `getAuxiliarMovimientos(payload)` | `getAuxiliarMovimientos` | Consulta movimientos de inventario. |

> Observación: el preload expone `registrarProducto`, pero en `src/main.js` el handler visible para crear productos es `agregarProducto`. Si se usa `registrarProducto` desde la UI, debe existir un handler compatible o ajustarse el nombre.

### Ventas y devoluciones

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `registrarVenta(ventaData)` | `registrarVenta` | Registra venta, detalle, salida de inventario y canal. |
| `getVentas()` | `getVentas` | Lista ventas. |
| `getDetallesVenta(idVenta)` | `getDetallesVenta` | Lista productos de una venta. |
| `getDevolucionesCliente()` | `getDevolucionesCliente` | Lista devoluciones registradas. |
| `registrarDevolucionCliente(payload)` | `registrarDevolucionCliente` | Registra devolución y reintegra stock. |

### Recepciones de proveedor

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `getRecepcionesProveedor()` | `getRecepcionesProveedor` | Lista recepciones. |
| `getRecepcionProveedorDetalle(idRecepcion)` | `getRecepcionProveedorDetalle` | Obtiene encabezado y detalle. |
| `registrarRecepcionProveedor(payload)` | `registrarRecepcionProveedor` | Crea recepción y entradas de inventario. |
| `modificarRecepcionProveedor(payload)` | `modificarRecepcionProveedor` | Recalcula recepción e inventario. |
| `devolverRecepcionProveedor(payload)` | `devolverRecepcionProveedor` | Marca recepción devuelta y descuenta stock. |

### Reportes, cortes y actualizaciones

| Método renderer | Handler IPC | Descripción |
| --- | --- | --- |
| `getReportes(filters)` | `getReportes` | Calcula reportes por rango. |
| `registrarCorteTurno(payload)` | `registrarCorteTurno` | Guarda corte autorizado por gerente. |
| `getUpdateStatus()` | `getUpdateStatus` | Obtiene estado actual del updater. |
| `retryUpdateCheck()` | `retryUpdateCheck` | Reintenta búsqueda de actualización. |
| `installPendingUpdate()` | `installPendingUpdate` | Instala actualización descargada. |
| `onUpdateStatus(callback)` | evento `update-status` | Escucha cambios de estado de actualización. |

## Modelo de datos

### Esquema base (`Panaderia.sql`)

| Tabla | Propósito |
| --- | --- |
| `Categorias` | Clasificación de artículos. |
| `Empleados` | Usuarios del sistema; incluye clientes, empleados y gerentes. |
| `Articulos` | Productos con inventario, mínimo y precios. |
| `Proveedores` | Datos de proveedores. |
| `Compras` | Compras a proveedor. |
| `CompraDetalle` | Detalle de compras. |
| `Ventas` | Encabezado de ventas. |
| `VentaDetalle` | Productos vendidos por venta. |
| `Envios` | Información de entrega para ventas delivery. |
| `MovimientosInventario` | Kardex de entradas, salidas y ajustes. |

### Esquema complementario creado por la app

| Tabla | Propósito |
| --- | --- |
| `VentasCanal` | Canal asociado a cada venta. |
| `CortesTurno` | Cortes por canal y usuario. |
| `RecepcionesProveedor` | Recepción de mercancía. |
| `RecepcionProveedorDetalle` | Productos recibidos. |
| `DevolucionesCliente` | Devoluciones asociadas a ventas. |
| `DevolucionClienteDetalle` | Productos devueltos por cliente. |

## Actualizaciones automáticas

El proceso principal configura `electron-updater` para consultar releases de GitHub. El estado de actualización mantiene:

- Estado (`checking`, `available`, `downloading`, `downloaded`, `not-available`, `error`).
- Versión actual y versión disponible.
- Progreso de descarga.
- Mensaje para mostrar en la UI.
- Indicador `mandatory`, usado para bloquear la aplicación hasta actualizar.

La interfaz muestra banners y pantallas de bloqueo cuando hay una actualización obligatoria descargada o en proceso.

## Empaquetado y distribución

La configuración `build` de `package.json` usa:

- `appId`: `com.dulcehorno.app`.
- `productName`: `DulceHorno`.
- Archivos incluidos: `src/**/*`, `assets/**/*` y `package.json`.
- Publicación en GitHub: propietario `Leija05`, repositorio `PanaderiaElectron`.
- Target Windows: `nsis`.
- Icono: `assets/icon.ico`.

Comandos:

```bash
npm run build
npm run dist
```

`npm run dist` publicará siempre que el entorno tenga credenciales válidas para GitHub y permisos sobre el repositorio configurado.

## Consideraciones de seguridad y mantenimiento

- Las contraseñas se guardan en texto plano. Para producción, se recomienda usar hashing seguro como bcrypt o argon2.
- La conexión MySQL usa `root` sin contraseña. Para producción, se recomienda crear un usuario específico con permisos mínimos.
- Hay validaciones de stock y transacciones en operaciones críticas, pero conviene agregar pruebas automatizadas para ventas, recepciones y devoluciones.
- La UI se renderiza con plantillas HTML desde JavaScript; si se capturan datos externos, deben escaparse para reducir riesgo de inyección en el renderer.
- `contextBridge` ya limita el acceso directo de la UI a Electron, lo cual es una buena práctica.
- Conviene alinear los nombres de handlers IPC expuestos en preload con los handlers implementados en main.
- La base incluye datos demo. En producción se debe inicializar con datos reales y cambiar credenciales predeterminadas.

## Solución de problemas

### Error al conectar a MySQL

1. Verifica que MySQL esté iniciado.
2. Confirma usuario, contraseña y nombre de base en `src/includes/conexion.js`.
3. Ejecuta el script SQL si la base aún no existe.
4. Revisa si tu sistema distingue entre `Panaderia` y `panaderia`.

### La aplicación abre pero no carga datos

- Confirma que la consola no muestre errores de conexión.
- Verifica que existan las tablas base.
- Asegúrate de que el usuario de MySQL tenga permisos `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE` y transacciones.

### No aparecen actualizaciones

- Revisa que la versión de `package.json` sea menor que la versión del release publicado.
- Confirma que el release de GitHub exista y contenga artefactos generados por `electron-builder`.
- Verifica credenciales y configuración de publicación si estás usando `npm run dist`.

### Fallos al empaquetar

- Ejecuta `npm run clean` y vuelve a construir.
- Comprueba que `assets/icon.ico` exista.
- Asegúrate de instalar dependencias con `npm install` antes de ejecutar `npm run build`.
