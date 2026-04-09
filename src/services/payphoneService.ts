/**
 * payphoneService.ts
 * Capa de acceso al backend de pagos Payphone.
 * El token Payphone NUNCA se expone aquí; vive sólo en el servidor.
 */

// En desarrollo: Vite proxy reescribe /api → http://localhost:3001
// En producción: VITE_API_URL apunta al dominio real (sin barra final)
const API_BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/payphone';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PreparePaymentParams {
  /** Monto total en centavos (USD × 100). Ej: $25.00 → 2500 */
  amount: number;
  roomName?: string;
  roomId?: string;
  guestName?: string;
  guestEmail?: string;
  numHuespedes?: number;
  reference?: string;
}

export interface PreparePaymentResult {
  paymentId: string;
  payWithCard: string;
  payWithPayPhone: string;
  clientTransactionId: string;
}

export interface ConfirmPaymentResult {
  statusCode: number;           // 3 = Aprobado | 2 = Cancelado
  transactionStatus: string;   // "Approved" | "Canceled"
  clientTransactionId: string;
  transactionId: number;
  authorizationCode?: string;
  amount: number;               // en centavos
  currency: string;
  cardBrand?: string;
  cardType?: string;
  lastDigits?: string;
  email?: string;
  phoneNumber?: string;
  document?: string;
  reference?: string;
  date?: string;
  message?: string;
  messageCode?: number;
  storeName?: string;
}

export interface GenerateLinkParams {
  /** Monto en dólares. El backend convierte a centavos. Ej: 25.00 */
  amount: number;
  reference?: string;
  guestEmail?: string;
}

export interface GenerateLinkResult {
  paymentId: string;
  clientTransactionId: string;
  /** URL del sitio propio → redirige a Payphone desde dominio registrado */
  linkTarjeta: string;
  linkPayphone: string;
  linkCompartir: string;
}

// ─── Funciones ────────────────────────────────────────────────────────────────

/**
 * Prepara una transacción Payphone y devuelve las URLs de pago.
 * Llama a POST /api/payphone/prepare en el backend.
 */
export async function preparePayment(
  params: PreparePaymentParams
): Promise<PreparePaymentResult> {
  const res = await fetch(`${API_BASE}/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Error al preparar el pago.');
  }

  return data as PreparePaymentResult;
}

/**
 * Confirma una transacción Payphone tras el retorno del usuario.
 * Llama a POST /api/payphone/confirm en el backend.
 * CRÍTICO: debe ejecutarse dentro de los primeros 5 minutos post-pago.
 */
export async function confirmPayment(
  id: string,
  clientTxId: string,
  guestName?: string,
  booking?: Record<string, unknown>
): Promise<ConfirmPaymentResult> {
  const res = await fetch(`${API_BASE}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, clientTxId, guestName, booking }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Error al confirmar el pago.');
  }

  return data as ConfirmPaymentResult;
}

/**
 * Confirma una transacción de pago admin (sin crear reservación).
 * Llama a POST /api/payphone/confirm-admin en el backend.
 */
export async function confirmPaymentAdmin(
  id: string,
  clientTxId: string
): Promise<ConfirmPaymentResult> {
  const res = await fetch(`${API_BASE}/confirm-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, clientTxId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Error al confirmar el pago admin.');
  }

  return data as ConfirmPaymentResult;
}

/**
 * Genera un link de pago personalizado desde el panel de administración.
 * Llama a POST /api/payphone/generate-link en el backend.
 */
export async function generatePaymentLink(
  params: GenerateLinkParams
): Promise<GenerateLinkResult> {
  const res = await fetch(`${API_BASE}/generate-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Error al generar el link de pago.');
  }

  return data as GenerateLinkResult;
}
