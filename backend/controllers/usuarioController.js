const db = require('../config/db');
const bcrypt = require('bcryptjs');

// OBTENER USUARIOS
exports.getUsuarios = async (req, res) => {
    try {
        let query = '';
        let params = [];

        if (req.user.rol === 'super_admin') {
            query = `SELECT u.*, r.tipo_rol, m.nombre as empresa_nombre 
                    FROM USUARIO u 
                    JOIN ROL r ON u.rol_id = r.id_rol 
                    LEFT JOIN MICROEMPRESA m ON u.microempresa_id = m.id_microempresa
                    ORDER BY u.fecha_creacion DESC`;
        } else if (['administrador', 'microempresa_P'].includes(req.user.rol)) {
            query = `SELECT u.*, r.tipo_rol 
                    FROM USUARIO u 
                    JOIN ROL r ON u.rol_id = r.id_rol 
                    WHERE u.microempresa_id = ? AND u.rol_id != 1
                    ORDER BY u.fecha_creacion DESC`;
            params = [req.user.microempresa_id];
        } else {
            return res.status(403).json({ message: "Acceso denegado" });
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREAR USUARIO
exports.createUsuario = async (req, res) => {
    const { nombre, apellido, email, password, rol_id } = req.body;
    
    try {
        // Verificar si el usuario ya existe
        const [existe] = await db.execute('SELECT * FROM USUARIO WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ message: "El correo ya está registrado" });
        }

        // Determinar microempresa_id según el rol
        let microempresa_id = req.user.microempresa_id;
        
        // Si es super_admin creando para otra empresa
        if (req.user.rol === 'super_admin' && req.body.microempresa_id) {
            microempresa_id = req.body.microempresa_id;
        }

        // Validar que no se cree super_admin desde otros roles
        if (rol_id == 1 && req.user.rol !== 'super_admin') {
            return res.status(403).json({ message: "No puedes crear usuarios super admin" });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar usuario
        await db.execute(
            'INSERT INTO USUARIO (nombre, apellido, email, password, microempresa_id, rol_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, email, hashedPassword, microempresa_id, rol_id]
        );

        res.status(201).json({ message: "Usuario creado con éxito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear usuario" });
    }
};

// ACTUALIZAR ESTADO DE USUARIO
exports.updateEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    
    try {
        // Verificar permisos
        const [usuario] = await db.execute(
            'SELECT microempresa_id, rol_id FROM USUARIO WHERE id_usuario = ?',
            [id]
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Super admin puede modificar cualquier usuario
        if (req.user.rol !== 'super_admin') {
            // Administradores solo pueden modificar usuarios de su empresa
            if (usuario[0].microempresa_id !== req.user.microempresa_id) {
                return res.status(403).json({ message: "No puedes modificar usuarios de otra empresa" });
            }
            
            // No pueden modificar super admins
            if (usuario[0].rol_id == 1) {
                return res.status(403).json({ message: "No puedes modificar super admins" });
            }
        }

        await db.execute(
            'UPDATE USUARIO SET estado = ? WHERE id_usuario = ?',
            [estado, id]
        );

        res.json({ message: `Usuario ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};