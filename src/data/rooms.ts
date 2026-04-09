export interface Room {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  // AGREGA EL '?' AQUÍ ABAJO 👇
  longDescription?: { es: string; en: string }; 
  image: string;
  amenities: { es: string[]; en: string[] };
  capacity: number;
  price?: string;
}

export const rooms: Room[] = [
  {
    id: "suite-colonial",
    name: { es: "Suite Colonial", en: "Colonial Suite" },
    description: {
      es: "Amplia suite con decoracion colonial, cama king y vista al patio interior.",
      en: "Spacious suite with colonial decor, king bed and courtyard view.",
    },
    longDescription: {
      es: "Nuestra Suite Colonial es el espacio mas distinguido del hostal. Con techos altos, mobiliario de epoca y una vista privilegiada al patio interior, ofrece una experiencia de alojamiento unica que combina la elegancia historica con todas las comodidades modernas. Ideal para viajeros que buscan una estadia memorable.",
      en: "Our Colonial Suite is the most distinguished space in the hostal. With high ceilings, period furniture and a privileged view of the inner courtyard, it offers a unique accommodation experience that combines historical elegance with all modern comforts. Ideal for travelers seeking a memorable stay.",
    },
    image: "room-suite",
    amenities: {
      es: ["Wi-Fi gratuito", "Bano privado", "Desayuno incluido", "Aire acondicionado", "TV por cable", "Caja fuerte"],
      en: ["Free Wi-Fi", "Private bathroom", "Breakfast included", "Air conditioning", "Cable TV", "Safe box"],
    },
    capacity: 2,
  },
  {
    id: "habitacion-doble",
    name: { es: "Habitacion Doble", en: "Double Room" },
    description: {
      es: "Habitacion confortable con dos camas individuales y decoracion clasica.",
      en: "Comfortable room with two single beds and classic decor.",
    },
    longDescription: {
      es: "La Habitacion Doble es perfecta para amigos o companeros de viaje. Cuenta con dos camas individuales, mobiliario clasico de madera y un ambiente acogedor. Dispone de bano privado completo y todas las amenidades necesarias para una estadia placentera.",
      en: "The Double Room is perfect for friends or travel companions. It features two single beds, classic wooden furniture and a cozy atmosphere. It has a full private bathroom and all amenities needed for a pleasant stay.",
    },
    image: "room-double",
    amenities: {
      es: ["Wi-Fi gratuito", "Bano privado", "Desayuno incluido", "Ventilador", "Escritorio"],
      en: ["Free Wi-Fi", "Private bathroom", "Breakfast included", "Fan", "Desk"],
    },
    capacity: 2,
  },
  {
    id: "habitacion-individual",
    name: { es: "Habitacion Individual", en: "Single Room" },
    description: {
      es: "Acogedora habitacion individual, ideal para viajeros solitarios.",
      en: "Cozy single room, ideal for solo travelers.",
    },
    longDescription: {
      es: "Nuestra Habitacion Individual ofrece todo lo necesario para el viajero solitario. Un espacio intimo y bien equipado, con decoracion colonial y ambiente tranquilo. Incluye bano privado, desayuno y acceso a todas las areas comunes del hostal.",
      en: "Our Single Room offers everything a solo traveler needs. An intimate and well-equipped space with colonial decor and a quiet atmosphere. Includes private bathroom, breakfast and access to all common areas of the hostal.",
    },
    image: "room-single",
    amenities: {
      es: ["Wi-Fi gratuito", "Bano privado", "Desayuno incluido", "Ventilador"],
      en: ["Free Wi-Fi", "Private bathroom", "Breakfast included", "Fan"],
    },
    capacity: 1,
  },
];
