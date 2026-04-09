import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase"; // Asegúrate de que esta ruta sea correcta
import { Trash2, Edit, Plus, X, Upload, LogOut, Link2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { generatePaymentLink, type GenerateLinkResult } from "@/services/payphoneService";

// --- TIPOS ---

interface Reservation {
  id: string;
  room_id?: string;
  habitacion_nombre?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in?: string;
  check_out?: string;
  num_noches?: number;
  num_huespedes?: number;
  amount?: number;
  status?: string;
  payment_method?: string;
  notas?: string;
  created_at?: string;
}

interface PaymentTransaction {
  id: string;
  client_transaction_id?: string;
  habitacion_nombre?: string;
  email?: string;
  amount?: number;
  currency?: string;
  status?: string;
  authorization_code?: string;
  card_brand?: string;
  last_digits?: string;
  reference?: string;
  created_at?: string;
}

// 1. Como viene de la Base de Datos (Anidado)
export interface Room {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  longDescription: { es: string; en: string };
  image: string;
  amenities: { es: string[]; en: string[] };
  capacity: number;
  price?: string;
}

// 2. Como se maneja en el Formulario (Plano/Flat)
interface RoomFormState {
  id?: string;
  image?: string;
  name_es: string;
  name_en: string;
  desc_es: string;
  desc_en: string;
  long_es: string;
  long_en: string;
  amenities_es: string;
  amenities_en: string;
  capacity: number;
  price: string;
}

// --- COMPONENTE DE LOGIN ---
const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === "admin" && pass === "casacolonial") {
      onLogin();
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Usuario</label>
          <input
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-semibold">
          Entrar al Panel
        </button>
      </form>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function Admin() {
  const [isAuth, setIsAuth] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Aquí usamos el tipo 'RoomFormState' o null
  const [editingRoom, setEditingRoom] = useState<RoomFormState | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // 1. LEER HABITACIONES
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("id", { ascending: true });
      if (error) throw error;
      return data as Room[];
    },
    enabled: isAuth,
  });

  const uploadImageToSupabase = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("rooms-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("rooms-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // 2. GUARDAR (CREAR / EDITAR)
  const saveMutation = useMutation({
    mutationFn: async (formData: RoomFormState) => {
      let imageUrl = formData.image;

      // Subir nueva imagen si existe
      if (fileInputRef.current?.files?.[0]) {
        imageUrl = await uploadImageToSupabase(fileInputRef.current.files[0]);
      }

      // Convertir de PLANO (Form) a ANIDADO (DB)
      const roomPayload = {
        name: { es: formData.name_es, en: formData.name_en },
        description: { es: formData.desc_es, en: formData.desc_en },
        longDescription: { es: formData.long_es, en: formData.long_en },
        amenities: {
          es: formData.amenities_es.split(",").map((s) => s.trim()).filter(Boolean),
          en: formData.amenities_en.split(",").map((s) => s.trim()).filter(Boolean),
        },
        capacity: Number(formData.capacity),
        price: formData.price,
        image: imageUrl,
      };

      if (formData.id) {
        // UPDATE
        const { error } = await supabase.from("rooms").update(roomPayload).eq("id", formData.id);
        if (error) throw error;
      } else {
        // INSERT
        const newId = formData.name_es.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString().slice(-4);
        const { error } = await supabase.from("rooms").insert([{ ...roomPayload, id: newId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsModalOpen(false);
      setEditingRoom(null);
      setIsUploading(false);
      alert("¡Guardado con éxito!");
    },
    onError: (error) => {
      console.error(error);
      setIsUploading(false);
      alert("Error: " + error.message);
    },
  });

  // 3. BORRAR
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm("¿Estás seguro de borrar esta habitación?")) return;
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  // Convertir Formulario HTML a Objeto JS
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Convertimos FormData a un objeto plano
    const rawData = Object.fromEntries(formData.entries());

    // Creamos el objeto con el tipo correcto para la mutación
    const formState: RoomFormState = {
      id: editingRoom?.id,
      image: editingRoom?.image,
      name_es: rawData.name_es as string,
      name_en: rawData.name_en as string,
      desc_es: rawData.desc_es as string,
      desc_en: rawData.desc_en as string,
      long_es: rawData.long_es as string,
      long_en: rawData.long_en as string,
      amenities_es: rawData.amenities_es as string,
      amenities_en: rawData.amenities_en as string,
      capacity: Number(rawData.capacity),
      price: rawData.price as string,
    };

    saveMutation.mutate(formState);
  };

  // Preparar datos para Editar (De Anidado a Plano)
  const handleEdit = (room: Room) => {
    setEditingRoom({
      id: room.id,
      image: room.image,
      name_es: room.name.es,
      name_en: room.name.en,
      desc_es: room.description.es,
      desc_en: room.description.en,
      long_es: room.longDescription.es,
      long_en: room.longDescription.en,
      amenities_es: room.amenities.es.join(", "),
      amenities_en: room.amenities.en.join(", "),
      capacity: room.capacity,
      price: room.price || "",
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  // ─── Queries: Reservaciones y Transacciones ──────────────────────────────────
  const { data: reservations, isLoading: loadingRes } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reservation[];
    },
    enabled: isAuth,
  });

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["payment_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentTransaction[];
    },
    enabled: isAuth,
  });

  // Dashboard summary
  const confirmedRes  = reservations?.filter((r) => r.status === "confirmed") ?? [];
  const pendingRes    = reservations?.filter((r) => r.status === "pending")   ?? [];
  const totalIncome   = confirmedRes.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const lastBooking   = reservations?.[0]?.created_at;

  // ─── Estado: Generador de links ──────────────────────────────────────────────
  const [linkAmount,    setLinkAmount]    = useState("");
  const [linkReference, setLinkReference] = useState("");
  const [linkEmail,     setLinkEmail]     = useState("");
  const [linkLoading,   setLinkLoading]   = useState(false);
  const [linkResult,    setLinkResult]    = useState<GenerateLinkResult | null>(null);
  const [linkError,     setLinkError]     = useState("");

  async function handleGenerateLink(e: React.FormEvent) {
    e.preventDefault();
    setLinkError("");
    setLinkResult(null);

    const amountUSD = parseFloat(linkAmount);
    if (isNaN(amountUSD) || amountUSD <= 0) {
      setLinkError("Ingresa un monto válido mayor a $0.");
      return;
    }

    setLinkLoading(true);
    try {
      const result = await generatePaymentLink({
        amount:     amountUSD,           // dólares — el backend convierte a centavos
        reference:  linkReference || undefined,
        guestEmail: linkEmail     || undefined,
      });
      setLinkResult(result);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Error al generar el link.");
    } finally {
      setLinkLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => alert(`${label} copiado al portapapeles.`));
  }

  if (!isAuth) return <Login onLogin={() => setIsAuth(true)} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-500">Gestiona las habitaciones</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsAuth(false)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 text-gray-600">
            <LogOut size={18} /> Salir
          </button>
          <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all">
            <Plus size={20} /> Nueva Habitación
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : rooms?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay habitaciones.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rooms?.map((room) => (
              <div key={room.id} className="p-4 flex flex-col md:flex-row items-center gap-6 hover:bg-gray-50">
                <div className="w-full md:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {room.image ? (
                    <img src={room.image} alt="Room" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-400">Sin foto</div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold text-lg text-gray-800">{room.name.es}</h3>
                  <p className="text-sm text-gray-500 line-clamp-1">{room.description.es}</p>
                </div>
                <div className="text-center shrink-0 space-y-0.5">
                  {room.price ? (
                    <div className="text-lg font-bold text-green-700">${room.price}<span className="text-xs font-normal text-gray-400">/noche</span></div>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Sin precio</div>
                  )}
                  <div className="text-xs text-gray-400">
                    {room.capacity ? `${room.capacity} persona${room.capacity !== 1 ? "s" : ""}` : "— personas"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(room)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Edit size={20} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(room.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN: GENERAR LINK DE PAGO ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mt-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Link2 size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Generar Link de Pago</h2>
        </div>

        <form onSubmit={handleGenerateLink} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Monto (USD)
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Ej: 45.00"
              value={linkAmount}
              onChange={(e) => setLinkAmount(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Referencia
            </label>
            <input
              type="text"
              placeholder="Ej: Reserva Suite Colonial"
              value={linkReference}
              onChange={(e) => setLinkReference(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              Email del cliente (opcional)
            </label>
            <input
              type="email"
              placeholder="cliente@correo.com"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={linkLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {linkLoading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
              {linkLoading ? "Generando..." : "Generar Link"}
            </button>
          </div>
        </form>

        {linkError && (
          <div className="px-6 pb-4 text-red-600 text-sm">{linkError}</div>
        )}

        {linkResult && (
          <div className="px-6 pb-6 space-y-3">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Links generados</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ Usa los botones "Pagar" para abrir el formulario. Si quieres enviar el link al cliente, usa el link de compartir.
            </p>

            {/* Botones de pago — abren via redirección desde este dominio */}
            <div className="flex gap-3">
              <a
                href={linkResult.linkTarjeta}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                💳 Pagar con tarjeta
              </a>
              <a
                href={linkResult.linkPayphone}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                📱 Pagar con app Payphone
              </a>
            </div>

            {/* Link para compartir con el cliente */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-xs font-semibold text-gray-600 w-28 shrink-0">🔗 Compartir</span>
              <span className="flex-1 text-xs text-blue-700 truncate font-mono">{linkResult.linkCompartir}</span>
              <button
                onClick={() => copyToClipboard(linkResult.linkCompartir, "Link para compartir")}
                className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                title="Copiar link"
              >
                <Copy size={14} />
              </button>
              <a
                href={linkResult.linkCompartir}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Abrir"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <p className="text-xs text-gray-400">ID: {linkResult.clientTransactionId}</p>
          </div>
        )}
      </div>

      {/* ── DASHBOARD RESUMEN ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard title="Reservas confirmadas" value={confirmedRes.length} color="green" />
        <SummaryCard title="Total ingresos" value={`$${totalIncome.toFixed(2)}`} color="blue" />
        <SummaryCard title="Reservas pendientes" value={pendingRes.length} color="yellow" />
        <SummaryCard
          title="Última reserva"
          value={lastBooking ? new Date(lastBooking).toLocaleDateString("es-EC") : "—"}
          color="gray"
        />
      </div>

      {/* ── SECCIÓN: RESERVACIONES ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mt-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Reservaciones</h2>
        </div>
        {loadingRes ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : !reservations?.length ? (
          <div className="p-8 text-center text-gray-400">No hay reservaciones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {["Habitación", "Huésped", "Check-in", "Check-out", "Noches", "Monto", "Estado", "Fecha"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.habitacion_nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.guest_email ?? r.guest_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.check_in ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.check_out ?? "—"}</td>
                    <td className="px-4 py-3 text-center">{r.num_noches ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {r.amount != null ? `$${Number(r.amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("es-EC") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECCIÓN: TRANSACCIONES DE PAGO ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto mt-10 mb-16 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Transacciones de Pago</h2>
        </div>
        {loadingTx ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : !transactions?.length ? (
          <div className="p-8 text-center text-gray-400">No hay transacciones.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  {["Referencia", "Email", "Habitación", "Monto", "Estado", "Autorización", "Tarjeta", "Fecha"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={t.reference ?? ""}>{t.reference ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.habitacion_nombre ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {t.amount != null ? `$${(t.amount / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.authorization_code ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {t.card_brand ? `${t.card_brand}${t.last_digits ? ` ···· ${t.last_digits}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString("es-EC") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{editingRoom ? "Editar" : "Crear"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre (ES)</label>
                  <input name="name_es" defaultValue={editingRoom?.name_es} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre (EN)</label>
                  <input name="name_en" defaultValue={editingRoom?.name_en} className="w-full border p-2 rounded mt-1" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Descripción Corta (ES)</label>
                   <textarea name="desc_es" defaultValue={editingRoom?.desc_es} className="w-full border p-2 rounded mt-1 h-20" required />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Descripción Corta (EN)</label>
                   <textarea name="desc_en" defaultValue={editingRoom?.desc_en} className="w-full border p-2 rounded mt-1 h-20" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Descripción Larga (ES)</label>
                   <textarea name="long_es" defaultValue={editingRoom?.long_es} className="w-full border p-2 rounded mt-1 h-24" required />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase">Descripción Larga (EN)</label>
                   <textarea name="long_en" defaultValue={editingRoom?.long_en} className="w-full border p-2 rounded mt-1 h-24" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Amenities ES (Separar por comas)</label>
                  <input name="amenities_es" defaultValue={editingRoom?.amenities_es} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Amenities EN (Separar por comas)</label>
                  <input name="amenities_en" defaultValue={editingRoom?.amenities_en} className="w-full border p-2 rounded mt-1" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Capacidad</label>
                  <input type="number" name="capacity" defaultValue={editingRoom?.capacity || 2} className="w-full border p-2 rounded mt-1" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Precio (USD/noche)</label>
                  <input
                    type="number"
                    name="price"
                    min="1"
                    step="0.01"
                    placeholder="Ej: 45"
                    defaultValue={editingRoom?.price}
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <Upload size={14}/> Foto
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" className="w-full text-sm mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isUploading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  green:  "bg-green-50  border-green-200  text-green-700",
  blue:   "bg-blue-50   border-blue-200   text-blue-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  gray:   "bg-gray-50   border-gray-200   text-gray-700",
};

function SummaryCard({
  title,
  value,
  color = "gray",
}: {
  title: string;
  value: string | number;
  color?: "green" | "blue" | "yellow" | "gray";
}) {
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800",
    approved:  "bg-green-100 text-green-800",
    pending:   "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    error:     "bg-red-100 text-red-800",
  };
  const cls = map[status ?? ""] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status ?? "—"}
    </span>
  );
}