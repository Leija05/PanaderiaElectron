CREATE DATABASE IF NOT EXISTS Panaderia;
USE Panaderia;

-- =======================
-- Tabla de Categorías
-- =======================
CREATE TABLE Categorias (
    IdCategoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL UNIQUE,
    Descripcion VARCHAR(100)
);

-- =======================
-- Tabla de Empleados (ahora también incluye clientes)
-- =======================
CREATE TABLE Empleados (
    IdEmpleado INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(100) NOT NULL,
    Rol ENUM('Cliente', 'Empleado', 'Gerente') NOT NULL,
    Puesto VARCHAR(50),
    Turno ENUM('Matutino', 'Vespertino', 'Nocturno', 'Any') DEFAULT 'Any',
    Salario DECIMAL(10,2) DEFAULT 0.00,
    -- Campos adicionales para información personal
    NombreCompleto VARCHAR(100),
    Telefono VARCHAR(20),
    Email VARCHAR(100),
    Direccion VARCHAR(150),
    FechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    Activo BOOLEAN DEFAULT TRUE
);

-- =======================
-- Tabla de Artículos
-- =======================
CREATE TABLE Articulos (
    IdArticulo INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(200),
    IdCategoria INT,
    Cantidad INT NOT NULL DEFAULT 0,
    Minimo INT DEFAULT 5,
    PrecioVenta DECIMAL(10,2) NOT NULL,
    PrecioCompra DECIMAL(10,2),
    Activo BOOLEAN DEFAULT TRUE,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria)
);

-- =======================
-- Tabla de Proveedores
-- =======================
CREATE TABLE Proveedores (
    IdProveedor INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Direccion VARCHAR(150),
    Telefono VARCHAR(20),
    Correo VARCHAR(100),
    Contacto VARCHAR(100),
    RUC VARCHAR(20),
    Activo BOOLEAN DEFAULT TRUE
);

-- =======================
-- Tabla de Compras (a proveedores)
-- =======================
CREATE TABLE Compras (
    IdCompra INT AUTO_INCREMENT PRIMARY KEY,
    IdProveedor INT,
    IdEmpleado INT,
    FechaCompra DATETIME DEFAULT CURRENT_TIMESTAMP,
    FechaRecepcion DATETIME,
    Subtotal DECIMAL(10,2),
    Iva DECIMAL(10,2) DEFAULT 0.00,
    Total DECIMAL(10,2),
    Estado ENUM('Pendiente', 'Recibida', 'Cancelada') DEFAULT 'Pendiente',
    Observaciones TEXT,
    FOREIGN KEY (IdProveedor) REFERENCES Proveedores(IdProveedor),
    FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
);

-- =======================
-- Tabla de Detalles de Compras
-- =======================
CREATE TABLE CompraDetalle (
    IdDetalle INT AUTO_INCREMENT PRIMARY KEY,
    IdCompra INT,
    IdArticulo INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2),
    Subtotal DECIMAL(10,2),
    FOREIGN KEY (IdCompra) REFERENCES Compras(IdCompra) ON DELETE CASCADE,
    FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
);

-- =======================
-- Tabla de Ventas
-- =======================
CREATE TABLE Ventas (
    IdVenta INT AUTO_INCREMENT PRIMARY KEY,
    IdEmpleado INT, -- Empleado que realiza la venta
    IdCliente INT, -- Cliente (referencia a Empleados donde Rol = 'Cliente')
    FechaVenta DATETIME DEFAULT CURRENT_TIMESTAMP,
    Subtotal DECIMAL(10,2),
    Iva DECIMAL(10,2) DEFAULT 0.00,
    Total DECIMAL(10,2),
    TipoVenta ENUM('Mostrador', 'Delivery') DEFAULT 'Mostrador',
    Estado ENUM('Pendiente', 'Completada', 'Cancelada') DEFAULT 'Completada',
    FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado),
    FOREIGN KEY (IdCliente) REFERENCES Empleados(IdEmpleado)
);

-- =======================
-- Tabla de Detalle de Ventas
-- =======================
CREATE TABLE VentaDetalle (
    IdDetalle INT AUTO_INCREMENT PRIMARY KEY,
    IdVenta INT,
    IdArticulo INT,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2),
    Subtotal DECIMAL(10,2),
    FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta) ON DELETE CASCADE,
    FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo)
);

-- =======================
-- Tabla de Envíos
-- =======================
CREATE TABLE Envios (
    IdEnvio INT AUTO_INCREMENT PRIMARY KEY,
    IdVenta INT,
    IdEmpleadoRepartidor INT, -- Empleado que realiza el envío
    DireccionEntrega VARCHAR(150) NOT NULL,
    TelefonoContacto VARCHAR(20),
    CostoEnvio DECIMAL(10,2) DEFAULT 0.00,
    FechaEnvio DATETIME,
    FechaEntregaEstimada DATETIME,
    FechaEntregaReal DATETIME,
    Estado ENUM('Preparando', 'En ruta', 'Entregado', 'Cancelado') DEFAULT 'Preparando',
    Observaciones TEXT,
    FOREIGN KEY (IdVenta) REFERENCES Ventas(IdVenta),
    FOREIGN KEY (IdEmpleadoRepartidor) REFERENCES Empleados(IdEmpleado)
);

-- =======================
-- Tabla de Inventario (Movimientos)
-- =======================
CREATE TABLE MovimientosInventario (
    IdMovimiento INT AUTO_INCREMENT PRIMARY KEY,
    IdArticulo INT,
    TipoMovimiento ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
    Cantidad INT NOT NULL,
    CantidadAnterior INT,
    CantidadNueva INT,
    Motivo VARCHAR(100),
    IdReferencia INT, -- Id de compra, venta, etc.
    TipoReferencia ENUM('Compra', 'Venta', 'Ajuste') NOT NULL,
    IdEmpleado INT,
    FechaMovimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    Observaciones TEXT,
    FOREIGN KEY (IdArticulo) REFERENCES Articulos(IdArticulo),
    FOREIGN KEY (IdEmpleado) REFERENCES Empleados(IdEmpleado)
);

-- ===========================
-- INSERTS INICIALES
-- ===========================

-- Insertar categorías
INSERT INTO Categorias (Nombre, Descripcion) VALUES
('Panes', 'Variedad de panes dulces y salados'),
('Pasteles', 'Pasteles y postres'),
('Galletas', 'Galletas y biscochos'),
('Bebidas', 'Bebidas y refrescos');

-- Insertar empleados y clientes
INSERT INTO Empleados (NombreUsuario, Password, Rol, Puesto, Turno, Salario, NombreCompleto) VALUES
('admin', 'admin123', 'Gerente', 'Gerente General', 'Vespertino', 15000.00, 'Administrador Principal'),
('empleado1', 'empleado123', 'Empleado', 'Vendedor', 'Matutino', 8000.00, 'Juan Pérez Hernández'),
('cliente1', 'cliente123', 'Cliente', 'Usuario', 'Any', 0.00, 'María García López');

-- Insertar proveedores
INSERT INTO Proveedores (Nombre, Direccion, Telefono, Correo, Contacto) VALUES
('Harinas del Norte', 'Av. Central 123, Ciudad', '555-5678', 'contacto@harinasnorte.com', 'Roberto Mendoza'),
('Azúcar Real', 'Calle Dulce 45, Ciudad', '555-8765', 'ventas@azucarreal.com', 'Laura Sánchez'),
('Lácteos Frescos', 'Blvd. Industrial 789, Ciudad', '555-4321', 'pedidos@lacteosfrescos.com', 'Carlos Ruiz');

-- Insertar artículos
INSERT INTO Articulos (Nombre, Descripcion, IdCategoria, Cantidad, Minimo, PrecioVenta, PrecioCompra) VALUES
('Conchas', 'Pan dulce tradicional con cobertura azucarada', 1, 45, 20, 12.00, 6.50),
('Bolillos', 'Pan salado crujiente ideal para tortas', 1, 32, 30, 8.00, 3.20),
('Donas', 'Donas glaseadas con diferentes coberturas', 1, 18, 15, 15.00, 7.80),
('Panque de Vainilla', 'Panque esponjoso de vainilla', 2, 12, 10, 25.00, 12.50),
('Galletas de Mantequilla', 'Galletas crujientes de mantequilla', 3, 25, 20, 8.50, 3.80),
('Café Americano', 'Café negro americano', 4, 50, 30, 18.00, 6.00);

-- Insertar ventas de ejemplo
INSERT INTO Ventas (IdEmpleado, IdCliente, Subtotal, Iva, Total, TipoVenta) VALUES
(2, 3, 86.00, 13.76, 99.76, 'Mostrador'),
(2, 3, 40.00, 6.40, 46.40, 'Mostrador');

-- Insertar detalle de ventas
INSERT INTO VentaDetalle (IdVenta, IdArticulo, Cantidad, PrecioUnitario, Subtotal) VALUES
(1, 1, 3, 12.00, 36.00),
(1, 4, 2, 25.00, 50.00),
(2, 2, 5, 8.00, 40.00);

-- Insertar envíos de ejemplo
INSERT INTO Envios (IdVenta, IdEmpleadoRepartidor, DireccionEntrega, CostoEnvio, Estado) VALUES
(1, 2, 'Av. Reforma 123, Col. Centro', 25.00, 'Entregado'),
(2, 2, 'Calle 5 de Mayo 88, Col. Norte', 20.00, 'En ruta');