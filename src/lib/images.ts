import heroHotel from "@/assets/hero-hotel.jpg";
import roomSuite from "@/assets/room-suite.jpg";
import roomDouble from "@/assets/room-double.jpg";
import roomSingle from "@/assets/room-single.jpg";
import breakfast from "@/assets/breakfast.jpg";
import lobby from "@/assets/lobby.jpg";
import courtyard from "@/assets/courtyard.jpg";
import hallway from "@/assets/hallway.jpg";
import facade from "@/assets/facade.jpg";

const imageMap: Record<string, string> = {
  "hero-hotel": heroHotel,
  "room-suite": roomSuite,
  "room-double": roomDouble,
  "room-single": roomSingle,
  breakfast,
  lobby,
  courtyard,
  hallway,
  facade,
};

export function getImage(key: string): string {
  return imageMap[key] || heroHotel;
}

export const galleryImages = [
  { key: "hero-hotel", alt: { es: "Patio colonial", en: "Colonial courtyard" } },
  { key: "room-suite", alt: { es: "Suite Colonial", en: "Colonial Suite" } },
  { key: "room-double", alt: { es: "Habitacion Doble", en: "Double Room" } },
  { key: "room-single", alt: { es: "Habitacion Individual", en: "Single Room" } },
  { key: "breakfast", alt: { es: "Desayuno", en: "Breakfast" } },
  { key: "lobby", alt: { es: "Recepcion", en: "Lobby" } },
  { key: "courtyard", alt: { es: "Patio interior", en: "Inner courtyard" } },
  { key: "hallway", alt: { es: "Pasillo", en: "Hallway" } },
  { key: "facade", alt: { es: "Fachada", en: "Facade" } },
];
