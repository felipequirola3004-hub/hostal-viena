/**
 * admin.js
 * Rutas administrativas del servidor.
 *
 *  GET /api/admin/send-pending-emails
 *    Lee los emails pendientes en Supabase (status='pending') y los reenvía
 *    usando Resend HTTP API. Útil cuando el SMTP está bloqueado en Render free.
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const router = Router();

// ─── Cliente Supabase (service role para leer/actualizar pending_emails) ───────

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase    = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ─── Helper: enviar via Resend ────────────────────────────────────────────────

async function sendViaResend(to, subject, html) {
  const fromAddress = `Hostal Colonial Viena <${process.env.SMTP_USER || 'info@vienainternacionaluio.com'}>`;
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: fromAddress, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }
  return await res.json();
}

// ─── GET /api/admin/send-pending-emails ───────────────────────────────────────

router.get('/send-pending-emails', async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase no configurado (faltan SUPABASE_URL / SUPABASE_SERVICE_KEY)' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'RESEND_API_KEY no configurado' });
  }

  // 1. Leer emails pendientes (máximo 50 por lote)
  const { data: pending, error: readError } = await supabase
    .from('pending_emails')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (readError) {
    console.error('[Admin] Error leyendo pending_emails:', readError.message);
    return res.status(500).json({ error: readError.message });
  }

  if (!pending || pending.length === 0) {
    return res.json({ ok: true, message: 'No hay emails pendientes.', sent: 0, failed: 0 });
  }

  console.log(`[Admin] Procesando ${pending.length} email(s) pendiente(s)...`);

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const email of pending) {
    try {
      await sendViaResend(email.to_email, email.subject, email.html);

      // Marcar como enviado
      await supabase
        .from('pending_emails')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', email.id);

      console.log(`[Admin] ✅ Email enviado → ${email.to_email} (id: ${email.id})`);
      sent++;
    } catch (err) {
      console.error(`[Admin] ❌ Fallo al enviar id=${email.id}:`, err.message);

      // Marcar como fallido con el error actual
      await supabase
        .from('pending_emails')
        .update({ status: 'failed', error: err.message })
        .eq('id', email.id);

      errors.push({ id: email.id, to: email.to_email, error: err.message });
      failed++;
    }
  }

  return res.json({
    ok:     failed === 0,
    sent,
    failed,
    total:  pending.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

export default router;
