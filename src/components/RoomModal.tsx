import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Room } from "@/data/rooms";
import PaymentForm from "@/components/PaymentForm";

// CONSTANTES DE LINKS EXTERNOS
const LINKS = {
  tripadvisor: "https://www.tripadvisor.com/Hotel_Review-g294308-d1199594-Reviews-Viena_Hotel_Internacional-Quito_Pichincha_Province.html",
  booking: "https://www.booking.com/hotel/ec/hostal-viena-internacional.es.html?aid=311839&label=wei-ye-na-guo-ji-jiu-dian-zhong-qing-yu-bei-ji-chang-dian-IL8aNCy9v3Znv170tFrLoAS260992902665%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap%3Aneg%3Afi%3Atikwd-297130457022%3Alp9069516%3Ali%3Adec%3Adm%3Appccp%3DUmFuZG9tSVYkc2RlIyh9YWiN3YY6Tdis-hFTYSRJEXs&sid=1bd05f023ca34768fbdcb25f9cfe127f&all_sr_blocks=1577711901_428877580_2_1_0&checkin=2026-02-12&checkout=2026-02-13&dest_id=15777119&dest_type=hotel&dist=0&group_adults=2&group_children=0&hapos=1&highlighted_blocks=1577711901_428877580_2_1_0&hpos=1&matching_block_id=1577711901_428877580_2_1_0&no_rooms=1&req_adults=2&req_children=0&room1=A%2CA&sb_price_type=total&sr_order=popularity&sr_pri_blocks=1577711901_428877580_2_1_0__3240&srepoch=1770860868&srpvid=f1eb0c9f81ae0107&type=total&ucfs=1&",
  airbnb: "https://www.airbnb.com.ec/rooms/1618146736640763551?viralityEntryPoint=1&s=76&_set_bev_on_new_domain=1770612745_EANGYzZmIwYTU5OT&set_everest_cookie_on_new_domain=1770612745.EAYWQ4ODE0Yjk0NjQ4NT.ksee3y7HUcWE31nJ9zg9Z-bVXeBN3bRlR3EEVuSilXA&source_impression_id=p3_1770861110_P3ip3lqx-UGrgXva"
};

interface RoomModalProps {
  room: Room | null;
  open: boolean;
  onClose: () => void;
}

export default function RoomModal({ room, open, onClose }: RoomModalProps) {
  const { lang, t } = useLanguage();
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (!room) return null;

  const message = lang === "es"
    ? `Hola, me interesa reservar la habitación: ${room.name?.es}`
    : `Hello, I would like to book the room: ${room.name?.en}`;

  const whatsappUrl = `https://wa.me/593960927451?text=${encodeURIComponent(message)}`;

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      {/* CAMBIO: max-w-4xl para hacerlo más ancho y permitir dos columnas */}
      <DialogContent className="max-w-lg md:max-w-4xl bg-background border-border p-0 overflow-hidden md:max-h-[85vh]">
        
        <div className="flex flex-col md:flex-row h-full">
          
          {/* COLUMNA IZQUIERDA: IMAGEN (Ocupa toda la altura en PC) */}
          <div className="relative w-full md:w-5/12 h-48 md:h-auto bg-gray-100 shrink-0">
            <img
              src={room.image}
              alt={room.name?.[lang]}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/600x400?text=No+Image";
              }}
            />
          </div>

          {/* COLUMNA DERECHA: CONTENIDO */}
          <div className="flex-1 p-5 md:p-6 flex flex-col overflow-y-auto">
            
            {/* Cabecera */}
            <DialogHeader className="mb-2">
              <DialogTitle className="font-serif text-xl md:text-2xl text-foreground">
                {room.name?.[lang]}
              </DialogTitle>
            </DialogHeader>
            
            <div className="divider-gold !mx-0 mb-3 w-16" />
            
            {/* Descripción (Scrollable si es muy larga, pero no empuja los botones) */}
            <div className="flex-1 overflow-y-auto pr-2">
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {room.longDescription ? room.longDescription[lang] : room.description?.[lang]}
                </p>

                {/* Amenities - Integrados más compactos */}
                <div className="mt-4">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-gold mb-2 font-bold">
                        {lang === "es" ? "Servicios incluidos" : "Included amenities"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {room.amenities?.[lang]?.map((a) => (
                        <span key={a} className="text-[11px] px-2 py-1 rounded-sm bg-secondary text-secondary-foreground">
                            {a}
                        </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ZONA INFERIOR FIJA (Botones) */}
            <div className="mt-5 pt-4 border-t border-border/40 space-y-3">

                {/* Botón pagar con tarjeta — Payphone */}
                <button
                  onClick={() => setPaymentOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-xs tracking-[0.1em] uppercase px-6 py-3 bg-gold text-primary font-bold hover:bg-[#b5952f] transition-colors rounded-sm shadow-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  {lang === "es" ? "Reservar y pagar con tarjeta" : "Book & pay with card"}
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                    {/* Botón WhatsApp */}
                    <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto text-center text-xs tracking-[0.1em] uppercase px-6 py-3 bg-secondary text-secondary-foreground font-bold hover:bg-secondary/70 transition-colors rounded-sm border border-border/40 order-2 sm:order-1 whitespace-nowrap"
                    >
                    {t("rooms.book")}
                    </a>

                    {/* Iconos Sociales */}
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground opacity-60 hidden sm:block whitespace-nowrap">
                            {lang === 'es' ? 'O reserva en:' : 'Or book on:'}
                        </span>
                        
                        <div className="flex gap-2">
                        {/* TripAdvisor */}
                        <a 
                            href={LINKS.tripadvisor} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-[#34E0A1]/10 transition-colors"
                            title="TripAdvisor"
                        >
                            <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-[#08808a] transition-colors" viewBox="0 -96 512.2 512.2">
                                <path d="M128.2 127.9C92.7 127.9 64 156.6 64 192c0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1.1-35.4-28.6-64.1-64-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S174 166.7 174 192s-20.5 45.9-45.8 45.9z"/>
                                <circle cx="128.4" cy="191.9" r="31.9"/>
                                <path d="M384.2 127.9c-35.4 0-64.1 28.7-64.1 64.1 0 35.4 28.7 64.1 64.1 64.1 35.4 0 64.1-28.7 64.1-64.1 0-35.4-28.7-64.1-64.1-64.1zm0 110c-25.3 0-45.9-20.5-45.9-45.9s20.5-45.9 45.9-45.9S430 166.7 430 192s-20.5 45.9-45.8 45.9z"/>
                                <circle cx="384.4" cy="191.9" r="31.9"/>
                                <path d="M474.4 101.2l37.7-37.4h-76.4C392.9 29 321.8 0 255.9 0c-66 0-136.5 29-179.3 63.8H0l37.7 37.4C14.4 124.4 0 156.5 0 192c0 70.8 57.4 128.2 128.2 128.2 32.5 0 62.2-12.1 84.8-32.1l43.4 31.9 42.9-31.2-.5-1.2c22.7 20.2 52.5 32.5 85.3 32.5 70.8 0 128.2-57.4 128.2-128.2-.1-35.4-14.6-67.5-37.9-90.7zM368 64.8c-60.7 7.6-108.3 57.6-111.9 119.5-3.7-62-51.4-112.1-112.3-119.5 30.6-22 69.6-32.8 112.1-32.8S337.4 42.8 368 64.8zM128.2 288.2C75 288.2 32 245.1 32 192s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2zm256 0c-53.1 0-96.2-43.1-96.2-96.2s43.1-96.2 96.2-96.2 96.2 43.1 96.2 96.2c-.1 53.1-43.1 96.2-96.2 96.2z"/>
                            </svg>
                        </a>

                        {/* Booking.com */}
                        <a 
                            href={LINKS.booking} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-blue-50 transition-colors"
                            title="Booking.com"
                        >
                            <svg 
                                className="w-5 h-5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" 
                                viewBox="-.092 .015 2732.125 2671.996"
                            >
                                <path d="m2732.032 513.03c0-283.141-229.978-513.015-513.118-513.015h-1705.89c-283.138 0-513.116 229.874-513.116 513.015v1645.965c0 283.066 229.978 513.016 513.118 513.016h1705.889c283.14 0 513.118-229.95 513.118-513.016z" fill="#0c3b7c"/>
                                <path d="m.001 1659.991h1364.531v1012.019h-1364.53z" fill="#0c3b7c"/>
                                <g fillRule="nonzero">
                                    <path d="m1241.6 1768.638-220.052-.22v-263.12c0-56.22 21.808-85.48 69.917-92.165h150.136c107.068 0 176.328 67.507 176.328 176.766 0 112.219-67.507 178.63-176.328 178.739zm-220.052-709.694v-69.26c0-60.602 25.643-89.424 81.862-93.15h112.657c96.547 0 154.41 57.753 154.41 154.52 0 73.643-39.671 159.67-150.903 159.67h-198.026zm501.037 262.574-39.78-22.356 34.74-29.699c40.437-34.74 108.163-112.876 108.163-247.67 0-206.464-160.109-339.614-407.888-339.614h-282.738v-.11h-32.219c-73.424 2.74-132.273 62.466-133.04 136.329v1171.499h453.586c275.396 0 453.148-149.917 453.148-382.135 0-125.04-57.424-231.889-153.972-286.244" fill="#fff"/>
                                    <path d="m1794.688 1828.066c0-89.492 72.178-161.894 161.107-161.894 89.154 0 161.669 72.402 161.669 161.894 0 89.379-72.515 161.894-161.67 161.894-88.928 0-161.106-72.515-161.106-161.894" fill="#00bafc"/>
                                </g>
                            </svg>
                        </a>

                        {/* Airbnb */}
                        <a 
                            href={LINKS.airbnb} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-[#FF5A5F]/10 transition-colors"
                            title="Airbnb"
                        >
                            <svg className="w-5 h-5 fill-current text-gray-400 group-hover:text-[#FF5A5F] transition-colors" viewBox="0 0 32 32">
                                <path d="M29.524 22.279c-0.372-1.044-0.752-1.907-1.183-2.74l0.058 0.123v-0.038c-2.361-5.006-4.551-9.507-6.632-13.551l-0.139-0.204c-1.483-3.040-2.544-4.866-5.627-4.866-3.049 0-4.344 2.118-5.667 4.871l-0.101 0.2c-2.086 4.044-4.275 8.551-6.627 13.555v0.066l-0.699 1.525c-0.262 0.63-0.396 0.96-0.431 1.058-0.279 0.691-0.441 1.492-0.441 2.332 0 3.526 2.859 6.385 6.385 6.385 0.020 0 0.040-0 0.060-0l-0.003 0c0.117-0 0.232-0.012 0.342-0.036l-0.011 0.002h0.465c2.744-0.574 5.073-2.061 6.71-4.121l0.018-0.024c1.656 2.082 3.983 3.568 6.65 4.132l0.075 0.013h0.465c0.099 0.021 0.214 0.034 0.331 0.034h0c0.017 0 0.038 0 0.059 0 3.526 0 6.384-2.858 6.384-6.384 0-0.84-0.162-1.642-0.457-2.376l0.015 0.043zM27.999 25.266c-0.262 1.581-1.309 2.87-2.719 3.467l-0.030 0.011c-2.815 1.225-5.602-0.729-7.988-3.379 3.945-4.937 4.674-8.782 2.98-11.269-0.887-1.289-2.353-2.123-4.015-2.123-0.080 0-0.159 0.002-0.237 0.006l0.011-0c-0.023-0-0.049-0.001-0.076-0.001-2.816 0-5.098 2.282-5.098 5.098 0 0.583 0.098 1.142 0.278 1.664l-0.011-0.036c0.782 2.574 2.032 4.8 3.665 6.686l-0.019-0.023c-0.978 1.128-2.103 2.094-3.352 2.879l-0.062 0.036c-0.657 0.387-1.43 0.657-2.256 0.758l-0.029 0.003c-0.186 0.027-0.401 0.043-0.62 0.043-2.474 0-4.48-2.006-4.48-4.48 0-0.599 0.117-1.17 0.33-1.692l-0.011 0.030c0.165-0.431 0.494-1.225 1.056-2.451l0.031-0.066c1.829-3.971 4.051-8.485 6.604-13.49l0.066-0.165 0.725-1.395c0.348-0.857 0.932-1.559 1.672-2.043l0.017-0.010c0.425-0.248 0.935-0.395 1.48-0.395 0.027 0 0.054 0 0.081 0.001l-0.004-0c1.024 0.009 1.933 0.497 2.514 1.251l0.006 0.008c0.197 0.299 0.431 0.696 0.727 1.191l0.697 1.361 0.1 0.199c2.551 5.004 4.775 9.507 6.597 13.489l0.033 0.031 0.666 1.525 0.397 0.955c0.199 0.493 0.314 1.065 0.314 1.664 0 0.232-0.017 0.46-0.051 0.683l0.003-0.025zM16.001 23.841c-1.367-1.544-2.407-3.411-2.991-5.47l-0.024-0.099c-0.126-0.348-0.198-0.749-0.198-1.167 0-0.711 0.21-1.372 0.57-1.927l-0.008 0.014c0.543-0.803 1.45-1.325 2.479-1.325 0.060 0 0.12 0.002 0.18 0.005l-0.008-0c0.052-0.003 0.112-0.005 0.173-0.005 1.030 0 1.938 0.525 2.469 1.323l0.007 0.011c0.351 0.538 0.56 1.196 0.56 1.904 0 0.422-0.074 0.826-0.211 1.201l0.008-0.024c-0.624 2.155-1.661 4.019-3.029 5.588l0.015-0.017z"></path>
                            </svg>
                        </a>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog de pago — fuera del Dialog de habitación para evitar conflictos de z-index */}
    {paymentOpen && (
      <PaymentForm
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        room={room}
      />
    )}
    </>
  );
}