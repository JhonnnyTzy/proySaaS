const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, clienteController.createCliente);
router.get('/', verifyToken, clienteController.getClientes);
router.get('/eliminados', verifyToken, clienteController.getEliminados);
router.put('/:id', verifyToken, clienteController.updateCliente);
router.delete('/:id', verifyToken, clienteController.deleteCliente);

module.exports = router;