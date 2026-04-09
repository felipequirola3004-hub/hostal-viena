/**
 * email.js
 * Envío de emails transaccionales.
 *
 * Prioridad:
 *  1. Resend HTTP API (funciona en Render free tier — requiere RESEND_API_KEY)
 *  2. Nodemailer SMTP (funciona en local/servers sin restricción de puertos)
 *  3. Fallback: guarda el email en Supabase tabla pending_emails para reenvío manual
 */

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

// ─── Constantes ───────────────────────────────────────────────────────────────

const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || process.env.SMTP_USER;
const FROM_ADDRESS = `"Hostal Colonial Viena" <${process.env.SMTP_USER}>`;
const FROM_RESEND  = `Hostal Colonial Viena <${process.env.SMTP_USER}>`;
const HOSTAL_WEB   = 'https://vienainternacionaluio.com';

// ─── Clientes ─────────────────────────────────────────────────────────────────

// Nodemailer (SMTP — para local dev)
const smtpTransporter = nodemailer.createTransport({
  host:   'smtp.titan.email',
  port:   465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Supabase (para cola de respaldo)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase    = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Verificar SMTP al arrancar (solo informativo)
smtpTransporter.verify((error, _success) => {
  if (error) {
    console.warn('[SMTP] ⚠️  SMTP no disponible (normal en Render free):', error.code || error.message);
    if (process.env.RESEND_API_KEY) {
      console.log('[Email] ✅ Usando Resend HTTP API como proveedor principal');
    } else {
      console.warn('[Email] ⚠️  Sin RESEND_API_KEY — emails irán a cola Supabase si falla SMTP');
    }
  } else {
    console.log('[SMTP] ✅ Servidor SMTP listo');
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(cents) {
  return `$${(cents / 100).toFixed(2)} USD`;
}

function formatDate(isoDate) {
  if (!isoDate) return 'N/D';
  return new Date(isoDate).toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  });
}

function formatDateOnly(dateStr) {
  if (!dateStr) return 'N/D';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  return d.toLocaleDateString('es-EC', { dateStyle: 'long' });
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#888;white-space:nowrap;vertical-align:top;width:200px;">
        ${label}
      </td>
      <td style="padding:6px 0 6px 12px;font-size:13px;color:#222;font-weight:600;">
        ${value || 'N/D'}
      </td>
    </tr>`;
}

// ─── Métodos de envío ─────────────────────────────────────────────────────────

/**
 * Envía via Resend HTTP API.
 * No requiere puertos SMTP — funciona en Render free tier.
 */
async function sendViaResend(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM_RESEND, to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend error ${res.status}: ${JSON.stringify(body)}`);
  }

  return await res.json();
}

/**
 * Envía via Nodemailer SMTP.
 */
async function sendViaSmtp(to, subject, html) {
  return await smtpTransporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
}

/**
 * Guarda el email en Supabase pending_emails para reenvío posterior.
 */
async function savePendingEmail(to, subject, html, errorReason) {
  if (!supabase) {
    console.error('[Email] Sin cliente Supabase — no se puede guardar email pendiente');
    return;
  }
  const { error } = await supabase.from('pending_emails').insert([{
    to_email:  to,
    subject,
    html,
    status:    'pending',
    error:     errorReason,
  }]);
  if (error) {
    console.error('[Email] Error guardando en pending_emails:', error.message);
  } else {
    console.log(`[Email] 📥 Email guardado en cola Supabase → ${to}`);
  }
}

/**
 * Intenta enviar un email usando Resend → SMTP → fallback a Supabase.
 */
async function sendEmail(to, subject, html) {
  const smtpConfig = {
    host:       'smtp.titan.email',
    port:       465,
    user:       process.env.SMTP_USER,
    passLength: process.env.SMTP_PASS?.length,
  };

  // ── 1. Resend (HTTP API — funciona en Render free) ──────────────────────────
  if (process.env.RESEND_API_KEY) {
    console.log(`[Email] Intentando Resend → ${to}`);
    try {
      await sendViaResend(to, subject, html);
      console.log(`[Email] ✅ Enviado via Resend → ${to}`);
      return { method: 'resend', ok: true };
    } catch (err) {
      console.error('[Email] ❌ Resend falló:', {
        message: err.message,
        code:    err.code,
      });
    }
  }

  // ── 2. SMTP Nodemailer ───────────────────────────────────────────────────────
  console.log(`[Email] Intentando SMTP → ${to}`);
  console.log('[Email] Config SMTP:', smtpConfig);
  try {
    await sendViaSmtp(to, subject, html);
    console.log(`[Email] ✅ Enviado via SMTP → ${to}`);
    return { method: 'smtp', ok: true };
  } catch (err) {
    console.error('[Email] ❌ SMTP falló:', {
      message:      err.message,
      code:         err.code,
      command:      err.command,
      response:     err.response,
      responseCode: err.responseCode,
    });

    // ── 3. Fallback: guardar en Supabase ─────────────────────────────────────
    console.log(`[Email] 📥 Guardando en cola Supabase → ${to}`);
    await savePendingEmail(to, subject, html, err.message);
    return { method: 'queue', ok: false };
  }
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

function adminEmailHtml({ payphone, guestName, clientTransactionId, booking }) {
  const {
    reference = 'Sin referencia',
    amount, authorizationCode, lastDigits, cardBrand, cardType,
    email: guestEmail, phoneNumber, date, transactionId,
  } = payphone;

  const habitacion   = booking?.habitacion_nombre || reference;
  const checkIn      = booking?.check_in    ? formatDateOnly(booking.check_in)  : 'N/D';
  const checkOut     = booking?.check_out   ? formatDateOnly(booking.check_out) : 'N/D';
  const numNoches    = booking?.num_noches    ?? 'N/D';
  const numHuespedes = booking?.num_huespedes ?? 'N/D';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Nueva Reserva</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <tr><td style="background:#1a2847;padding:24px 32px;">
          <h1 style="margin:0;color:#d4af37;font-size:22px;letter-spacing:1px;">✅ Nueva reserva confirmada</h1>
          <p style="margin:6px 0 0;color:#ffffffaa;font-size:13px;">Panel Administrativo · Hostal Casa Colonial Viena Internacional</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${row('🏨 Habitación',              habitacion)}
            ${row('📅 Check-in',                checkIn)}
            ${row('📅 Check-out',               checkOut)}
            ${row('🌙 Noches',                  String(numNoches))}
            ${row('👥 Huéspedes',               String(numHuespedes))}
            ${row('💰 Monto pagado',             formatAmount(amount))}
            ${row('🔐 Código de autorización',   authorizationCode || 'N/D')}
            ${row('💳 Tarjeta',                 `${cardBrand || ''} ${cardType ? `(${cardType})` : ''} ···· ${lastDigits || 'N/D'}`)}
            ${row('👤 Huésped',                 guestName || guestEmail || 'No proporcionado')}
            ${row('📧 Email del cliente',        guestEmail || 'No proporcionado')}
            ${row('📱 Teléfono',                 phoneNumber || 'No proporcionado')}
            ${row('🆔 ID Transacción Payphone',  String(transactionId || 'N/D'))}
            ${row('🔖 clientTransactionId',      clientTransactionId)}
            ${row('📅 Fecha y hora del pago',    formatDate(date))}
          </table>
        </td></tr>
        <tr><td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#888;">
            Generado automáticamente · <a href="${HOSTAL_WEB}" style="color:#d4af37;">${HOSTAL_WEB}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function clientEmailHtml({ payphone, guestName, clientTransactionId, booking }) {
  const {
    reference = 'Tu reserva',
    amount, authorizationCode, lastDigits, cardBrand, date,
  } = payphone;

  const displayName  = guestName || 'Estimado huésped';
  const habitacion   = booking?.habitacion_nombre || reference;
  const checkIn      = booking?.check_in    ? formatDateOnly(booking.check_in)  : null;
  const checkOut     = booking?.check_out   ? formatDateOnly(booking.check_out) : null;
  const numNoches    = booking?.num_noches;
  const numHuespedes = booking?.num_huespedes;

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de Reserva</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
        <tr><td style="background:#1a2847;padding:32px;text-align:center;">
          <div style="color:#d4af37;font-size:40px;margin-bottom:8px;">🏨</div>
          <h1 style="margin:0;color:#d4af37;font-size:24px;letter-spacing:1px;">Hostal Casa Colonial Viena Internacional</h1>
          <p style="margin:8px 0 0;color:#ffffffbb;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Confirmación de Reserva</p>
        </td></tr>
        <tr><td style="padding:32px 32px 0;">
          <h2 style="margin:0 0 8px;color:#1a2847;font-size:20px;">¡Reserva confirmada, ${displayName}!</h2>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            Tu pago fue procesado exitosamente. Nos complace darte la bienvenida al
            <strong>Hostal Casa Colonial Viena Internacional</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f7f3;border:1px solid #e8e0cc;border-radius:6px;overflow:hidden;">
            <tr><td style="background:#d4af37;padding:12px 20px;">
              <h3 style="margin:0;color:#1a2847;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Detalle de tu reserva</h3>
            </td></tr>
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('🏨 Habitación',         habitacion)}
                ${checkIn  ? row('📅 Check-in',  checkIn)  : ''}
                ${checkOut ? row('📅 Check-out', checkOut) : ''}
                ${numNoches    != null ? row('🌙 Noches',    String(numNoches))    : ''}
                ${numHuespedes != null ? row('👥 Huéspedes', String(numHuespedes)) : ''}
                ${row('💰 Monto pagado',        formatAmount(amount))}
                ${row('🔐 Cód. autorización',   authorizationCode || 'N/D')}
                ${row('💳 Tarjeta utilizada',   `${cardBrand || ''} ···· ${lastDigits || 'N/D'}`)}
                ${row('📅 Fecha de pago',       formatDate(date))}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #d4af37;border-radius:6px;padding:16px 20px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#6b5300;line-height:1.6;">
                <strong>📌 Importante:</strong> Presenta este correo al momento de tu llegada. Es tu comprobante de reserva.
              </p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <h3 style="margin:0 0 12px;color:#1a2847;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Información del Hostal</h3>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">📍 <strong>Dirección:</strong> Juan José Flores 5-04, Centro Histórico, Quito</td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">📧 <strong>Email:</strong> <a href="mailto:info@vienainternacionaluio.com" style="color:#d4af37;">info@vienainternacionaluio.com</a></td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">📱 <strong>WhatsApp:</strong> +593 96 092 7451</td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">🌐 <strong>Web:</strong> <a href="${HOSTAL_WEB}" style="color:#d4af37;">${HOSTAL_WEB}</a></td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#1a2847;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#ffffffaa;font-size:12px;">
            ¡Gracias por elegirnos!<br>
            <span style="color:#d4af3788;">ID: ${clientTransactionId}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function sendBookingEmails({ payphone, guestName, clientTransactionId, booking }) {
  const templateData = { payphone, guestName, clientTransactionId, booking };
  const habitacion   = booking?.habitacion_nombre || payphone.reference || 'Habitación';

  // Admin
  await sendEmail(
    ADMIN_EMAIL,
    `Nueva reserva confirmada - ${habitacion}`,
    adminEmailHtml(templateData)
  );

  // Cliente (solo si proporcionó email)
  const clientEmail = payphone.email;
  if (clientEmail?.includes('@')) {
    await sendEmail(
      clientEmail,
      'Confirmación de reserva - Hostal Casa Colonial Viena Internacional',
      clientEmailHtml(templateData)
    );
  } else {
    console.log('[Email] ℹ️  Sin email de cliente — se omite');
  }
}
