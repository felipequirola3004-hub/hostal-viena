/**
 * supabasePaymentService.ts
 * Gestiona el registro de transacciones y reservaciones en Supabase.
 * Columnas exactas según el schema de la base de datos.
 */

import { supabase } from '@/lib/supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Datos para insertar una transacción pendiente en payment_transactions */
export interface PendingTransactionData {
  client_transaction_id: string;
  habitacion_id?: string;
  habitacion_nombre?: string;
  amount: number;          // en centavos (int)
  currency?: string;
  reference?: string;
  email?: string;
  status: 'pending';
}

/** Datos para actualizar payment_transactions al confirmar */
export interface TransactionUpdateData {
  status: 'approved' | 'cancelled' | 'error';
  status_code?: number;
  transaction_status?: string;
  authorization_code?: string;
  card_brand?: string;
  card_type?: string;
  last_digits?: string;
  phone_number?: string;
  payphone_transaction_id?: number;
  payment_id?: string;
  raw_response?: object;
  reservation_id?: string;
}

/** Datos para insertar en reservations */
export interface ReservationData {
  room_id?: string;
  habitacion_nombre?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in?: string;       // 'YYYY-MM-DD'
  check_out?: string;      // 'YYYY-MM-DD'
  num_noches?: number;
  num_huespedes?: number;
  amount: number;          // en dólares (numeric)
  status: string;
  payment_method?: string;
  notas?: string;
}

// ─── Funciones ────────────────────────────────────────────────────────────────

/**
 * Registra una transacción pendiente al iniciar el pago.
 * Llama esto ANTES de redirigir al usuario a Payphone.
 */
export async function createPendingTransaction(data: PendingTransactionData): Promise<void> {
  const { error } = await supabase.from('payment_transactions').insert([data]);
  if (error) {
    // No bloqueamos el flujo de pago si falla el registro
    console.error('[Supabase] Error al registrar transacción pendiente:', error.message);
  }
}

/**
 * Actualiza payment_transactions tras la confirmación con Payphone.
 * Lanza error si falla (para que el caller pueda manejarlo).
 */
export async function updateTransaction(
  clientTransactionId: string,
  update: TransactionUpdateData
): Promise<void> {
  const { error } = await supabase
    .from('payment_transactions')
    .update(update)
    .eq('client_transaction_id', clientTransactionId);

  if (error) {
    console.error('[Supabase] Error al actualizar transacción:', error.message);
    throw error;
  }
}

/**
 * Crea una nueva reservación y devuelve su id.
 */
export async function createReservation(data: ReservationData): Promise<string | null> {
  const { data: inserted, error } = await supabase
    .from('reservations')
    .insert([data])
    .select('id')
    .single();

  if (error) {
    console.error('[Supabase] Error al crear reservación:', error.message);
    return null;
  }

  return inserted?.id ?? null;
}

/**
 * Vincula una reservación a su transacción de pago.
 */
export async function linkReservationToTransaction(
  clientTransactionId: string,
  reservationId: string
): Promise<void> {
  const { error } = await supabase
    .from('payment_transactions')
    .update({ reservation_id: reservationId })
    .eq('client_transaction_id', clientTransactionId);

  if (error) {
    console.error('[Supabase] Error al vincular reservación:', error.message);
  }
}

/**
 * Obtiene los detalles de una transacción por su clientTransactionId.
 */
export async function getTransaction(clientTransactionId: string) {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('client_transaction_id', clientTransactionId)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error al obtener transacción:', error.message);
    return null;
  }

  return data;
}
