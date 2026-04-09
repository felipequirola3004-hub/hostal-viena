-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla: payment_transactions
-- Hostal Casa Colonial Viena Internacional
--
-- INSTRUCCIONES:
-- Ejecuta este script en Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  -- Identificadores
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_transaction_id   TEXT        UNIQUE NOT NULL,        -- ID generado por nuestro backend
  payphone_transaction_id BIGINT,                             -- ID de transacción de Payphone

  -- Habitación
  room_id                 TEXT,
  room_name               TEXT,

  -- Montos (en centavos, ej: $25.00 = 2500)
  amount                  INTEGER     NOT NULL CHECK (amount > 0),
  currency                TEXT        NOT NULL DEFAULT 'USD',

  -- Estado
  status                  TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'cancelled', 'error')),
  status_code             INTEGER,   -- Payphone: 3=Aprobado, 2=Cancelado

  -- Datos de autorización
  authorization_code      TEXT,
  card_brand              TEXT,      -- ej: "Mastercard Produbanco"
  card_type               TEXT,      -- "Credit" | "Debit"
  last_digits             TEXT,      -- últimos 4 dígitos

  -- Datos del huésped
  guest_email             TEXT,
  guest_phone             TEXT,
  reference               TEXT,

  -- Respuesta completa de Payphone (para auditoría)
  payphone_response       JSONB,

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at            TIMESTAMPTZ
);

-- ─── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_txn_client_id
  ON public.payment_transactions (client_transaction_id);

CREATE INDEX IF NOT EXISTS idx_payment_txn_status
  ON public.payment_transactions (status);

CREATE INDEX IF NOT EXISTS idx_payment_txn_created
  ON public.payment_transactions (created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Política: el frontend anónimo puede INSERTAR (iniciar una transacción)
CREATE POLICY "anon_insert_transactions"
  ON public.payment_transactions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Política: el frontend anónimo puede ACTUALIZAR solo por client_transaction_id
-- (necesario para confirmar desde la página /payment-response)
CREATE POLICY "anon_update_own_transaction"
  ON public.payment_transactions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Política: SOLO el rol service_role (backend/admin) puede leer todas las filas
-- El frontend anónimo NO puede listar todas las transacciones.
CREATE POLICY "service_role_full_access"
  ON public.payment_transactions
  FOR ALL
  TO service_role
  USING (true);

-- ─── Vista para administración ────────────────────────────────────────────────
-- Puedes consultarla desde el Admin Dashboard de Supabase
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT
  id,
  client_transaction_id,
  room_name,
  (amount::FLOAT / 100)::NUMERIC(10,2) AS amount_usd,
  currency,
  status,
  authorization_code,
  card_brand,
  guest_email,
  reference,
  created_at,
  confirmed_at
FROM public.payment_transactions
ORDER BY created_at DESC;

-- ─── Comentarios de documentación ────────────────────────────────────────────
COMMENT ON TABLE public.payment_transactions IS
  'Registro de transacciones de pago procesadas mediante Payphone para reservas del hostal.';
COMMENT ON COLUMN public.payment_transactions.amount IS
  'Monto en centavos. Dividir entre 100 para obtener USD. Ej: 2500 = $25.00';
COMMENT ON COLUMN public.payment_transactions.status IS
  'pending → transacción iniciada | approved → cobro exitoso | cancelled → usuario canceló | error → fallo en confirmación';
COMMENT ON COLUMN public.payment_transactions.payphone_response IS
  'Respuesta JSON completa de Payphone /V2/Confirm para auditoría y soporte.';
