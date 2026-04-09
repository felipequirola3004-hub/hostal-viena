import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Service } from "@/data/services";
import { getImage } from "@/lib/images";

interface ServiceModalProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
}

export default function ServiceModal({ service, open, onClose }: ServiceModalProps) {
  const { lang } = useLanguage();
  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-background border-border p-0 overflow-hidden">
        <img
          src={getImage(service.image)}
          alt={service.name[lang]}
          className="w-full h-56 object-cover"
        />
        <div className="p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-foreground">{service.name[lang]}</DialogTitle>
          </DialogHeader>
          <div className="divider-gold !mx-0" />
          <p className="text-muted-foreground text-sm leading-relaxed mt-4">{service.longDescription[lang]}</p>
          {service.schedule && (
            <div className="mt-6 flex items-center gap-2">
              <span className="text-xs tracking-[0.15em] uppercase text-gold">
                {lang === "es" ? "Horario" : "Schedule"}:
              </span>
              <span className="text-sm text-foreground">{service.schedule[lang]}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
