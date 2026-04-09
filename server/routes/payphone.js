import { Router } from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import https from 'https';
import { sendBookingEmails } from '../email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const router = Router();

// ─── Variables de entorno ─────────────────────────────────────────────────────

const PAYPHONE_TOKEN                = process.env.PAYPHONE_TOKEN;
const PAYPHONE_STORE_ID             = process.env.PAYPHONE_STORE_ID;
const PAYPHONE_RESPONSE_URL         = process.env.PAYPHONE_RESPONSE_URL;
const PAYPHONE_CANCELLATION_URL     = process.env.PAYPHONE_CANCELLATION_URL;
const PAYPHONE_BASE_URL             = process.env.PAYPHONE_BASE_URL || 'https://pay.payphonetodoesposible.com';
const ADMIN_PAYMENT_RESPONSE_URL    = process.env.ADMIN_PAYMENT_RESPONSE_URL || 'http://localhost:8080/payment-response-admin';
const SITE_BASE_URL                 = process.env.SITE_BASE_URL || 'http://localhost:8080';

const PREPARE_URL = `${PAYPHONE_BASE_URL}/api/button/Prepare`;
const CONFIRM_URL = `${PAYPHONE_BASE_URL}/api/button/V2/Confirm`;

// ─── Instancia axios ──────────────────────────────────────────────────────────

const httpsAgent = process.env.NODE_ENV !== 'production'
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

const payphoneClient = axios.create({
  timeout: 15000,
  httpsAgent,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${PAYPHONE_TOKEN}`,
  },
});

// ─── Verificación al arrancar ─────────────────────────────────────────────────

const required = { PAYPHONE_TOKEN, PAYPHONE_RESPONSE_URL, PAYPHONE_CANCELLATION_URL };

for (const [key, val] of Object.entries(required)) {
  if (!val) {
    console.error(`❌ Variable de entorno faltante: ${key}`);
  } else {
    const preview = key === 'PAYPHONE_TOKEN' ? `${val.slice(0, 6)}...${val.slice(-6)}` : val;
    console.log(`✅ ${key} = ${preview}`);
  }
}
console.log(`🔗 Prepare URL: ${PREPARE_URL}`);
console.log(`🔗 Confirm URL: ${CONFIRM_URL}`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateClientTransactionId() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CE-${ts}-${rnd}`;
}

function logAxiosError(label, err) {
  console.error(`\n[${label}] ── Error ─────────────────────────────────────`);
  console.error(`  Tipo:    ${err.constructor?.name}`);
  console.error(`  Mensaje: ${err.message}`);
  console.error(`  Código:  ${err.code ?? '(sin código)'}`);
  if (err.response) {
    console.error(`  HTTP ${err.response.status}:`, JSON.stringify(err.response.data));
  } else if (err.request) {
    console.error(`  Sin respuesta del servidor remoto`);
  }
  console.error(`──────────────────────────────────────────────────────\n`);
}

// ─── GET /api/payphone/test-connection ───────────────────────────────────────

router.get('/test-connection', async (_req, res) => {
  const results = {};

  // Test 1: alcanzar el dominio base
  try {
    const r = await axios.get(PAYPHONE_BASE_URL, {
      timeout: 8000,
      httpsAgent,
      validateStatus: () => true,
    });
    results.base = { ok: true, status: r.status, url: PAYPHONE_BASE_URL };
  } catch (err) {
    results.base = { ok: false, url: PAYPHONE_BASE_URL, code: err.code, message: err.message };
  }

  // Test 2: POST a /Prepare con payload mínimo real
  try {
    const r = await payphoneClient.post(PREPARE_URL, {
      amount:             100,
      amountWithoutTax:   100,
      clientTransactionId: `TEST-${Date.now()}`,
      storeId:            PAYPHONE_STORE_ID,
      currency:           'USD',
      responseUrl:        PAYPHONE_RESPONSE_URL,
      cancellationUrl:    PAYPHONE_CANCELLATION_URL,
      reference:          'Test de conexión',
    }, { validateStatus: () => true });

    results.prepare = { ok: r.status < 500, status: r.status, data: r.data, url: PREPARE_URL };
  } catch (err) {
    results.prepare = { ok: false, url: PREPARE_URL, code: err.code, message: err.message };
  }

  const allOk = Object.values(results).every((r) => r.ok);
  console.log('[Test-Connection]', JSON.stringify(results, null, 2));

  return res.status(allOk ? 200 : 502).json({
    summary:     allOk ? 'Conectividad OK' : 'Problemas de conectividad detectados',
    nodeVersion: process.version,
    env:         process.env.NODE_ENV || 'development',
    results,
  });
});

// ─── POST /api/payphone/prepare ───────────────────────────────────────────────

router.post('/prepare', async (req, res) => {
  try {
    // Validar credenciales mínimas
    if (!PAYPHONE_TOKEN) {
      return res.status(500).json({
        error: 'PAYPHONE_TOKEN no configurado en server/.env',
      });
    }

    const { amount, roomName, roomId, reference } = req.body;

    // Validar amount
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'El campo "amount" debe ser un número positivo en centavos (ej: $10 → 1000).',
      });
    }
    const amountCents = Math.round(amountNum);

    const clientTransactionId = generateClientTransactionId();

    // Payload según documentación oficial de Payphone.
    // storeId es OPCIONAL y solo aplica cuando el comercio tiene múltiples tiendas
    // registradas. Enviarlo con el AppId causa error 404 "tienda no existe".
    // Payphone identifica la tienda automáticamente por el Bearer Token.
    // amount DEBE ser igual a amountWithoutTax cuando no hay IVA (evita error 800).
    const payload = {
      amount:             amountCents,
      amountWithoutTax:   amountCents,
      clientTransactionId,
      currency:           'USD',
      responseUrl:        PAYPHONE_RESPONSE_URL,
      cancellationUrl:    PAYPHONE_CANCELLATION_URL,
      reference:          reference || `Reserva ${roomName || 'Hostal Colonial Viena'}`,
      ...(roomId ? { optionalParameter: roomId } : {}),
    };

    console.log('[Payphone Prepare →]', PREPARE_URL);
    console.log('[Payphone Prepare →] Payload:', JSON.stringify(payload));

    const { data } = await payphoneClient.post(PREPARE_URL, payload);

    console.log('[Payphone Prepare ←] paymentId=', data.paymentId);

    return res.json({
      paymentId:           data.paymentId,
      payWithCard:         data.payWithCard,
      payWithPayPhone:     data.payWithPayPhone,
      clientTransactionId,
    });

  } catch (err) {
    logAxiosError('Prepare', err);

    if (err.response) {
      return res.status(502).json({
        error:          err.response.data?.message || 'Payphone rechazó la solicitud.',
        payphoneStatus: err.response.status,
        payphoneData:   err.response.data,
      });
    }

    return res.status(500).json({
      error:  'No se pudo conectar con Payphone.',
      detail: err.message,
      code:   err.code,
    });
  }
});

// ─── POST /api/payphone/confirm ───────────────────────────────────────────────

router.post('/confirm', async (req, res) => {
  try {
    if (!PAYPHONE_TOKEN) {
      return res.status(500).json({ error: 'PAYPHONE_TOKEN no configurado en server/.env' });
    }

    const { id, clientTxId, guestName, booking } = req.body;
    if (!id || !clientTxId) {
      return res.status(400).json({ error: 'Se requieren los parámetros "id" y "clientTxId".' });
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ error: 'El campo "id" debe ser numérico.' });
    }

    console.log(`[Payphone Confirm →] id=${numId} clientTxId=${clientTxId}`);

    const { data } = await payphoneClient.post(CONFIRM_URL, { id: numId, clientTxId });

    console.log(`[Payphone Confirm ←] statusCode=${data.statusCode} status=${data.transactionStatus}`);

    // ── Enviar emails si el pago fue aprobado (statusCode 3 = Approved) ─────────
    if (data.statusCode === 3) {
      sendBookingEmails({
        payphone:            data,
        guestName,
        clientTransactionId: clientTxId,
        booking,             // datos de la reserva desde sessionStorage del frontend
      }).catch((err) => console.error('[Email] Error inesperado:', err.message));
    }

    return res.json(data);

  } catch (err) {
    logAxiosError('Confirm', err);

    if (err.response) {
      return res.status(502).json({
        error:          err.response.data?.message || 'Payphone rechazó la confirmación.',
        payphoneStatus: err.response.status,
        payphoneData:   err.response.data,
      });
    }

    return res.status(500).json({
      error:  'No se pudo conectar con Payphone al confirmar.',
      detail: err.message,
      code:   err.code,
    });
  }
});

// ─── POST /api/payphone/confirm-admin ────────────────────────────────────────
// Confirma pagos generados desde el panel admin (responseUrl diferente).
// Registra el resultado en payment_transactions pero NO crea reservación.

router.post('/confirm-admin', async (req, res) => {
  try {
    if (!PAYPHONE_TOKEN) {
      return res.status(500).json({ error: 'PAYPHONE_TOKEN no configurado en server/.env' });
    }

    const { id, clientTxId } = req.body;
    if (!id || !clientTxId) {
      return res.status(400).json({ error: 'Se requieren los parámetros "id" y "clientTxId".' });
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      return res.status(400).json({ error: 'El campo "id" debe ser numérico.' });
    }

    console.log(`[Payphone ConfirmAdmin →] id=${numId} clientTxId=${clientTxId}`);

    const { data } = await payphoneClient.post(CONFIRM_URL, { id: numId, clientTxId });

    console.log(`[Payphone ConfirmAdmin ←] statusCode=${data.statusCode} status=${data.transactionStatus}`);

    // Registrar en payment_transactions (sin reservation_id — pago admin)
    if (data.statusCode === 3) {
      sendBookingEmails({
        payphone:            data,
        guestName:           undefined,
        clientTransactionId: clientTxId,
      }).catch((err) => console.error('[Email] Error en confirm-admin:', err.message));
    }

    return res.json(data);

  } catch (err) {
    logAxiosError('ConfirmAdmin', err);

    if (err.response) {
      return res.status(502).json({
        error:          err.response.data?.message || 'Payphone rechazó la confirmación.',
        payphoneStatus: err.response.status,
        payphoneData:   err.response.data,
      });
    }

    return res.status(500).json({
      error:  'No se pudo conectar con Payphone al confirmar pago admin.',
      detail: err.message,
      code:   err.code,
    });
  }
});

// ─── POST /api/payphone/generate-link ────────────────────────────────────────
// Permite al admin generar un link de pago personalizado.
// El frontend envía el monto en DÓLARES; el backend convierte a centavos.

router.post('/generate-link', async (req, res) => {
  try {
    if (!PAYPHONE_TOKEN) {
      return res.status(500).json({ error: 'PAYPHONE_TOKEN no configurado en server/.env' });
    }

    const { amount, reference, guestEmail } = req.body;

    // amount llega en dólares desde el frontend (ej: 45.00 → 4500 centavos)
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({
        error: 'El campo "amount" debe ser un número positivo en dólares (ej: 45.00).',
      });
    }
    const amountCents = Math.round(amountNum * 100);

    const clientTransactionId = generateClientTransactionId();

    const payload = {
      amount:             amountCents,
      amountWithoutTax:   amountCents,
      clientTransactionId,
      currency:           'USD',
      responseUrl:        ADMIN_PAYMENT_RESPONSE_URL,
      cancellationUrl:    PAYPHONE_CANCELLATION_URL,
      reference:          reference || 'Pago personalizado - Hostal Colonial Viena',
      ...(guestEmail ? { email: guestEmail } : {}),
    };

    console.log('[GenerateLink →]', PREPARE_URL, JSON.stringify(payload));

    const { data } = await payphoneClient.post(PREPARE_URL, payload);

    console.log('[GenerateLink ←] paymentId=', data.paymentId);

    // Las URLs apuntan al propio sitio (/pay/:paymentId) — la redirección
    // a Payphone ocurre desde el dominio registrado, evitando "Not authorized".
    return res.json({
      paymentId:           data.paymentId,
      clientTransactionId,
      linkTarjeta:         `${SITE_BASE_URL}/pay/${data.paymentId}?type=card`,
      linkPayphone:        `${SITE_BASE_URL}/pay/${data.paymentId}?type=payphone`,
      linkCompartir:       `${SITE_BASE_URL}/pay/${data.paymentId}`,
    });

  } catch (err) {
    logAxiosError('GenerateLink', err);

    if (err.response) {
      return res.status(502).json({
        error:          err.response.data?.message || 'Payphone rechazó la solicitud.',
        payphoneStatus: err.response.status,
        payphoneData:   err.response.data,
      });
    }

    return res.status(500).json({
      error:  'No se pudo generar el link de pago.',
      detail: err.message,
      code:   err.code,
    });
  }
});

// ─── GET /api/payphone/redirect-to-payment/:paymentId ────────────────────────
// Redirige al formulario de Payphone desde el dominio registrado.
// El navegador llega desde el sitio propio → Payphone lo acepta.

router.get('/redirect-to-payment/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  const { type } = req.query;

  if (!paymentId) {
    return res.status(400).send('paymentId requerido');
  }

  const url = type === 'payphone'
    ? `${PAYPHONE_BASE_URL}/PayPhone/Index?paymentId=${paymentId}`
    : `${PAYPHONE_BASE_URL}/Anonymous/Index?paymentId=${paymentId}`;

  console.log(`[Redirect] → ${url}`);
  return res.redirect(url);
});

export default router;
