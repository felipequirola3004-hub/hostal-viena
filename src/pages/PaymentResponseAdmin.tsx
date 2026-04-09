/**
 * PaymentResponseAdmin.tsx
 * Página de retorno para pagos generados desde el panel de administración.
 * Payphone redirige aquí con ?id=...&clientTransactionId=...
 * Confirma el pago y muestra el resultado. No crea reservación.
 */

import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { confirmPaymentAdmin, type ConfirmPaymentResult } from "@/services/payphoneService";

type PageState = "loading" | "approved" | "cancelled" | "error";

export default function PaymentResponseAdmin() {
  const [searchParams] = useSearchParams();
  const [state,    setState]    = useState<PageState>("loading");
  const [result,   setResult]   = useState<ConfirmPaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const confirmedRef = useRef(false);

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    const id         = searchParams.get("id") ?? "";
    const clientTxId = searchParams.get("clientTransactionId") ?? "";

    if (!id || !clientTxId) {
      setErrorMsg("No se encontraron los parámetros de pago en la URL.");
      setState("error");
      return;
    }

    (async () => {
      try {
        const data = await confirmPaymentAdmin(id, clientTxId);
        setResult(data);
        setState(data.statusCode === 3 ? "approved" : "cancelled");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error al procesar el pago.");
        setState("error");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">

        {/* LOADING */}
        {state === "loading" && (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h1 className="text-xl font-bold text-gray-800">Confirmando pago...</h1>
            <p className="text-gray-500 text-sm">Por favor no cierres esta ventana.</p>
          </div>
        )}

        {/* APROBADO */}
        {state === "approved" && result && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-gray-800">¡Pago aprobado!</h1>
              <p className="text-gray-500 text-sm mt-1">La transacción fue procesada correctamente.</p>
            </div>

            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              <Row label="Monto pagado"         value={`$${(result.amount / 100).toFixed(2)} ${result.currency}`} highlight />
              {result.authorizationCode && (
                <Row label="Código de autorización" value={result.authorizationCode} highlight />
              )}
              {result.cardBrand && (
                <Row label="Tarjeta" value={`${result.cardBrand}${result.lastDigits ? ` ···· ${result.lastDigits}` : ""}`} />
              )}
              {result.reference && (
                <Row label="Referencia" value={result.reference} />
              )}
              {result.email && (
                <Row label="Email del cliente" value={result.email} />
              )}
              <Row label="ID Transacción" value={String(result.transactionId ?? "N/D")} />
            </div>

            <Link
              to="/admin"
              className="block w-full text-center py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al panel admin
            </Link>
          </div>
        )}

        {/* CANCELADO */}
        {state === "cancelled" && (
          <div className="text-center space-y-6">
            <XCircle className="w-14 h-14 text-yellow-500 mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Pago cancelado</h1>
              <p className="text-gray-500 text-sm mt-1">
                La transacción fue cancelada o rechazada. No se realizó ningún cobro.
              </p>
            </div>
            <Link
              to="/admin"
              className="block w-full text-center py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Volver al panel admin
            </Link>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div className="text-center space-y-6">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Error al procesar el pago</h1>
              {errorMsg && (
                <p className="mt-2 text-xs text-red-500 font-mono bg-red-50 rounded p-2 text-left">
                  {errorMsg}
                </p>
              )}
            </div>
            <Link
              to="/admin"
              className="block w-full text-center py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Volver al panel admin
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-green-700" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}
