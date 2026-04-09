/**
 * email.js
 * Servicio de envío de emails con Nodemailer (Titan Mail / SMTP).
 * Llamado desde el endpoint /confirm después de verificar pago aprobado.
 */

import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env') });

// ─── Transporter ──────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,  // STARTTLS en puerto 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // evita errores de cert en algunos proveedores
  },
});

const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || process.env.SMTP_USER;
const FROM_ADDRESS = `"Hostal Colonial Viena" <${process.env.SMTP_USER}>`;
const HOSTAL_WEB   = 'https://vienainternacionaluio.com';

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

// ─── Templates HTML ───────────────────────────────────────────────────────────

function adminEmailHtml({ payphone, guestName, clientTransactionId }) {
  const {
    reference = 'Sin referencia',
    amount, authorizationCode, lastDigits, cardBrand, cardType,
    email: guestEmail, phoneNumber, date, transactionId,
  } = payphone;

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Nueva Reserva</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">

        <!-- Header -->
        <tr><td style="background:#1a2847;padding:24px 32px;">
          <h1 style="margin:0;color:#d4af37;font-size:22px;letter-spacing:1px;">
            ✅ Nueva reserva confirmada
          </h1>
          <p style="margin:6px 0 0;color:#ffffffaa;font-size:13px;">
            Panel Administrativo · Hostal Casa Colonial Viena Internacional
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <table width="100%" cellpadding="0" cellspacing="0">

            <tr><td colspan="2" style="padding-bottom:20px;">
              <p style="margin:0;font-size:15px;color:#333;">
                Se ha procesado un pago exitoso. Detalle completo:
              </p>
            </td></tr>

            ${row('🏨 Habitación / Referencia', reference)}
            ${row('💰 Monto pagado',            formatAmount(amount))}
            ${row('🔐 Código de autorización',  authorizationCode || 'N/D')}
            ${row('💳 Tarjeta',                 `${cardBrand || ''} ${cardType ? `(${cardType})` : ''} ···· ${lastDigits || 'N/D'}`)}
            ${row('👤 Huésped',                 guestName || guestEmail || 'No proporcionado')}
            ${row('📧 Email del cliente',        guestEmail || 'No proporcionado')}
            ${row('📱 Teléfono',                 phoneNumber || 'No proporcionado')}
            ${row('🆔 ID Transacción Payphone',  String(transactionId || 'N/D'))}
            ${row('🔖 clientTransactionId',      clientTransactionId)}
            ${row('📅 Fecha y hora',             formatDate(date))}

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:16px 32px;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-size:12px;color:#888;">
            Este correo fue generado automáticamente por el sistema de pagos.
            <br><a href="${HOSTAL_WEB}" style="color:#d4af37;">${HOSTAL_WEB}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function clientEmailHtml({ payphone, guestName, clientTransactionId }) {
  const {
    reference = 'Tu reserva',
    amount, authorizationCode, lastDigits, cardBrand, date,
  } = payphone;

  const displayName = guestName || 'Estimado huésped';

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de Reserva</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">

        <!-- Header dorado -->
        <tr><td style="background:#1a2847;padding:32px;text-align:center;">
          <div style="color:#d4af37;font-size:40px;margin-bottom:8px;">🏨</div>
          <h1 style="margin:0;color:#d4af37;font-size:24px;letter-spacing:1px;">
            Hostal Casa Colonial Viena Internacional
          </h1>
          <p style="margin:8px 0 0;color:#ffffffbb;font-size:13px;letter-spacing:2px;text-transform:uppercase;">
            Confirmación de Reserva
          </p>
        </td></tr>

        <!-- Saludo -->
        <tr><td style="padding:32px 32px 0;">
          <h2 style="margin:0 0 8px;color:#1a2847;font-size:20px;">
            ¡Reserva confirmada, ${displayName}!
          </h2>
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            Tu pago fue procesado exitosamente. Nos complace darte la bienvenida
            al <strong>Hostal Casa Colonial Viena Internacional</strong>, donde la historia
            y el confort se encuentran en el corazón de Quito.
          </p>
        </td></tr>

        <!-- Detalles de reserva -->
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9f7f3;border:1px solid #e8e0cc;border-radius:6px;overflow:hidden;">
            <tr><td style="background:#d4af37;padding:12px 20px;">
              <h3 style="margin:0;color:#1a2847;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                Detalle de tu reserva
              </h3>
            </td></tr>
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${row('📋 Referencia',          reference)}
                ${row('💰 Monto pagado',         formatAmount(amount))}
                ${row('🔐 Cód. autorización',    authorizationCode || 'N/D')}
                ${row('💳 Tarjeta utilizada',    `${cardBrand || ''} ···· ${lastDigits || 'N/D'}`)}
                ${row('📅 Fecha de pago',        formatDate(date))}
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Instrucción importante -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#fff8e1;border:1px solid #d4af37;border-radius:6px;padding:16px 20px;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#6b5300;line-height:1.6;">
                <strong>📌 Importante:</strong> Presenta este correo de confirmación
                al momento de tu llegada al hostal. Es tu comprobante de reserva.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Información de contacto -->
        <tr><td style="padding:0 32px 32px;">
          <h3 style="margin:0 0 12px;color:#1a2847;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
            Información del Hostal
          </h3>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">
              📍 <strong>Dirección:</strong> Juan José Flores 5-04, Centro Histórico, Quito
            </td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">
              📧 <strong>Email:</strong>
              <a href="mailto:info@vienainternacionaluio.com" style="color:#d4af37;">
                info@vienainternacionaluio.com
              </a>
            </td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">
              📱 <strong>WhatsApp:</strong> +593 96 092 7451
            </td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#555;">
              🌐 <strong>Web:</strong>
              <a href="${HOSTAL_WEB}" style="color:#d4af37;">${HOSTAL_WEB}</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#1a2847;padding:20px 32px;text-align:center;">
          <p style="margin:0;color:#ffffffaa;font-size:12px;">
            ¡Gracias por elegirnos! Esperamos con gusto su visita.<br>
            <span style="color:#d4af3788;">ID: ${clientTransactionId}</span>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Fila de tabla para ambas plantillas
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

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Envía los emails de confirmación al admin y al cliente.
 * Si alguno falla, loga el error pero NO lanza excepción para no
 * bloquear la respuesta de confirmación de pago al frontend.
 *
 * @param {object} payphone   - Respuesta completa de Payphone /V2/Confirm
 * @param {string} guestName  - Nombre del huésped (puede ser undefined)
 * @param {string} clientTransactionId
 */
export async function sendBookingEmails({ payphone, guestName, clientTransactionId }) {
  const templateData = { payphone, guestName, clientTransactionId };
  const roomRef      = payphone.reference || 'Habitación';

  // ── Email al admin ──────────────────────────────────────────────────────────
  try {
    await transporter.sendMail({
      from:    FROM_ADDRESS,
      to:      ADMIN_EMAIL,
      subject: `Nueva reserva confirmada - ${roomRef}`,
      html:    adminEmailHtml(templateData),
    });
    console.log(`[Email] ✅ Admin notificado → ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('[Email] ❌ Error enviando email al admin:', err.message);
  }

  // ── Email al cliente (solo si proporcionó su correo) ──────────────────────
  const clientEmail = payphone.email;
  if (clientEmail && clientEmail.includes('@')) {
    try {
      await transporter.sendMail({
        from:    FROM_ADDRESS,
        to:      clientEmail,
        subject: 'Confirmación de reserva - Hostal Casa Colonial Viena Internacional',
        html:    clientEmailHtml(templateData),
      });
      console.log(`[Email] ✅ Confirmación enviada al cliente → ${clientEmail}`);
    } catch (err) {
      console.error(`[Email] ❌ Error enviando email al cliente (${clientEmail}):`, err.message);
    }
  } else {
    console.log('[Email] ℹ️  Cliente no proporcionó email — se omite envío al cliente');
  }
}
