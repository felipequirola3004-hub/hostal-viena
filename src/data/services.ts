export interface Service {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  longDescription: { es: string; en: string };
  icon: string;
  image: string;
  schedule?: { es: string; en: string };
}

export const services: Service[] = [
  {
    id: "alojamiento",
    name: { es: "Alojamiento", en: "Accommodation" },
    description: {
      es: "Habitaciones con arquitectura colonial, comodas y equipadas para su descanso.",
      en: "Rooms with colonial architecture, comfortable and equipped for your rest.",
    },
    longDescription: {
      es: "Nuestras habitaciones conservan el encanto de la arquitectura colonial con techos altos, paredes de adobe y pisos de madera. Cada espacio ha sido cuidadosamente restaurado para ofrecer confort moderno sin perder la esencia historica. Disponemos de habitaciones individuales, dobles y suites, todas con bano privado y amenidades completas.",
      en: "Our rooms preserve the charm of colonial architecture with high ceilings, adobe walls and wooden floors. Each space has been carefully restored to offer modern comfort without losing its historical essence. We offer single, double rooms and suites, all with private bathroom and full amenities.",
    },
    icon: "bed",
    image: "room-suite",
  },
  {
    id: "desayuno",
    name: { es: "Desayuno Incluido", en: "Breakfast Included" },
    description: {
      es: "Desayuno completo con productos frescos y locales cada manana.",
      en: "Full breakfast with fresh, local products every morning.",
    },
    longDescription: {
      es: "Cada manana servimos un desayuno completo que incluye cafe o te, jugos naturales de frutas tropicales, pan artesanal, huevos preparados al gusto, frutas frescas de temporada y opciones locales. Nuestro desayuno se sirve en el comedor colonial con vista al patio interior.",
      en: "Every morning we serve a full breakfast that includes coffee or tea, natural tropical fruit juices, artisan bread, eggs prepared to your liking, fresh seasonal fruits and local options. Our breakfast is served in the colonial dining room overlooking the inner courtyard.",
    },
    icon: "coffee",
    image: "breakfast",
    schedule: { es: "7:00 AM - 9:30 AM", en: "7:00 AM - 9:30 AM" },
  },
  {
    id: "atencion-personalizada",
    name: { es: "Atencion Personalizada", en: "Personalized Service" },
    description: {
      es: "Equipo bilingue dedicado a hacer de su estadia una experiencia excepcional.",
      en: "Bilingual team dedicated to making your stay an exceptional experience.",
    },
    longDescription: {
      es: "Nuestro equipo habla espanol e ingles, y esta capacitado para brindar orientacion turistica, recomendaciones de restaurantes, coordinacion de transporte y asistencia general. Nos enorgullecemos de ofrecer un trato cercano y profesional a cada huesped.",
      en: "Our team speaks Spanish and English, and is trained to provide tourist guidance, restaurant recommendations, transport coordination and general assistance. We take pride in offering a close and professional treatment to every guest.",
    },
    icon: "users",
    image: "lobby",
  },
  {
    id: "limpieza",
    name: { es: "Limpieza Diaria", en: "Daily Cleaning" },
    description: {
      es: "Servicio de limpieza y mantenimiento diario de habitaciones.",
      en: "Daily room cleaning and maintenance service.",
    },
    longDescription: {
      es: "Mantenemos los mas altos estandares de higiene y limpieza. Cada habitacion recibe servicio diario de limpieza, cambio de ropa de cama y toallas, y revision de amenidades. Las areas comunes se mantienen impecables durante todo el dia.",
      en: "We maintain the highest hygiene and cleaning standards. Each room receives daily cleaning service, bed linen and towel change, and amenity check. Common areas are kept impeccable throughout the day.",
    },
    icon: "sparkles",
    image: "hallway",
  },
  {
    id: "recepcion",
    name: { es: "Recepcion e Informacion Turistica", en: "Reception & Tourist Information" },
    description: {
      es: "Recepcion con informacion turistica, mapas y asistencia para planificar su visita.",
      en: "Reception with tourist information, maps and assistance to plan your visit.",
    },
    longDescription: {
      es: "Nuestra recepcion funciona como centro de informacion turistica. Disponemos de mapas de la ciudad, guias de atracciones, horarios de transporte publico y contactos de tours locales. Nuestro personal le ayudara a planificar cada dia de su visita.",
      en: "Our reception functions as a tourist information center. We have city maps, attraction guides, public transport schedules and local tour contacts. Our staff will help you plan every day of your visit.",
    },
    icon: "map-pin",
    image: "lobby",
  },
];
