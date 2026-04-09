import { MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/593960927451";

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:scale-105 transition-transform"
      aria-label="WhatsApp"
    >
      <MessageCircle size={28} className="text-white" />
    </a>
  );
}
