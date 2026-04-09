/**
 * PaymentResponse.tsx
 * Página de retorno tras el pago en Payphone (/payment-response).
 *
 * Payphone redirige aquí con query params:
 *   ?id=<payphoneId>&clientTransactionId=<clientTxId>
 *
 * Esta página:
 *  1. Captura los parámetros de la URL.
 *  2. Llama al backend para confirmar el pago (crítico: < 5 min).
 *  3. Actualiza payment_transactions en Supabase.
 *  4. Si aprobado, crea la reservación en Supabase.
 *  5. Muestra el resultado al usuario.
 */

import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Home, BedDouble } from "lucide-react";
import { confirmPayment, type ConfirmPaymentResult } from "@/services/payphoneService";
import {
  updateTransaction,
  createReservation,
  linkReservationToTransaction,
} from "@/services/supabasePaymentService";
import { useLanguage } from "@/contexts/LanguageContext";

type PageState = "loading" | "approved" | "cancelled" | "error";

interface BookingSession {
  habitacion_id?: string;
  habitacion_nombre?: string;
  guest_name?: string;
  guest_email?: string;
  check_in?: string;
  check_out?: string;
  num_noches?: number;
  num_huespedes?: number;
  amount_usd?: number;
}

export default function PaymentResponse() {
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();

  const [state,    setState]    = useState<PageState>("loading");
  const [result,   setResult]   = useState<ConfirmPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const confirmedRef = useRef(false);

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const id         = searchParams.get("id") ?? "";
    const clientTxId = searchParams.get("clientTransactionId") ?? "";

    if (!id || !clientTxId) {
      setErrorMsg(
        lang === "es"
          ? "No se encontraron los parámetros de pago en la URL."
          : "Payment parameters not found in URL."
      );
      setState("error");
      return;
    }

    (async () => {
      try {
        // Recuperar datos de la reserva guardados en sessionStorage
        const bookingRaw = sessionStorage.getItem(`booking_${clientTxId}`);
        const booking: BookingSession = bookingRaw ? JSON.parse(bookingRaw) : {};

        // ── CONFIRMAR PAGO ──────────────────────────────────────────────────
        const data = await confirmPayment(id, clientTxId, booking.guest_name);
        setResult(data);

        if (data.statusCode === 3) {
          // ── PAGO APROBADO ─────────────────────────────────────────────────

          // a) Actualizar payment_transactions
          await updateTransaction(clientTxId, {
            status:                   "approved",
            status_code:              data.statusCode,
            transaction_status:       data.transactionStatus,
            authorization_code:       data.authorizationCode,
            card_brand:               data.cardBrand,
            card_type:                data.cardType,
            last_digits:              data.lastDigits,
            phone_number:             data.phoneNumber,
            payphone_transaction_id:  data.transactionId,
            payment_id:               data.transactionId?.toString(),
            raw_response:             data,
          });

          // b) Insertar en reservations
          const reservationId = await createReservation({
            room_id:          booking.habitacion_id,
            habitacion_nombre: booking.habitacion_nombre,
            guest_name:       booking.guest_name,
            guest_email:      booking.guest_email ?? data.email,
            check_in:         booking.check_in,
            check_out:        booking.check_out,
            num_noches:       booking.num_noches,
            num_huespedes:    booking.num_huespedes ?? 1,
            amount:           booking.amount_usd ?? data.amount / 100,
            status:           "confirmed",
            payment_method:   "card",
          });

          // c) Vincular reservation_id en payment_transactions
          if (reservationId) {
            await linkReservationToTransaction(clientTxId, reservationId);
          }

          // Limpiar sessionStorage
          sessionStorage.removeItem(`booking_${clientTxId}`);

          setState("approved");
        } else {
          // ── PAGO CANCELADO ────────────────────────────────────────────────
          await updateTransaction(clientTxId, {
            status:             "cancelled",
            status_code:        data.statusCode,
            transaction_status: data.transactionStatus,
            raw_response:       data,
          });

          sessionStorage.removeItem(`booking_${clientTxId}`);
          setState("cancelled");
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al procesar la respuesta de pago.";
        setErrorMsg(msg);
        setState("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Textos bilingües ───────────────────────────────────────────────────────
  const copy = {
    loading: {
      title: lang === "es" ? "Confirmando tu pago..."            : "Confirming your payment...",
      sub:   lang === "es" ? "Por favor no cierres esta ventana." : "Please don't close this window.",
    },
    approved: {
      title:  lang === "es" ? "¡Pago aprobado!"            : "Payment approved!",
      sub:    lang === "es"
        ? "Tu reserva ha sido confirmada. Nos complace darte la bienvenida al Hostal Casa Colonial Viena Internacional."
        : "Your booking has been confirmed. Thank you for choosing Hostal Casa Colonial Viena Internacional.",
      auth:   lang === "es" ? "Código de autorización" : "Authorization code",
      card:   lang === "es" ? "Tarjeta"                : "Card",
      amount: lang === "es" ? "Monto pagado"           : "Amount paid",
      ref:    lang === "es" ? "Referencia"             : "Reference",
    },
    cancelled: {
      title: lang === "es" ? "Pago cancelado"    : "Payment cancelled",
      sub:   lang === "es"
        ? "La transacción fue cancelada. No se realizó ningún cobro a tu tarjeta."
        : "The transaction was cancelled. No charge was made to your card.",
    },
    error: {
      title: lang === "es" ? "Error al procesar el pago"    : "Payment processing error",
      sub:   lang === "es"
        ? "Ocurrió un problema al procesar tu pago. Por favor contacta al hostal."
        : "A problem occurred while processing your payment. Please contact the hostal.",
    },
    btnHome:  lang === "es" ? "Ir al inicio"      : "Go to home",
    btnRooms: lang === "es" ? "Ver habitaciones"  : "View rooms",
    btnRetry: lang === "es" ? "Intentar de nuevo" : "Try again",
    contact:  lang === "es" ? "¿Necesitas ayuda? Escríbenos por" : "Need help? Contact us via",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* ── LOADING ─────────────────────────────────────────────────────── */}
        {state === "loading" && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full border-4 border-gold/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-2">{copy.loading.title}</h1>
              <p className="text-muted-foreground text-sm">{copy.loading.sub}</p>
            </div>
          </div>
        )}

        {/* ── APROBADO ────────────────────────────────────────────────────── */}
        {state === "approved" && result && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="font-serif text-3xl text-foreground mb-2">{copy.approved.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">{copy.approved.sub}</p>
            </div>

            <div className="bg-secondary/50 rounded-sm border border-border/40 divide-y divide-border/40">
              {result.authorizationCode && (
                <DetailRow label={copy.approved.auth} value={result.authorizationCode} highlight />
              )}
              {result.cardBrand && (
                <DetailRow
                  label={copy.approved.card}
                  value={`${result.cardBrand}${result.lastDigits ? ` ···· ${result.lastDigits}` : ""}`}
                />
              )}
              <DetailRow
                label={copy.approved.amount}
                value={`$${(result.amount / 100).toFixed(2)} ${result.currency}`}
                highlight
              />
              {result.reference && (
                <DetailRow label={copy.approved.ref} value={result.reference} />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Link
                to="/"
                className="w-full text-center px-6 py-3 bg-gold text-primary text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#b5952f] transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" />
                  {copy.btnHome}
                </span>
              </Link>
              <Link
                to="/habitaciones"
                className="w-full text-center px-6 py-3 bg-secondary text-secondary-foreground text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-secondary/80 transition-colors border border-border/40"
              >
                <span className="flex items-center justify-center gap-2">
                  <BedDouble className="w-4 h-4" />
                  {copy.btnRooms}
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* ── CANCELADO ───────────────────────────────────────────────────── */}
        {state === "cancelled" && (
          <div className="text-center space-y-6">
            <XCircle className="w-16 h-16 text-yellow-500 mx-auto" />
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-2">{copy.cancelled.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">{copy.cancelled.sub}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/habitaciones" className="w-full text-center px-6 py-3 bg-gold text-primary text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#b5952f] transition-colors">
                {copy.btnRetry}
              </Link>
              <Link to="/" className="w-full text-center px-6 py-3 bg-secondary text-secondary-foreground text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-secondary/80 transition-colors border border-border/40">
                {copy.btnHome}
              </Link>
            </div>
            <WhatsAppContact lang={lang} label={copy.contact} />
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────────── */}
        {state === "error" && (
          <div className="text-center space-y-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-2">{copy.error.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">{copy.error.sub}</p>
              {errorMsg && (
                <p className="mt-2 text-xs text-red-500/80 font-mono bg-red-500/5 rounded p-2 text-left">
                  {errorMsg}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/habitaciones" className="w-full text-center px-6 py-3 bg-gold text-primary text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#b5952f] transition-colors">
                {copy.btnRooms}
              </Link>
              <Link to="/" className="w-full text-center px-6 py-3 bg-secondary text-secondary-foreground text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-secondary/80 transition-colors border border-border/40">
                {copy.btnHome}
              </Link>
            </div>
            <WhatsAppContact lang={lang} label={copy.contact} />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function DetailRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-gold font-bold" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function WhatsAppContact({ lang, label }: { lang: string; label: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      {label}{" "}
      <a
        href="https://wa.me/593960927451"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold hover:underline font-semibold"
      >
        WhatsApp
      </a>
    </p>
  );
}
