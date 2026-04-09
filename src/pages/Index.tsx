import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query"; // Importamos useQuery
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
// import { rooms } from "@/data/rooms"; // YA NO USAMOS ESTO PARA LAS HABITACIONES
import { services } from "@/data/services";
import { getImage } from "@/lib/images"; // Mantenemos getImage solo para los Servicios (si son estáticos)
import { supabase } from "@/lib/supabase"; // Importamos Supabase
import { Phone } from "lucide-react";
import heroHotel from "@/assets/hero-hotel.jpg";
import courtyard from "@/assets/courtyard.jpg";
import facade from "@/assets/facade.jpg";

// Definimos la interfaz localmente para evitar conflictos de importación
interface Room {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  image: string;
}

const Index = () => {
  const { lang, t } = useLanguage();

  // 1. OBTENER LAS 3 PRIMERAS HABITACIONES DE LA BD
  const { data: dbRooms } = useQuery({
    queryKey: ["featured-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .limit(3) // Solo traemos 3 para la página de inicio
        .order("id", { ascending: true }); // O order('capacity')

      if (error) throw error;
      return data as Room[];
    },
  });

  // Si no ha cargado, usamos un array vacío
  const featuredRooms = dbRooms || [];

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <img
          src={heroHotel}
          alt="Hostal Casa Colonial Viena Internacional"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="relative z-10 text-center px-4 max-w-3xl"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-gold mb-4">Viena Internacional</p>
          <h1 className="font-serif text-4xl md:text-6xl text-primary-foreground font-medium leading-tight mb-6">
            {t("hero.title")}
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <a
            href="https://wa.me/593960927451"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs tracking-[0.2em] uppercase px-8 py-4 bg-gold text-primary font-semibold hover:bg-gold-dark transition-colors"
          >
            {t("hero.cta")}
          </a>
        </motion.div>
      </section>

      {/* About */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("about.title")} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img
                src={courtyard}
                alt="Patio interior colonial"
                className="w-full h-80 object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              {/* AQUÍ AGREGUÉ 'text-justify' */}
              <p className="text-muted-foreground text-sm leading-relaxed text-justify">
                {t("about.text")}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed text-justify">
                {t("about.text2")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            {[
              { num: "50+", label: { es: "Años de tradicion", en: "Years of tradition" } },
              { num: "500+", label: { es: "Huespedes satisfechos", en: "Satisfied guests" } },
              { num: "3.3", label: { es: "Calificacion promedio", en: "Average rating" } },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <p className="font-serif text-4xl text-gold font-medium">{stat.num}</p>
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-2">
                  {lang === "es" ? stat.label.es : stat.label.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Preview (DINÁMICO DESDE SUPABASE) */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("home.rooms.title")} subtitle={t("home.rooms.subtitle")} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Si no hay habitaciones cargadas aún */}
            {featuredRooms.length === 0 && (
                <p className="text-center col-span-3 text-gray-400">Cargando habitaciones destacadas...</p>
            )}

            {featuredRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group overflow-hidden rounded-lg shadow-sm"
              >
                <div className="overflow-hidden h-52 bg-gray-100 relative">
                  {/* IMAGEN: Usamos la URL directa de la BD */}
                  <img
                    src={room.image}
                    alt={room.name?.[lang]}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                       e.currentTarget.src = "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />
                </div>
                <div className="pt-4 p-2">
                  <h3 className="font-serif text-lg text-foreground">{room.name?.[lang]}</h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed line-clamp-2">
                    {room.description?.[lang]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/habitaciones"
              className="inline-block text-xs tracking-[0.15em] uppercase px-8 py-3 border border-gold text-gold hover:bg-gold hover:text-primary transition-colors"
            >
              {t("home.rooms.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Services Preview (ESTÁTICO) */}
      <section className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("home.services.title")} subtitle={t("home.services.subtitle")} />
          <div className="max-w-5xl mx-auto space-y-0">
            {services.slice(0, 3).map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${i % 2 === 1 ? "md:direction-rtl" : ""}`}
              >
                <div className={`${i % 2 === 1 ? "md:order-2" : ""}`}>
                  {/* Aquí mantenemos getImage si tus servicios usan fotos locales */}
                  <img
                    src={getImage(service.image)}
                    alt={service.name[lang]}
                    className="w-full h-64 object-cover"
                    loading="lazy"
                  />
                </div>
                <div className={`flex flex-col justify-center p-8 md:p-10 bg-card ${i % 2 === 1 ? "md:order-1" : ""}`}>
                  <h3 className="font-serif text-xl text-foreground mb-3">{service.name[lang]}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{service.description[lang]}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/servicios"
              className="inline-block text-xs tracking-[0.15em] uppercase px-8 py-3 border border-gold text-gold hover:bg-gold hover:text-primary transition-colors"
            >
              {t("home.services.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("home.location.title")} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <iframe
                src="https://www.google.com/maps?q=Hotel+Viena+Internacional+Quito&z=17&output=embed"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicacion del Hostal"
                className="w-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <img
                src={facade}
                alt="Fachada del hostal"
                className="w-full h-48 object-cover mb-4"
                loading="lazy"
              />
              <p className="font-serif text-lg text-foreground">Hostal Casa Colonial Viena Internacional</p>
              <p className="text-sm text-muted-foreground">{t("home.location.address")}</p>
              <Link
                to="/galeria"
                className="inline-block text-xs tracking-[0.1em] uppercase text-gold border-b border-gold/30 hover:border-gold pb-0.5 transition-colors mt-2"
              >
                {lang === "es" ? "Ver galeria completa" : "View full gallery"}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-primary-foreground mb-2">{t("home.contact.title")}</h2>
            <div className="w-[60px] h-[1px] bg-gold mx-auto my-6" />
            <p className="text-primary-foreground/70 text-sm mb-10">{t("home.contact.subtitle")}</p>

            <a
              href="https://wa.me/593960927451"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-xs tracking-[0.2em] uppercase px-8 py-4 bg-gold text-primary font-semibold hover:bg-gold-dark transition-colors mb-10"
            >
              <Phone size={16} />
              +593 96 092 7451
            </a>

            <div className="flex justify-center gap-8 mt-4">
              <a
                href="https://www.facebook.com/profile.php?id=61586787122379"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-primary-foreground/60 hover:text-gold transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/hostalvienainternacional/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-primary-foreground/60 hover:text-gold transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@viena.internacion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-primary-foreground/60 hover:text-gold transition-colors"
              >
                TikTok
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Index;