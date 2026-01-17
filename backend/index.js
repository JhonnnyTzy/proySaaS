const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

const clienteRoutes = require('./routes/clienteRoutes');
app.use('/api/clientes', clienteRoutes);

// --- 1. CONFIGURACIÓN DE CARPETA DE CARGAS ---
// Esto asegura que la carpeta 'uploads' exista para que Multer no de error
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('📁 Carpeta /uploads creada automáticamente');
}

// --- 2. MIDDLEWARES ---

// Servir archivos estáticos (para que las fotos se vean en el navegador)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de CORS
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsear JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 3. IMPORTAR RUTAS ---
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

// --- 4. USO DE RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/password', passwordRoutes); 

// --- 5. ENDPOINTS DE PRUEBA ---
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend funcionando ✅',
        timestamp: new Date().toISOString(),
        port: process.env.PORT
    });
});

app.post('/api/test-post', (req, res) => {
    res.json({ 
        message: 'POST funcionando ✅',
        data: req.body,
        timestamp: new Date().toISOString()
    });
});

// --- 6. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 ==========================================`);
    console.log(`✅ Servidor backend corriendo en:`);
    console.log(`   Punto de acceso: http://localhost:${PORT}`);
    console.log(`   Carpeta uploads: http://localhost:${PORT}/uploads`);
    console.log(`✅ Endpoints activos: Auth, Usuarios, Password`);
    console.log(`🚀 ==========================================\n`);
});