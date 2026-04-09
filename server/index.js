import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import payphoneRoutes from './routes/payphone.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
config({ path: join(__dirname, '.env') });

const app    = express();
const PORT   = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ─── 1. CORS ──────────────────────────────────────────────────────────────────

const allowedOrigins = [
  'https://vienainternacionaluio.com',
  'https://www.vienainternacionaluio.com',
  'https://hostal-viena.onrender.com',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3001',
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido → ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── 2. Headers globales ──────────────────────────────────────────────────────

app.use((_req, res, next) => {
  res.setHeader('Referrer-Policy', 'origin-when-cross-origin');
  next();
});

// ─── 3. Body parsers ──────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── 4. Rutas de la API  (SIEMPRE antes del static y del catch-all) ───────────

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'payphone-gateway', env: process.env.NODE_ENV || 'development' })
);

app.use('/api/payphone', payphoneRoutes);

// ─── 5. Archivos estáticos del frontend (solo producción) ─────────────────────

if (isProd) {
  // El build de Vite genera la carpeta dist/ en la raíz del proyecto.
  // server/index.js está en server/, por eso subimos un nivel: '../dist'
  const distPath = join(__dirname, '../dist');

  app.use(express.static(distPath));

  // Catch-all SPA: cualquier ruta que no sea /api/* ni un archivo estático
  // devuelve index.html para que React Router maneje la navegación.
  // IMPORTANTE: este handler va DESPUÉS de las rutas /api y DESPUÉS del static.
  app.get('*', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// ─── 6. Manejo global de errores ─────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ─── Arranque ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`   Payphone Base URL: ${process.env.PAYPHONE_BASE_URL}`);
  console.log(`   Response URL:      ${process.env.PAYPHONE_RESPONSE_URL}`);
  console.log(`   Site Base URL:     ${process.env.SITE_BASE_URL}`);
  if (isProd) console.log(`   Sirviendo frontend desde: ${join(__dirname, '../dist')}`);
});
