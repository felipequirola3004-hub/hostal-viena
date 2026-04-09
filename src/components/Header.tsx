import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { key: "nav.home", path: "/" },
  { key: "nav.rooms", path: "/habitaciones" },
  { key: "nav.services", path: "/servicios" },
  { key: "nav.gallery", path: "/galeria" },
  { key: "nav.reviews", path: "/opiniones" },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Hostal Casa Colonial Viena Internacional" className="h-12 w-12 rounded-full object-cover" />
          <div className="hidden sm:block">
            <p className="text-sm font-serif tracking-wider text-primary-foreground">Casa Colonial</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-gold">Viena Internacional</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-xs tracking-[0.15em] uppercase transition-colors duration-300 ${
                location.pathname === item.path
                  ? "text-gold"
                  : "text-primary-foreground/80 hover:text-gold"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gold/30 rounded-sm overflow-hidden text-xs">
            <button
              onClick={() => setLang("es")}
              className={`px-2 py-1 transition-colors ${
                lang === "es" ? "bg-gold text-primary" : "text-primary-foreground/70 hover:text-gold"
              }`}
            >
              ES
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 transition-colors ${
                lang === "en" ? "bg-gold text-primary" : "text-primary-foreground/70 hover:text-gold"
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-primary-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden bg-primary border-t border-gold/20 px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 text-sm tracking-wider uppercase border-b border-gold/10 transition-colors ${
                location.pathname === item.path
                  ? "text-gold"
                  : "text-primary-foreground/80 hover:text-gold"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
