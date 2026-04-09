export interface Review {
  id: string;
  name: string;
  country: { es: string; en: string };
  rating: number;
  text: { es: string; en: string };
  source: string;
  date: string;
}

export const reviews: Review[] = [
  {
    id: "1",
    name: "Marcus W.",
    country: { es: "Alemania", en: "Germany" },
    rating: 5,
    text: {
      es: "Un lugar encantador con una arquitectura colonial impresionante. El personal fue extremadamente amable y servicial. El desayuno es delicioso y abundante. Totalmente recomendado para quienes buscan autenticidad.",
      en: "A charming place with impressive colonial architecture. The staff was extremely friendly and helpful. The breakfast is delicious and plentiful. Totally recommended for those seeking authenticity.",
    },
    source: "Google",
    date: "2024-11",
  },
  {
    id: "2",
    name: "Sophie L.",
    country: { es: "Francia", en: "France" },
    rating: 5,
    text: {
      es: "La ubicacion es perfecta para explorar la ciudad. Las habitaciones son limpias y acogedoras, con un encanto colonial que no encuentras en los hoteles modernos. Volveria sin dudarlo.",
      en: "The location is perfect for exploring the city. The rooms are clean and cozy, with a colonial charm you won't find in modern hotels. I would return without hesitation.",
    },
    source: "Booking",
    date: "2024-10",
  },
  {
    id: "3",
    name: "James R.",
    country: { es: "Estados Unidos", en: "United States" },
    rating: 4,
    text: {
      es: "Excelente relacion calidad-precio. El patio interior es hermoso y tranquilo. El personal habla ingles y nos ayudo a organizar tours por la ciudad. Una experiencia autentica y muy agradable.",
      en: "Excellent value for money. The inner courtyard is beautiful and peaceful. The staff speaks English and helped us organize city tours. An authentic and very pleasant experience.",
    },
    source: "Google",
    date: "2024-09",
  },
  {
    id: "4",
    name: "Ana M.",
    country: { es: "Colombia", en: "Colombia" },
    rating: 5,
    text: {
      es: "Me senti como en casa desde el primer momento. La atencion es personalizada y genuina. Los pasillos, los balcones y cada rincon del hostal tienen una historia que contar. Una joya colonial.",
      en: "I felt at home from the first moment. The attention is personalized and genuine. The corridors, balconies and every corner of the hostal have a story to tell. A colonial gem.",
    },
    source: "Booking",
    date: "2025-01",
  },
];
