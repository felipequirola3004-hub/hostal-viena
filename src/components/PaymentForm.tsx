/**
 * PaymentForm.tsx
 * Modal de reserva y pago mediante Payphone.
 * - Bottom sheet en móvil, modal centrado en desktop
 * - Header sticky con botón cerrar de 44px mínimo
 * - Selector de huéspedes con límite de capacidad
 */

import { useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck, X, Minus, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const es = lang === "es";

  const pricePerNight = getRoomPrice(room);
  const roomName      = getRoomName(room, lang);
  const maxGuests     = room.capacity ?? 4;

  const [checkIn,       setCheckIn]       = useState(todayStr());
  const [nights,        setNights]        = useState(1);
  const [numHuespedes,  setNumHuespedes]  = useState(1);
  const [guestName,     setGuestName]     = useState("");
  const [email,         setEmail]         = useState("");
  const [loading,       setLoading]       = useState(false);

  const checkOut   = addDays(checkIn, nights);
  const totalUSD   = nights * pricePerNight;
  const totalCents = Math.round(totalUSD * 100);

  function changeGuests(delta: number) {
    setNumHuespedes((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > maxGuests) return maxGuests;
      return next;
    });
  }

  // ─── Handlers de pago ──────────────────────────────────────────────────────

  async function handlePay(method: "card" | "payphone") {
    if (totalCents <= 0) {
      toast.error(es ? "El monto debe ser mayor a $0." : "Amount must be greater than $0.");
      return;
    }

    setLoading(true);
    try {
      const reference = es
        ? `Reserva ${roomName} - ${nights} noche(s) - ${numHuespedes} huésped(es)`
        : `Booking ${roomName} - ${nights} night(s) - ${numHuespedes} guest(s)`;

      // 1. Preparar transacción en Payphone
      const result = await preparePayment({
        amount:        totalCents,
        roomId:        room.id,
        roomName,
        guestName:     guestName || undefined,
        guestEmail:    email     || undefined,
        numHuespedes,
        reference,
      });

      // 2. Guardar datos en sessionStorage (se recuperan en PaymentResponse)
      const bookingData = {
        habitacion_id:     room.id,
        habitacion_nombre: roomName,
        guest_name:        guestName || undefined,
        guest_email:       email     || undefined,
        check_in:          checkIn,
        check_out:         checkOut,
        num_noches:        nights,
        num_huespedes:     numHuespedes,
        amount_usd:        totalUSD,
      };
      sessionStorage.setItem(`booking_${result.clientTransactionId}`, JSON.stringify(bookingData));

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

      // 4. Redirigir a Payphone
      window.location.href = method === "card" ? result.payWithCard : result.payWithPayPhone;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al procesar el pago.");
      setLoading(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/*
        Bottom-sheet en móvil (bottom-0, inset-x-0, rounded-t-2xl)
        Modal centrado en sm+ (left-[50%], top-[50%], translate)
        overflow-hidden en el contenedor + overflow-y-auto en el body
        → el botón X del shadcn (absolute right-4 top-4) queda SIEMPRE visible
      */}
      <DialogContent className="
        flex flex-col gap-0 p-0 overflow-hidden
        max-h-[90dvh] w-full
        fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl
        sm:bottom-auto sm:inset-x-auto sm:left-[50%] sm:top-[50%]
        sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-md sm:rounded-lg
        bg-background border-border
      ">
        {/* ── HEADER STICKY ──────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/30 px-5 pt-5 pb-4 flex items-start justify-between shrink-0">
          <div className="pr-2">
            <h2 className="font-serif text-lg sm:text-xl text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gold shrink-0" />
              {es ? "Reservar y pagar" : "Book & Pay"}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{roomName}</p>
          </div>
          {/* Botón cerrar con área de toque de 44px */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm hover:bg-secondary/60 transition-colors shrink-0 -mr-1 -mt-1"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* ── CONTENIDO DESPLAZABLE ──────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Precio por noche — solo lectura */}
          <div className="flex items-center justify-between px-4 py-3 bg-secondary/60 rounded-sm border border-border/40">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">
              {es ? "Precio por noche" : "Price per night"}
            </span>
            <span className="text-base font-bold text-gold">
              ${pricePerNight.toFixed(2)} USD
            </span>
          </div>

          {/* Selector de huéspedes */}
          <div>
            <label className="text-xs tracking-widest uppercase text-muted-foreground mb-2 block">
              {es ? "Huéspedes" : "Guests"}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => changeGuests(-1)}
                disabled={numHuespedes <= 1 || loading}
                aria-label="Reducir huéspedes"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-border rounded-sm hover:bg-secondary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="text-lg font-bold text-foreground w-8 text-center tabular-nums">
                {numHuespedes}
              </span>

              <button
                type="button"
                onClick={() => changeGuests(1)}
                disabled={numHuespedes >= maxGuests || loading}
                aria-label="Aumentar huéspedes"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-border rounded-sm hover:bg-secondary/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>

              <span className="text-xs text-muted-foreground/70">
                {es ? `Máx. ${maxGuests} persona${maxGuests !== 1 ? "s" : ""}` : `Max. ${maxGuests} guest${maxGuests !== 1 ? "s" : ""}`}
              </span>
            </div>
            {numHuespedes >= maxGuests && (
              <p className="text-[11px] text-amber-600 mt-1">
                {es
                  ? `Esta habitación tiene capacidad máxima de ${maxGuests} persona${maxGuests !== 1 ? "s" : ""}`
                  : `This room has a maximum capacity of ${maxGuests} guest${maxGuests !== 1 ? "s" : ""}`}
              </p>
            )}
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
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
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
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
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
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
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
              className="w-full min-h-[44px] px-3 py-2 text-sm border border-border rounded-sm bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-gold text-primary text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-[#b5952f] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {loading ? (es ? "Procesando..." : "Processing...") : (es ? "Pagar con tarjeta" : "Pay with card")}
            </button>

            <button
              onClick={() => handlePay("payphone")}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] bg-secondary text-secondary-foreground text-xs font-bold tracking-[0.1em] uppercase rounded-sm hover:bg-secondary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border border-border/40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-base">📱</span>}
              {loading ? (es ? "Procesando..." : "Processing...") : (es ? "Pagar con app Payphone" : "Pay with Payphone app")}
            </button>
          </div>

          {/* Nota de seguridad */}
          <div className="flex items-start gap-2 p-3 rounded-sm bg-secondary/50 text-[11px] text-muted-foreground leading-relaxed mb-2">
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

        </div>{/* fin scroll */}
      </DialogContent>
    </Dialog>
  );
}
