const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken } = require('../middleware/auth');

// Solo usuarios autenticados pueden acceder a estas rutas
router.get('/', verifyToken, usuarioController.getUsuarios);
router.post('/', verifyToken, usuarioController.createUsuario);
router.put('/:id/estado', verifyToken, usuarioController.updateEstado);

module.exports = router;