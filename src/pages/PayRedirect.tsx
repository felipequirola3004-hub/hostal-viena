/**
 * PayRedirect.tsx
 * Página intermedia de redirección al formulario de Payphone.
 * URL: /pay/:paymentId?type=card|payphone
 *
 * Recibe el paymentId por parámetro, muestra un mensaje breve,
 * y redirige al formulario de Payphone a través del backend.
 * Esto garantiza que la redirección sale del dominio registrado,
 * evitando el error "Not authorized" de Payphone.
 */

import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "") + "/api/payphone";

export default function PayRedirect() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") ?? "card"; // 'card' | 'payphone'

  useEffect(() => {
    if (!paymentId) return;

    // Redirigir via backend — la request sale desde el dominio registrado
    window.location.href = `${API_BASE}/redirect-to-payment/${paymentId}?type=${type}`;
  }, [paymentId, type]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-gold/20 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">
          Redirigiendo al formulario de pago seguro...
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Serás redirigido automáticamente. Por favor no cierres esta ventana.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Conexión segura con cifrado SSL
      </div>
    </div>
  );
}
