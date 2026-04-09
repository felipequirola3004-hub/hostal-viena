import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import ServiceModal from "@/components/ServiceModal";
import { services, Service } from "@/data/services";
import { getImage } from "@/lib/images";
import { Bed, Coffee, Users, Sparkles, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";

// IMPORTAR LAS IMÁGENES DIRECTAMENTE (ajusta las rutas según tu estructura)
import momento1 from "@/assets/momento 1.jpg";
import momento2 from "@/assets/momento 2.jpg";
import momento3 from "@/assets/momento 3.jpg";
import momento4 from "@/assets/momento 4.jpg";
import momento5 from "@/assets/momento 5.jpg";
import momento6 from "@/assets/momento 6.jpg";

const iconMap: Record<string, React.ReactNode> = {
  bed: <Bed size={20} />,
  coffee: <Coffee size={20} />,
  users: <Users size={20} />,
  sparkles: <Sparkles size={20} />,
  "map-pin": <MapPin size={20} />,
};

export default function Services() {
  const { lang, t } = useLanguage();
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // Array con las imágenes importadas
  const momentos = [
    { id: 1, src: momento1, alt: "Momento 1" },
    { id: 2, src: momento2, alt: "Momento 2" },
    { id: 3, src: momento3, alt: "Momento 3" },
    { id: 4, src: momento4, alt: "Momento 4" },
    { id: 5, src: momento5, alt: "Momento 5" },
    { id: 6, src: momento6, alt: "Momento 6" },
  ];

  const openImageModal = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    setSelectedImage((prev) => (prev !== null ? (prev === 0 ? momentos.length - 1 : prev - 1) : null));
  };

  const goToNext = () => {
    setSelectedImage((prev) => (prev !== null ? (prev === momentos.length - 1 ? 0 : prev + 1) : null));
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeImageModal();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <SectionTitle title={t("services.title")} subtitle={t("services.subtitle")} />

        <div className="max-w-5xl mx-auto space-y-16">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className={`grid grid-cols-1 md:grid-cols-5 gap-0 cursor-pointer group`}
              onClick={() => setSelected(service)}
            >
              <div className={`md:col-span-2 overflow-hidden ${i % 2 === 1 ? "md:order-2" : ""}`}>
                <img
                  src={getImage(service.image)}
                  alt={service.name[lang]}
                  className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className={`md:col-span-3 flex flex-col justify-center p-8 md:p-12 bg-card border border-border group-hover:border-gold/20 transition-colors ${i % 2 === 1 ? "md:order-1" : ""}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-gold">{iconMap[service.icon]}</span>
                  <h3 className="font-serif text-xl text-foreground">{service.name[lang]}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description[lang]}</p>
                {service.schedule && (
                  <p className="text-xs text-gold">
                    {lang === "es" ? "Horario" : "Schedule"}: {service.schedule[lang]}
                  </p>
                )}
                <button className="self-start mt-6 text-xs tracking-[0.1em] uppercase text-gold border-b border-gold/30 hover:border-gold pb-0.5 transition-colors">
                  {t("services.more")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sección de Momentos Inolvidables */}
        <div className="max-w-6xl mx-auto mt-24">
          <SectionTitle 
            title={lang === "es" ? "Momentos Inolvidables" : "Unforgettable Moments"} 
            subtitle={lang === "es" ? "Los mejores momentos de tu estancia" : "The best moments of your stay"} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {momentos.map((momento, index) => (
              <motion.div
                key={momento.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer aspect-[4/3]"
                onClick={() => openImageModal(index)}
              >
                <img
                  src={momento.src}
                  alt={momento.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de imágenes */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeImageModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Botón cerrar */}
          <button
            onClick={closeImageModal}
            className="absolute top-4 right-4 z-50 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all duration-300"
          >
            <X size={32} />
          </button>

          {/* Botón anterior */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 z-50 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all duration-300"
          >
            <ChevronLeft size={40} />
          </button>

          {/* Botón siguiente */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 z-50 p-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all duration-300"
          >
            <ChevronRight size={40} />
          </button>

          {/* Contador de imágenes */}
          <div className="absolute top-4 left-4 z-50 text-white/80 bg-black/20 px-3 py-1 rounded-full text-sm">
            {selectedImage + 1} / {momentos.length}
          </div>

          {/* Imagen actual */}
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-7xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={momentos[selectedImage].src}
              alt={momentos[selectedImage].alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </motion.div>

          {/* Miniaturas inferiores */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto px-4 py-2 max-w-full hide-scrollbar">
            {momentos.map((momento, index) => (
              <button
                key={momento.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                  index === selectedImage 
                    ? 'ring-2 ring-gold scale-110' 
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={momento.src}
                  alt={momento.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <ServiceModal service={selected} open={!!selected} onClose={() => setSelected(null)} />
    </section>
  );
}