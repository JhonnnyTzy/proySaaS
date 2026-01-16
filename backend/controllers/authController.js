const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRO DE USUARIO
exports.registrar = async (req, res) => {
    const { nombre, apellido, email, password, microempresa_id, rol_id } = req.body;
    
    try {
        // Verificar si el usuario ya existe
        const [existe] = await db.execute('SELECT * FROM USUARIO WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        /*//Prueba superadmin
        let empresaId = microempresa_id; 
        if (parseInt(rol_id) === 1) {
            empresaId = null;
        }*/

        //Insertar en la base de datos
        await db.execute(
            'INSERT INTO USUARIO (nombre, apellido, email, password, microempresa_id, rol_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, hashedPassword, microempresa_id, rol_id]
        );

        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar usuario" });
    }
};

// LOGIN DE USUARIO
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar usuario y su rol
        const [rows] = await db.execute(
            `SELECT u.*, r.tipo_rol, m.estado as empresa_estado, m.nombre as empresa_nombre
            FROM USUARIO u 
            JOIN ROL r ON u.rol_id = r.id_rol 
            LEFT JOIN MICROEMPRESA m ON u.microempresa_id = m.id_microempresa
            WHERE u.email = ?`, 
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const usuario = rows[0];

        // Verificar contraseña
        const validPass = await bcrypt.compare(password, usuario.password);
        if (!validPass) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // Verificar si el usuario está activo
        if (usuario.estado === 'inactivo') {
            return res.status(403).json({ message: "Usuario inactivo" });
        }

        // Generar Token JWT
        const token = jwt.sign(
            { 
                id: usuario.id_usuario, 
                rol: usuario.tipo_rol, 
                microempresa_id: usuario.microempresa_id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.tipo_rol,
                microempresa_id: usuario.microempresa_id,
                empresa_nombre: usuario.empresa_nombre,
                empresa_estado: usuario.empresa_estado
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// VERIFICAR TOKEN
exports.verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ valid: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar usuario actualizado
        const [rows] = await db.execute(
            `SELECT u.*, r.tipo_rol, m.estado as empresa_estado 
            FROM USUARIO u 
            JOIN ROL r ON u.rol_id = r.id_rol 
            LEFT JOIN MICROEMPRESA m ON u.microempresa_id = m.id_microempresa
            WHERE u.id_usuario = ?`, 
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ valid: false, message: "Usuario no encontrado" });
        }

        const usuario = rows[0];

        res.json({
            valid: true,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.tipo_rol,
                microempresa_id: usuario.microempresa_id,
                empresa_estado: usuario.empresa_estado,
                estado: usuario.estado
            }
        });
    } catch (error) {
        res.status(401).json({ valid: false, message: "Token inválido o expirado" });
    }
};

// CERRAR SESIÓN
exports.logout = (req, res) => {
    res.json({ message: "Sesión cerrada exitosamente" });
};