const db = require('../config/db');

// =========================================================
// 1. REGISTRAR CLIENTE
// =========================================================
exports.createCliente = async (req, res) => {
    const { nombre, razon_social, ci_nit, telefono, email, microempresa_id_manual } = req.body;
    const { rol, microempresa_id } = req.user;

    // LÓGICA DE ASIGNACIÓN:
    // Super Admin puede asignar manualmente. Usuario normal se asigna a sí mismo.
    let idEmpresaFinal = microempresa_id;
    if (rol === 'super_admin' && microempresa_id_manual) {
        idEmpresaFinal = microempresa_id_manual;
    }

    try {
        // Limpieza de nulos
        const emailFinal = (email && email.trim() !== '') ? email : null;
        const razonSocialFinal = (razon_social && razon_social.trim() !== '') ? razon_social : null;
        const telefonoFinal = (telefono && telefono.trim() !== '') ? telefono : null;

        await db.execute(
            `INSERT INTO CLIENTE 
            (nombre, razon_social, ci_nit, telefono, email, microempresa_id, estado) 
            VALUES (?, ?, ?, ?, ?, ?, 'activo')`,
            [nombre, razonSocialFinal, ci_nit, telefonoFinal, emailFinal, idEmpresaFinal]
        );

        res.status(201).json({ message: "Cliente registrado con éxito" });
    } catch (error) {
        console.error("ERROR EN SQL CREATE:", error); 
        res.status(500).json({ error: error.message });
    }
};

// =========================================================
// 2. MODIFICAR CLIENTE (Edición completa)
// =========================================================
exports.updateCliente = async (req, res) => {
    const { id } = req.params;
    const { nombre, razon_social, ci_nit, telefono, email, estado } = req.body; 
    const { rol, microempresa_id } = req.user;

    try {
        let query = '';
        let params = [];

        const emailFinal = (email && email.trim() !== '') ? email : null;
        const razonSocialFinal = (razon_social && razon_social.trim() !== '') ? razon_social : null;
        const telefonoFinal = (telefono && telefono.trim() !== '') ? telefono : null;

        if (rol === 'super_admin') {
            query = `UPDATE CLIENTE SET nombre=?, razon_social=?, ci_nit=?, telefono=?, email=?, estado=? WHERE id_cliente=?`;
            params = [nombre, razonSocialFinal, ci_nit, telefonoFinal, emailFinal, estado, id];
        } else {
            query = `UPDATE CLIENTE SET nombre=?, razon_social=?, ci_nit=?, telefono=?, email=?, estado=? WHERE id_cliente=? AND microempresa_id=?`;
            params = [nombre, razonSocialFinal, ci_nit, telefonoFinal, emailFinal, estado, id, microempresa_id];
        }

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se pudo actualizar (no encontrado o sin permiso)" });
        }

        res.json({ message: "Cliente actualizado correctamente" });
    } catch (error) {
        console.error("ERROR EN SQL UPDATE:", error);
        res.status(500).json({ error: error.message });
    }
};

// =========================================================
// 3. CAMBIAR ESTADO (INTERRUPTOR / SWITCH)
// =========================================================
exports.toggleEstado = async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body; // Esperamos 'activo' o 'inactivo'
    const { rol, microempresa_id } = req.user;

    // Validación básica
    if (!['activo', 'inactivo'].includes(nuevoEstado)) {
        return res.status(400).json({ message: "Estado inválido. Use 'activo' o 'inactivo'" });
    }

    try {
        let query = '';
        let params = [];

        if (rol === 'super_admin') {
            query = 'UPDATE CLIENTE SET estado = ? WHERE id_cliente = ?';
            params = [nuevoEstado, id];
        } else {
            // Usuario normal: Solo cambia estado de SUS clientes
            query = 'UPDATE CLIENTE SET estado = ? WHERE id_cliente = ? AND microempresa_id = ?';
            params = [nuevoEstado, id, microempresa_id];
        }

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No se pudo cambiar el estado" });
        }

        res.json({ message: `Estado actualizado a ${nuevoEstado}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// =========================================================
// 4. OBTENER LISTA DE CLIENTES
// =========================================================
exports.getClientes = async (req, res) => {
    const { rol, microempresa_id } = req.user; 

    try {
        let query = '';
        let params = [];

        // NOTA IMPORTANTE:
        // Quitamos el filtro "WHERE estado = 'activo'" para que la lista
        // muestre también los inactivos (con el switch apagado).

        if (rol === 'super_admin') {
            query = `
                SELECT c.*, m.nombre as empresa_nombre 
                FROM CLIENTE c 
                JOIN MICROEMPRESA m ON c.microempresa_id = m.id_microempresa 
                ORDER BY c.id_cliente DESC
            `;
        } else {
            query = `
                SELECT * FROM CLIENTE 
                WHERE microempresa_id = ? 
                ORDER BY id_cliente DESC
            `;
            params = [microempresa_id];
        }

        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// =========================================================
// 5. ELIMINAR (Borrado Lógico - Opción Legacy)
// =========================================================
// Esta función se mantiene por si en algún lugar sigues usando 
// el botón de eliminar clásico en vez del switch.
exports.deleteCliente = async (req, res) => {
    const { id } = req.params;
    const { rol, microempresa_id } = req.user;

    try {
        let query = '';
        let params = [];

        if (rol === 'super_admin') {
            query = 'UPDATE CLIENTE SET estado = "inactivo" WHERE id_cliente = ?';
            params = [id];
        } else {
            query = 'UPDATE CLIENTE SET estado = "inactivo" WHERE id_cliente = ? AND microempresa_id = ?';
            params = [id, microempresa_id];
        }

        const [result] = await db.execute(query, params);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Error al eliminar" });

        res.json({ message: "Cliente desactivado correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// =========================================================
// 6. LISTAR EMPRESAS (Para Selector del Super Admin)
// =========================================================
exports.getListaEmpresasParaSelector = async (req, res) => {
    try {
        const [empresas] = await db.execute(
            'SELECT id_microempresa, nombre FROM MICROEMPRESA WHERE estado = "activa" ORDER BY nombre ASC'
        );
        res.json(empresas);
    } catch (error) {
        console.error("Error cargando empresas:", error);
        res.status(500).json({ error: "Error al cargar lista de empresas" });
    }
};
// =========================================================
// 3. EDITAR CLIENTE (CORREGIDO Y MEJORADO)
// =========================================================
exports.updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, razon_social, ci_nit, telefono, email, microempresa_id_manual } = req.body;

        // 1. Verificar si el cliente existe
        const [existente] = await db.query('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
        if (existente.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // 2. Verificar permisos (Seguridad)
        if (req.user.rol !== 'super_admin') {
            if (existente[0].microempresa_id !== req.user.microempresa_id) {
                return res.status(403).json({ message: 'No tienes permiso para editar este cliente' });
            }
        }

        // 3. VALIDACIÓN DE DUPLICADOS (CI/NIT y EMAIL)
        // Buscamos si hay OTRO cliente (id != id actual) con el mismo CI
        const [duplicadoCi] = await db.query(
            'SELECT id_cliente FROM cliente WHERE ci_nit = ? AND id_cliente != ?', 
            [ci_nit, id]
        );
        if (duplicadoCi.length > 0) {
            return res.status(400).json({ message: `El CI/NIT ${ci_nit} ya está registrado en otro cliente.` });
        }

        // 4. Preparar la consulta de actualización
        // Usamos valores NULL si los campos vienen vacíos para mantener limpieza en la BD
        let query = 'UPDATE cliente SET nombre=?, razon_social=?, ci_nit=?, telefono=?, email=?';
        let params = [
            nombre, 
            razon_social || null, 
            ci_nit, 
            telefono || null, 
            email || null
        ];

        // Solo el Super Admin puede cambiar la empresa
        if (req.user.rol === 'super_admin' && microempresa_id_manual) {
            query += ', microempresa_id=?';
            params.push(microempresa_id_manual);
        }

        query += ' WHERE id_cliente=?';
        params.push(id);

        // 5. Ejecutar actualización
        await db.query(query, params);
        
        res.json({ message: 'Cliente actualizado correctamente' });

    } catch (error) {
        console.error("❌ Error en updateCliente:", error);
        
        // Mensaje de error más descriptivo si falla la BD
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Ya existe un cliente con ese CI o Email.' });
        }
        
        res.status(500).json({ message: 'Error interno al actualizar (revisa la terminal)' });
    }
};