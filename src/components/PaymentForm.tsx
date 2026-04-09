/**
 * PaymentForm.tsx
 * Dialog de reserva y pago mediante Payphone.
 * El precio por noche lo define el admin — el huésped solo lo ve, no lo edita.
 */

import { useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { preparePayment } from "@/services/payphoneService";
import { createPendingTransaction } from "@/services/supabasePaymentService";
import { toast } from "sonner";
import type { Room } from "@/data/rooms";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

// ─── Precios de reserva por defecto (USD/noche) ───────────────────────────────
const DEFAULT_PRICES: Record<string, number> = {
  "suite-colonial":        65,
  "habitacion-doble":      45,
  "habitacion-individual": 30,
};
const FALLBACK_PRICE = 40;

function getRoomPrice(room: Room): number {
  if (room.price) {
    const n = parseFloat(room.price);
    if (!isNaN(n) && n > 0) return n;
  }
  return DEFAULT_PRICES[room.id] ?? FALLBACK_PRICE;
}

function getRoomName(room: Room, lang: string): string {
  if (typeof room.name === "object" && room.name !== null) {
    const n = room.name as Record<string, string>;
    return n[lang] ?? n.es ?? n.en ?? Object.values(n)[0] ?? "Habitación";
  }
  return String(room.name ?? "Habitación");
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PaymentForm({ open, onClose, room }: PaymentFormProps) {
  const { lang } = useLanguage();

  const pricePerNight = getRoomPrice(room);
  const roomName      = getRoomName(room, lang);

  const [checkIn,   setCheckIn]   = useState(todayStr());
  const [nights,    setNights]    = useState(1);
  const [guestName, setGuestName] = useState("");
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const checkOut    = addDays(checkIn, nights);
  const totalUSD    = nights * pricePerNight;
  const totalCents  = Math.round(totalUSD * 100);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handlePay(method: "card" | "payphone") {
    if (totalCents <= 0) {
      toast.error(lang === "es" ? "El monto debe ser mayor a $0." : "Amount must be greater than $0.");
      return;
    }

    setLoading(true);
    try {
      const reference =
        lang === "es"
          ? `Reserva ${roomName} - ${nights} noche(s)${guestName ? ` - ${guestName}` : ""}`
          : `Booking ${roomName} - ${nights} night(s)${guestName ? ` - ${guestName}` : ""}`;

      // 1. Preparar transacción en Payphone (a través del backend)
      const result = await preparePayment({
        amount:     totalCents,
        roomId:     room.id,
        roomName,
        guestName:  guestName || undefined,
        guestEmail: email     || undefined,
        reference,
      });

      // 2. Guardar datos de la reserva en sessionStorage para recuperar en PaymentResponse
      sessionStorage.setItem(`booking_${result.clientTransactionId}`, JSON.stringify({
        habitacion_id:    room.id,
        habitacion_nombre: roomName,
        guest_name:       guestName || undefined,
        guest_email:      email     || undefined,
        check_in:         checkIn,
        check_out:        checkOut,
        num_noches:       nights,
        num_huespedes:    1,
        amount_usd:       totalUSD,
      }));

      // 3. Registrar transacción pendiente en Supabase
      await createPendingTransaction({
        client_transaction_id: result.clientTransactionId,
        habitacion_id:         room.id,
        habitacion_nombre:     roomName,
        amount:                totalCents,
        currency:              "USD",
        reference,
        email:                 email || undefined,
        status:                "pending",
      });

      // 4. Redirigir a Payphone (nunca en iframe)
      window.location.href = method === "card" ? result.payWithCard : result.payWithPayPhone;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el pago.");
      setLoading(false);
    }
  }

  // ─── Textos ────────────────────────────────────────────────────────────────

  const es = lang === "es";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            {es ? "Reservar y pagar" : "Book & Pay"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {roomName}
          </DialogDescription>
        </DialogHeader>

        <div className="divider-gold !mx-0 mb-4 w-12" />

        <div className="space-y-4">

          {/* Precio por noche — solo lectura */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/60 rounded-sm border border-border/40">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              {es ? "Precio por noche" : "Price per night"}
            </span>
            <span className="text-base font-bold text-gold">
              ${pricePerNight.toFixed(2)} USD
            </span>
          </div>

          {/* Fecha de entrada */}
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground mb-1 block">
              {es ? "Fecha de entrada" : "Check-in date"}
            </label>
            <input
              type="date"
              min={todayStr()}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* Número de noches */}
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground mb-1 block">
              {es ? "Número de noches" : "Number of nights"}
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={nights}
              onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {es ? `Salida: ${checkOut}` : `Check-out: ${checkOut}`}
            </p>
          </div>

          {/* Nombre del huésped (opcional) */}
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground mb-1 block">
              {es ? "Nombre del huésped" : "Guest name (optional)"}
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={es ? "Tu nombre completo" : "Your full name"}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground mb-1 block">
              {es ? "Correo electrónico" : "Email (optional)"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {es ? "Recibirás la confirmación de tu reserva" : "You'll receive booking confirmation"}
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-b border-border/40">
            <div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider block">
                {es ? "Total a pagar" : "Total to pay"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {nights} {es ? (nights === 1 ? "noche" : "noches") : (nights === 1 ? "night" : "nights")} × ${pricePerNight.toFixed(2)}
              </span>
            </div>
            <span className="text-2xl font-serif font-bold text-gold">
              ${totalUSD.toFixed(2)} USD
            </span>
          </div>

          {/* Botones de pago */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handlePay("card")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gold text-primary text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#b5952f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? (es ? "Procesando..." : "Processing...") : (es ? "Pagar con tarjeta" : "Pay with card")}
            </button>

            <button
              onClick={() => handlePay("payphone")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-secondary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border border-border/40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">📱</span>}
              {loading ? (es ? "Procesando..." : "Processing...") : (es ? "Pagar con app Payphone" : "Pay with Payphone app")}
            </button>
          </div>

          {/* Nota de seguridad */}
          <div className="flex items-start gap-2 p-3 rounded-sm bg-secondary/50 text-[11px] text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 text-gold mt-0.5" />
            <div>
              <div className="flex items-center gap-1 font-semibold mb-0.5">
                <Lock className="w-3 h-3" />
                {es ? "Pago seguro con cifrado SSL" : "Secure payment with SSL encryption"}
              </div>
              {es
                ? "Serás redirigido al formulario de Payphone. No almacenamos datos de tu tarjeta."
                : "You'll be redirected to Payphone's secure form. We don't store your card data."}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
