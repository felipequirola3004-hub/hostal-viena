import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import { supabase } from "@/lib/supabase";
import { 
  X, 
  PlayCircle, 
  Plane, 
  Car, 
  BusFront, 
  MapPin, 
  Footprints, 
  Clock, 
  Info 
} from "lucide-react";

// --- DATA: LUGARES CERCANOS ---
const nearbyPlaces = {
  es: [
    { name: "Plaza Grande", dist: "250m", time: "3 min a pie" },
    { name: "Catedral Metropolitana", dist: "300m", time: "4 min a pie" },
    { name: "Iglesia del Sagrario", dist: "350m", time: "4 min a pie" },
    { name: "Museo Casa de Sucre", dist: "550m", time: "7 min a pie" },
    { name: "Iglesia de San Francisco", dist: "700m", time: "9 min a pie" },
    { name: "Parque Itchimbía", dist: "1.2km", time: "15 min a pie" },
  ],
  en: [
    { name: "Independence Square", dist: "250m", time: "3 min walk" },
    { name: "Metropolitan Cathedral", dist: "300m", time: "4 min walk" },
    { name: "El Sagrario Church", dist: "350m", time: "4 min walk" },
    { name: "Casa de Sucre Museum", dist: "550m", time: "7 min walk" },
    { name: "San Francisco Church", dist: "700m", time: "9 min walk" },
    { name: "Itchimbía Park", dist: "1.2km", time: "15 min walk" },
  ],
};

// --- DATA: CÓMO LLEGAR (3 SECCIONES) ---
const arrivalInfo = {
  es: {
    airport: {
      title: "Desde el Aeropuerto (UIO)",
      description: "El Aeropuerto Mariscal Sucre está a unos 45-60 minutos del Centro Histórico dependiendo del tráfico.",
      details: ["Taxi / Uber: Costo aprox $25 - $30.", "Aeroservicios: Bus directo al Parque Bicentenario, luego tomar taxi.", "Transfer privado: Podemos coordinarlo bajo pedido."]
    },
    car: {
      title: "En Automóvil",
      description: "El acceso al Centro Histórico tiene restricciones de tráfico en ciertas horas (Pico y Placa).",
      details: ["Parqueadero Cadisan: Calle Mejía (Abierto 24h).", "Parqueadero La Ronda: Sector sur del centro.", "Recomendamos usar Waze o Google Maps poniendo el nombre del hotel."]
    },
    public: {
      title: "Transporte Público",
      description: "La forma más eficiente de llegar es mediante el sistema metropolitano.",
      details: ["Metro de Quito: Estación 'San Francisco' (a 5 min).", "Trolebús: Parada 'Plaza del Teatro' (a 4 min).", "Ecovía: Parada 'Marín Central' (a 10 min, subida)."]
    }
  },
  en: {
    airport: {
      title: "From the Airport (UIO)",
      description: "Mariscal Sucre Airport is about 45-60 minutes from the Historic Center depending on traffic.",
      details: ["Taxi / Uber: Approx cost $25 - $30.", "Aeroservicios: Shuttle bus to Bicentenario Park, then take a taxi.", "Private Transfer: Can be arranged upon request."]
    },
    car: {
      title: "By Car",
      description: "Access to the Historic Center has traffic restrictions during peak hours.",
      details: ["Cadisan Parking: Mejía St (Open 24h).", "La Ronda Parking: South sector.", "We recommend using Waze or Google Maps."]
    },
    public: {
      title: "Public Transport",
      description: "The most efficient way to arrive is via the metropolitan system.",
      details: ["Quito Metro: 'San Francisco' Station (5 min walk).", "Trolleybus: 'Plaza del Teatro' Stop (4 min walk).", "Ecovía: 'Marín Central' Stop (10 min walk uphill)."]
    }
  }
};

// --- DATA: RUTAS TURÍSTICAS ---
const touristRoutes = {
  es: [
    {
      title: "Ruta de las Cúpulas",
      duration: "3 Horas",
      description: "Un recorrido por las iglesias más altas para ver la ciudad desde arriba.",
      points: ["Basílica del Voto Nacional", "Iglesia de la Compañía", "Cúpulas de la Catedral"]
    },
    {
      title: "Leyendas y Tradiciones",
      duration: "2 Horas (Noche)",
      description: "Camina por las calles iluminadas mientras conoces las leyendas quiteñas.",
      points: ["Calle de la Ronda", "Arco de la Reina", "Plaza de Santo Domingo"]
    }
  ],
  en: [
    {
      title: "The Domes Route",
      duration: "3 Hours",
      description: "A tour of the highest churches to see the city from above.",
      points: ["Basilica of the National Vow", "La Compañía Church", "Cathedral Domes"]
    },
    {
      title: "Legends & Traditions",
      duration: "2 Hours (Night)",
      description: "Walk through the illuminated streets while learning Quiteño legends.",
      points: ["La Ronda Street", "Queen's Arch", "Santo Domingo Square"]
    }
  ]
};

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
}

export default function Gallery() {
  const { lang, t } = useLanguage();
  
  // Estado para la galería
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  // Estado para las pestañas de transporte ('airport' | 'car' | 'public')
  const [transportTab, setTransportTab] = useState<'airport' | 'car' | 'public'>('airport');

  const { data: allMedia, isLoading } = useQuery({
    queryKey: ["all-storage-media"],
    queryFn: async () => {
      const { data: fileList, error } = await supabase
        .storage
        .from("rooms-images")
        .list("", { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const mediaWithUrls: MediaItem[] = fileList
        .filter(file => file.name !== ".emptyFolderPlaceholder" && !file.metadata?.mimetype?.includes('directory'))
        .map((file) => {
          const { data } = supabase.storage.from("rooms-images").getPublicUrl(file.name);
          const isVideo = file.metadata?.mimetype?.startsWith('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i);
          return {
            id: file.id,
            name: file.name,
            url: data.publicUrl,
            type: isVideo ? 'video' : 'image',
          };
        });
      return mediaWithUrls;
    },
  });

  return (
    <>
      {/* --- SECCIÓN 1: GALERÍA (EXISTENTE) --- */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("gallery.title")} subtitle={t("gallery.subtitle")} />

          {isLoading ? (
            <div className="text-center py-20 text-gray-400">
              <p>Cargando galería...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {allMedia?.map((item, i) => (
                <motion.div
                  key={item.id}
                  layoutId={`media-${item.id}`} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="overflow-hidden group rounded-lg shadow-sm cursor-pointer relative"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="h-64 overflow-hidden relative bg-gray-100">
                    {item.type === 'video' ? (
                      <>
                        <video
                          src={item.url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          muted loop playsInline autoPlay
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 group-hover:bg-black/20 transition-colors">
                          <PlayCircle className="text-white w-12 h-12 opacity-80" />
                        </div>
                      </>
                    ) : (
                      <motion.img
                        src={item.url}
                        alt="Galería" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
              {allMedia?.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-10">
                  No se encontraron archivos en el servidor.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* --- MODAL LIGHTBOX (EXISTENTE) --- */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors p-2 bg-black/20 rounded-full z-50" onClick={() => setSelectedItem(null)}>
              <X size={32} />
            </button>
            <motion.div
               layoutId={`media-${selectedItem.id}`}
               className="relative max-h-[90vh] max-w-[95vw] shadow-2xl"
               onClick={(e) => e.stopPropagation()} 
            >
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.url} className="max-h-[85vh] max-w-[95vw] rounded-md" controls autoPlay playsInline />
              ) : (
                <img src={selectedItem.url} alt="Vista ampliada" className="max-h-[90vh] max-w-[95vw] object-contain rounded-md" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NUEVA SECCIÓN: CÓMO LLEGAR --- */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <SectionTitle title={lang === 'es' ? "Ubicación y Llegada" : "Location & Arrival"} subtitle={lang === 'es' ? "¿Cómo llegar?" : "How to get here?"} />
          
          <div className="flex flex-col md:flex-row gap-8 bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            {/* Navegación de Tabs */}
            <div className="md:w-1/3 bg-slate-50 border-r border-gray-100 flex flex-row md:flex-col">
              {[
                { id: 'airport', icon: Plane, label: lang === 'es' ? 'Aeropuerto' : 'Airport' },
                { id: 'car', icon: Car, label: lang === 'es' ? 'Automóvil' : 'Car' },
                { id: 'public', icon: BusFront, label: lang === 'es' ? 'Transporte Público' : 'Public Transport' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTransportTab(tab.id as any)}
                  className={`flex-1 md:flex-none flex items-center gap-3 p-6 transition-all duration-300 text-left ${
                    transportTab === tab.id 
                      ? "bg-white text-gold font-medium shadow-[inset_4px_0_0_0_currentColor] md:shadow-[inset_4px_0_0_0_currentColor] shadow-[inset_0_-4px_0_0_currentColor] md:shadow-none" 
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Contenido de Tabs */}
            <div className="md:w-2/3 p-8 min-h-[300px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={transportTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-serif text-primary mb-4 flex items-center gap-2">
                    {arrivalInfo[lang][transportTab].title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {arrivalInfo[lang][transportTab].description}
                  </p>
                  <ul className="space-y-3">
                    {arrivalInfo[lang][transportTab].details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN MODIFICADA: MAPA Y LUGARES CERCANOS --- */}
      <section className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("location.title")} subtitle={lang === 'es' ? "En el corazón de Quito" : "In the heart of Quito"} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
            {/* Mapa */}
            <div className="rounded-lg overflow-hidden shadow-md h-[500px] bg-gray-200 relative group">
              <iframe 
                src="https://www.google.com/maps?q=Hotel+Viena+Internacional+Quito&z=17&output=embed" 
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale group-hover:grayscale-0 transition-all duration-700"
              >
              </iframe>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded text-xs font-semibold shadow-sm pointer-events-none">
                {lang === 'es' ? "Pasa el mouse para activar color" : "Hover to enable color"}
              </div>
            </div>

            {/* Lugares Cercanos (Estilo Lista Detallada) */}
            <div>
              <div className="mb-8">
                <h3 className="text-xl font-serif text-gold mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t("location.nearby")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'es' 
                    ? "Distancias calculadas caminando desde nuestro establecimiento." 
                    : "Walking distances calculated from our establishment."}
                </p>
              </div>

              <div className="grid gap-4">
                {nearbyPlaces[lang].map((place, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border hover:border-gold/50 transition-colors shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-primary">{place.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Footprints className="w-3 h-3" /> {place.time}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-bold text-gold">{place.dist}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- NUEVA SECCIÓN: ACTIVIDADES / RUTAS --- */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionTitle 
            title={lang === 'es' ? "Experiencias Locales" : "Local Experiences"} 
            subtitle={lang === 'es' ? "Rutas recomendadas para nuestros huéspedes" : "Recommended routes for our guests"} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {touristRoutes[lang].map((route, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 bg-white">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-secondary p-3 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                       <MapPin className="w-6 h-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold bg-gold/10 px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {route.duration}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-serif text-primary mb-3">{route.title}</h3>
                  <p className="text-muted-foreground mb-6">{route.description}</p>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-semibold">
                      {lang === 'es' ? "Puntos Clave:" : "Highlights:"}
                    </p>
                    <ul className="space-y-2">
                      {route.points.map((point, pIdx) => (
                        <li key={pIdx} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1 h-1 bg-gold rounded-full" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}