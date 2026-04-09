import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SectionTitle from "@/components/SectionTitle";
import { reviews } from "@/data/reviews";
import { Star, Phone, Mail } from "lucide-react";

export default function Reviews() {
  const { lang, t } = useLanguage();

  return (
    <>
{/* Reviews */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("reviews.title")} subtitle={t("reviews.subtitle")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border p-8"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-gold text-gold" />
                  ))}
                </div>
                {/* AQUÍ AGREGUÉ 'text-justify' */}
                <p className="text-sm text-muted-foreground leading-relaxed italic mb-6 text-justify">
                  "{review.text[lang]}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.country[lang]}</p>
                  </div>
                  <span className="text-[10px] tracking-[0.1em] uppercase text-gold border border-gold/30 px-2 py-1">
                    {review.source}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <SectionTitle title={t("contact.title")} subtitle={t("contact.subtitle")} />

          <div className="max-w-xl mx-auto space-y-6 text-center">
            <a
              href="https://wa.me/593960927451"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 text-foreground hover:text-gold transition-colors"
            >
              <Phone size={18} className="text-gold" />
              <span className="text-sm">+593 96 092 7451 (WhatsApp)</span>
            </a>
            <a
              href="tel:+593969258331"
              className="flex items-center justify-center gap-3 text-foreground hover:text-gold transition-colors"
            >
              <Phone size={18} className="text-gold" />
              <span className="text-sm">+593 96 092 7451</span>
            </a>
            <a
              href="tel:+593939033260"
              className="flex items-center justify-center gap-3 text-foreground hover:text-gold transition-colors"
            >
              <Phone size={18} className="text-gold" />
              <span className="text-sm">+593 93 903 3260</span>
            </a>
            <a
              href="mailto:info@vienainternacionaluio.com"
              className="flex items-center justify-center gap-3 text-foreground hover:text-gold transition-colors"
            >
              <Mail size={18} className="text-gold" />
              <span className="text-sm">info@vienainternacionaluio.com</span>
            </a>

            <div className="pt-6 flex justify-center gap-6">
              <a
                href="https://www.facebook.com/profile.php?id=61586787122379"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-gold transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/hostalvienainternacional/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-gold transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@viena.internacion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-gold transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
