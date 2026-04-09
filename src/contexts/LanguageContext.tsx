import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "es" | "en";

interface Translations {
  [key: string]: { es: string; en: string };
}

const translations: Translations = {
  // Nav
  "nav.home": { es: "Inicio", en: "Home" },
  "nav.rooms": { es: "Habitaciones", en: "Rooms" },
  "nav.services": { es: "Servicios", en: "Services" },
  "nav.gallery": { es: "Galeria & Ubicacion", en: "Gallery & Location" },
  "nav.reviews": { es: "Opiniones & Contacto", en: "Reviews & Contact" },
  // Hero
  "hero.title": { es: "Hostal Casa Colonial Viena Internacional", en: "Hostal Casa Colonial Viena Internacional" },
  "hero.subtitle": {
    es: "Una experiencia de hospedaje colonial autentica, donde la historia y el confort se encuentran.",
    en: "An authentic colonial lodging experience, where history and comfort meet.",
  },
  "hero.cta": { es: "Reservar ahora", en: "Book now" },
  // About
  "about.title": { es: "Quienes Somos", en: "About Us" },
  "about.text": {
    es: "El Hostal Casa Colonial Viena Internacional es un espacio dedicado al alojamiento turistico, orientado a viajeros internacionales que buscan confort, hospitalidad y una experiencia autentica. Nuestra infraestructura conserva la esencia arquitectonica colonial, integrando materiales tradicionales, balcones, pasillos amplios y detalles historicos que reflejan la identidad cultural de la ciudad.",
    en: "Hostal Casa Colonial Viena Internacional is a space dedicated to tourist accommodation, oriented to international travelers seeking comfort, hospitality and an authentic experience. Our infrastructure preserves the colonial architectural essence, integrating traditional materials, balconies, wide corridors and historical details that reflect the cultural identity of the city.",
  },
  "about.text2": {
    es: "Combinamos este estilo clasico con servicios modernos pensados para garantizar una estadia comoda, segura y placentera. Nuestro equipo destaca por su atencion personalizada y por brindar orientacion a huespedes nacionales e internacionales, ofreciendo un ambiente tranquilo, calido y profesional.",
    en: "We combine this classic style with modern services designed to guarantee a comfortable, safe and pleasant stay. Our team stands out for its personalized attention and for providing guidance to national and international guests, offering a calm, warm and professional atmosphere.",
  },
  // Rooms
  "rooms.title": { es: "Nuestras Habitaciones", en: "Our Rooms" },
  "rooms.subtitle": { es: "Confort y tradicion en cada detalle", en: "Comfort and tradition in every detail" },
  "rooms.book": { es: "Reservar por WhatsApp", en: "Book via WhatsApp" },
  "rooms.details": { es: "Ver detalles", en: "View details" },
  // Services
  "services.title": { es: "Servicios", en: "Services" },
  "services.subtitle": { es: "Todo lo que necesita para una estadia excepcional", en: "Everything you need for an exceptional stay" },
  "services.more": { es: "Mas informacion", en: "More information" },
  // Home sections
  "home.rooms.title": { es: "Habitaciones", en: "Rooms" },
  "home.rooms.subtitle": { es: "Espacios pensados para su descanso", en: "Spaces designed for your rest" },
  "home.rooms.cta": { es: "Ver todas las habitaciones", en: "View all rooms" },
  "home.services.title": { es: "Nuestros Servicios", en: "Our Services" },
  "home.services.subtitle": { es: "Atencion integral para una estadia placentera", en: "Comprehensive care for a pleasant stay" },
  "home.services.cta": { es: "Ver todos los servicios", en: "View all services" },
  "home.location.title": { es: "Ubicacion", en: "Location" },
  "home.location.address": { es: "Juan José Flores 5-04, Centro Histórico, Quito, 170401", en: "Juan José Flores 5-04, Historic Center, Quito, Ecuador, 170401" },
  "home.contact.title": { es: "Contactenos", en: "Contact Us" },
  "home.contact.subtitle": { es: "Estamos listos para atenderle", en: "We are ready to assist you" },
  // Gallery
  "gallery.title": { es: "Galeria", en: "Gallery" },
  "gallery.subtitle": { es: "Descubra nuestros espacios", en: "Discover our spaces" },
  "location.title": { es: "Ubicacion", en: "Location" },
  "location.nearby": { es: "Lugares cercanos de interes", en: "Nearby points of interest" },
  // Reviews
  "reviews.title": { es: "Opiniones de Huespedes", en: "Guest Reviews" },
  "reviews.subtitle": { es: "Lo que dicen quienes nos han visitado", en: "What our visitors say" },
  "contact.title": { es: "Contacto", en: "Contact" },
  "contact.subtitle": { es: "Estamos a su disposicion", en: "We are at your service" },
  // Footer
  "footer.rights": { es: "Todos los derechos reservados.", en: "All rights reserved." },
  // Common
  "common.close": { es: "Cerrar", en: "Close" },
  // Payment
  "payment.bookPay":     { es: "Reservar y pagar con tarjeta", en: "Book & pay with card" },
  "payment.nights":      { es: "Número de noches", en: "Number of nights" },
  "payment.priceNight":  { es: "Precio por noche (USD)", en: "Price per night (USD)" },
  "payment.email":       { es: "Correo electrónico (opcional)", en: "Email (optional)" },
  "payment.total":       { es: "Total a pagar", en: "Total to pay" },
  "payment.payCard":     { es: "Pagar con tarjeta", en: "Pay with card" },
  "payment.payApp":      { es: "Pagar con app Payphone", en: "Pay with Payphone app" },
  "payment.processing":  { es: "Procesando...", en: "Processing..." },
  "payment.approved":    { es: "¡Pago aprobado!", en: "Payment approved!" },
  "payment.cancelled":   { es: "Pago cancelado", en: "Payment cancelled" },
  "payment.error":       { es: "Error al procesar el pago", en: "Payment processing error" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  const t = (key: string): string => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
