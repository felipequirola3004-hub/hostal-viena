import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-start gap-4">
            <img src={logo} alt="Casa Colonial" className="h-16 w-16 rounded-full" />
            <p className="font-serif text-lg">Casa Colonial</p>
            <p className="text-xs tracking-[0.2em] uppercase text-gold">Viena Internacional</p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://www.facebook.com/profile.php?id=61586787122379"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                aria-label="Facebook"
              >
                Facebook
              </a>
              <a
                href="https://www.instagram.com/hostalvienainternacional/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                aria-label="Instagram"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@viena.internacion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/60 hover:text-gold transition-colors text-sm"
                aria-label="TikTok"
              >
                TikTok
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gold mb-6">{t("nav.home")}</p>
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">{t("nav.home")}</Link>
              <Link to="/habitaciones" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">{t("nav.rooms")}</Link>
              <Link to="/servicios" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">{t("nav.services")}</Link>
              <Link to="/galeria" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">{t("nav.gallery")}</Link>
              <Link to="/opiniones" className="text-sm text-primary-foreground/70 hover:text-gold transition-colors">{t("nav.reviews")}</Link>
            </nav>
          </div>

          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-gold mb-6">{t("contact.title")}</p>
            <div className="flex flex-col gap-3">
              <a href="https://wa.me/593960927451" className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                <Phone size={14} /> +593 96 092 7451
              </a>
              <a href="mailto:info@vienainternacionaluio.com" className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                <Mail size={14} /> info@vienainternacionaluio.com
              </a>
              <a
              href="tel:+593939033260"
              className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-gold transition-colors"
            >
              <Phone size={18} className="text-white" />
              <span className="text-sm">+593 93 903 3260</span>
            </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gold/20 mt-12 pt-8 text-center">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} Hostal Casa Colonial Viena Internacional. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
