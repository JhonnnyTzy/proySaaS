const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware CORS actualizado para aceptar puerto 5174
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/password', passwordRoutes); 

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend funcionando ✅',
        timestamp: new Date().toISOString(),
        port: process.env.PORT
    });
});

// Ruta de prueba POST
app.post('/api/test-post', (req, res) => {
    res.json({ 
        message: 'POST funcionando ✅',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Servidor backend corriendo en:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`✅ Endpoints de recuperación de contraseña activos`);
});