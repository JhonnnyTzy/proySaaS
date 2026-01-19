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