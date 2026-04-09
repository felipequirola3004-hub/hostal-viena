import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, MessageCircle, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import RoomModal from "@/components/RoomModal";
import PaymentForm from "@/components/PaymentForm";
import { supabase } from "@/lib/supabase";
import { Room } from "@/data/rooms";

// Precios por defecto en USD/noche (se usan si la habitación no tiene precio en DB)
const DEFAULT_PRICES: Record<string, number> = {
  "suite-colonial":        65,
  "habitacion-doble":      45,
  "habitacion-individual": 30,
};

function getRoomPrice(room: Room): number {
  if (room.price) {
    const parsed = parseFloat(room.price);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_PRICES[room.id] ?? 40;
}

// ─── Dialogo de opciones de reserva ───────────────────────────────────────────

interface BookingOptionsProps {
  room: Room;
  onClose: () => void;
  onPayCard: () => void;
  lang: string;
}

function BookingOptionsDialog({ room, onClose, onPayCard, lang }: BookingOptionsProps) {
  const roomName = room.name?.[lang as "es" | "en"] ?? room.name?.es;
  const message  = lang === "es"
    ? `Hola, me interesa reservar la habitación: ${roomName}`
    : `Hello, I would like to book the room: ${roomName}`;
  const whatsappUrl = `https://wa.me/593960927451?text=${encodeURIComponent(message)}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative bg-background border border-border rounded-sm shadow-2xl w-full max-w-sm overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1,    opacity: 1, y: 0 }}
          exit={{    scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Cabecera */}
          <div className="px-6 pt-6 pb-4 border-b border-border/40 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.18em] uppercase text-gold font-bold mb-1">
                {lang === "es" ? "Cómo deseas reservar" : "How would you like to book"}
              </p>
              <h2 className="font-serif text-lg text-foreground leading-tight">{roomName}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors mt-0.5 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Opciones */}
          <div className="p-6 space-y-3">
            {/* Opción 1: Pagar con tarjeta */}
            <button
              onClick={onPayCard}
              className="w-full flex items-center gap-4 px-5 py-4 bg-gold text-primary rounded-sm hover:bg-[#b5952f] transition-colors group text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.1em] uppercase">
                  {lang === "es" ? "Pagar con tarjeta" : "Pay with card"}
                </p>
                <p className="text-[11px] opacity-75 mt-0.5">
                  {lang === "es"
                    ? "Visa, Mastercard, Diners, Discover"
                    : "Visa, Mastercard, Diners, Discover"}
                </p>
              </div>
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border/40" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
                {lang === "es" ? "o" : "or"}
              </span>
              <div className="flex-1 border-t border-border/40" />
            </div>

            {/* Opción 2: WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full flex items-center gap-4 px-5 py-4 bg-secondary border border-border/40 rounded-sm hover:bg-secondary/70 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.1em] uppercase text-foreground">
                  {lang === "es" ? "Reservar por WhatsApp" : "Book via WhatsApp"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "es"
                    ? "Consulta disponibilidad y coordina"
                    : "Check availability and coordinate"}
                </p>
              </div>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Rooms() {
  const { lang, t } = useLanguage();

  // Modal de detalles
  const [detailRoom, setDetailRoom]   = useState<Room | null>(null);
  // Dialog de opciones de reserva
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  // Modal de pago con tarjeta
  const [paymentRoom, setPaymentRoom] = useState<Room | null>(null);

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      return data as Room[];
    },
  });

  if (isLoading) {
    return <div className="py-32 text-center text-gray-500">Cargando habitaciones...</div>;
  }
  if (error) {
    return <div className="py-32 text-center text-red-500">Error al cargar datos.</div>;
  }

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <SectionTitle title={t("rooms.title")} subtitle={t("rooms.subtitle")} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {rooms?.map((room, i) => {
            const priceUSD = getRoomPrice(room);

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border overflow-hidden group rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Imagen */}
                <div
                  className="overflow-hidden h-56 relative bg-gray-100 cursor-pointer"
                  onClick={() => setDetailRoom(room)}
                >
                  {room.image ? (
                    <img
                      src={room.image}
                      alt={room.name[lang as "es" | "en"]}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Nombre + precio */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-serif text-xl text-foreground leading-tight">
                      {room.name[lang as "es" | "en"]}
                    </h3>
                    <div className="text-right shrink-0">
                      <span className="text-gold font-bold text-lg leading-none">
                        ${priceUSD.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground text-[11px] block">
                        {lang === "es" ? "/noche" : "/night"}
                      </span>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                    {room.description[lang as "es" | "en"]}
                  </p>

                  {/* Amenities (máx 3) */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {room.amenities?.[lang as "es" | "en"]?.slice(0, 3).map((a, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-1 bg-secondary text-muted-foreground rounded-sm uppercase tracking-wide"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Botones — SOLO dos */}
                  <div className="mt-auto flex gap-3">
                    <button
                      onClick={() => setDetailRoom(room)}
                      className="flex-1 text-xs tracking-[0.1em] uppercase px-4 py-2.5 border border-border/60 text-foreground rounded-sm hover:border-gold hover:text-gold transition-colors"
                    >
                      {t("rooms.details")}
                    </button>
                    <button
                      onClick={() => setBookingRoom(room)}
                      className="flex-1 text-xs tracking-[0.1em] uppercase px-4 py-2.5 bg-gold text-primary font-bold rounded-sm hover:bg-[#b5952f] transition-colors"
                    >
                      {lang === "es" ? "Reservar" : "Book"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modal de detalles */}
      <RoomModal
        room={detailRoom}
        open={!!detailRoom}
        onClose={() => setDetailRoom(null)}
      />

      {/* Dialog de opciones de reserva */}
      {bookingRoom && (
        <BookingOptionsDialog
          room={bookingRoom}
          lang={lang}
          onClose={() => setBookingRoom(null)}
          onPayCard={() => {
            setPaymentRoom(bookingRoom);
            setBookingRoom(null);
          }}
        />
      )}

      {/* Modal de pago con tarjeta */}
      {paymentRoom && (
        <PaymentForm
          open={!!paymentRoom}
          room={paymentRoom}
          onClose={() => setPaymentRoom(null)}
        />
      )}
    </section>
  );
}
