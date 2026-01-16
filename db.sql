CREATE DATABASE IF NOT EXISTS gestion_microempresas;
USE gestion_microempresas;

-- 1. TABLA PLAN_PAGO (Independiente)
CREATE TABLE PLAN_PAGO (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,
    nombre_plan VARCHAR(50) NOT NULL,
    tipo_plan VARCHAR(50),
    precio DECIMAL(10,2) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    limite_usuarios INT,
    limite_productos INT,
    estado ENUM('suscrito', 'no suscrito') DEFAULT 'suscrito'
);

-- 2. TABLA MICROEMPRESA (Tenant)
CREATE TABLE MICROEMPRESA (
    id_microempresa INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nit VARCHAR(20) UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    moneda VARCHAR(10) DEFAULT 'BOB',
    estado ENUM('activa', 'inactiva') DEFAULT 'activa',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    plan_id INT,
    FOREIGN KEY (plan_id) REFERENCES PLAN_PAGO(id_plan)
);

-- 3. TABLA ROL
CREATE TABLE ROL (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    tipo_rol ENUM('super_admin', 'administrador', 'microempresa_P', 'vendedor') NOT NULL
);

-- 4. TABLA USUARIO
CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    microempresa_id INT, -- Puede ser NULL si es Super Admin
    rol_id INT,
    FOREIGN KEY (microempresa_id) REFERENCES MICROEMPRESA(id_microempresa),
    FOREIGN KEY (rol_id) REFERENCES ROL(id_rol)
);

-- 5. TABLA CLIENTE
CREATE TABLE CLIENTE (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_razon_social VARCHAR(150) NOT NULL,
    ci_nit VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- 6. TABLA PROVEEDOR
CREATE TABLE PROVEEDOR (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20)
);

-- 7. TABLA PRODUCTO
CREATE TABLE PRODUCTO (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock_actual INT DEFAULT 0,
    stock_minimo INT DEFAULT 0,
    estado ENUM('discontinuado', 'stock') DEFAULT 'stock',
    categoria VARCHAR(50),
    microempresa_id INT,
    FOREIGN KEY (microempresa_id) REFERENCES MICROEMPRESA(id_microempresa)
);

-- 8. TABLA PEDIDO (Ventas)
CREATE TABLE PEDIDO (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    estado VARCHAR(50),
    usuario_id INT,
    cliente_id INT,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(id_cliente)
);

-- 9. TABLA DETALLE_PEDIDO
CREATE TABLE DETALLE_PEDIDO (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES PEDIDO(id_pedido),
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id_producto)
);

-- 10. TABLA COMPRA
CREATE TABLE COMPRA (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_microempresa INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50),
    FOREIGN KEY (id_microempresa) REFERENCES MICROEMPRESA(id_microempresa)
);

-- 11. TABLA DETALLE_COMPRA
CREATE TABLE DETALLE_COMPRA (
    id_detalle_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT,
    id_producto INT,
    id_proveedor INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_compra) REFERENCES COMPRA(id_compra),
    FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto),
    FOREIGN KEY (id_proveedor) REFERENCES PROVEEDOR(id_proveedor)
);

-- 12. TABLA INVENTARIO_MOVIMIENTO
CREATE TABLE INVENTARIO_MOVIMIENTO (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    producto_id INT,
    usuario_id INT,
    microempresa_id INT,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id_producto),
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (microempresa_id) REFERENCES MICROEMPRESA(id_microempresa)
);






-------------
INSERT INTO ROL (tipo_rol) VALUES ('administrador');
INSERT INTO PLAN_PAGO (nombre_plan, precio) VALUES ('Básico', 0);
INSERT INTO MICROEMPRESA (nombre, nit, plan_id) VALUES ('Badass', '123456', 1);