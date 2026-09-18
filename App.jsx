import React, { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Search, Trash2, Pencil, Download, ChevronLeft, ChevronRight,
  CalendarDays, Table2, Users, AlertTriangle, ChevronDown, ChevronUp,
  Settings, UploadCloud, Heart, HeartCrack, Archive, UserPlus, Lock, LogOut
} from "lucide-react";

// Estilos de Fuente y Paleta Institucional
const FONT_HEAD = "'Roboto Slab', serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const C = {
  bg: "#EDEAE2", panel: "#FFFFFF", line: "#D9D3C3", soft: "#F7F5F0", softLine: "#EDEAE2",
  ink: "#2A2823", mute: "#6B675C",
  verde: "#3D6B5C", verdeSoft: "#E4ECE8",
  ambar: "#B98A2E", ambarSoft: "#F5EAD2",
  rojo: "#A8452F", rojoSoft: "#F3E1DB",
};

const STORAGE_KEY = "gid-relacional-data";

// ============================================================
// CONFIGURACIÓN DE TU GOOGLE SHEETS
// ============================================================
// Pega aquí la URL que obtuviste en Google Apps Script:
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec";

// ============================================================
// UTILIDADES
// ============================================================
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

function internacionAbierta(pac) { return ((pac && pac.internaciones) || []).find((h) => !h.hasta) || null; }
function bajaVigente(p) { return ((p && p.bajas) || []).find((b) => !b.reactivadaEl) || null; }
function estadoPrestacion(prestacion, paciente) {
  if (bajaVigente(prestacion)) return "baja";
  if (internacionAbierta(paciente)) return "internado";
  return "activo";
}

const EMPTY_PACIENTE = { id: null, nombre: "", dni: "", numeroAfiliado: "", obraSocial: "", direccion: "", telefono: "", internaciones: [], notas: "" };
const EMPTY_PRESTACION = { id: null, pacienteId: null, profesional: "", especialidad: "", efectorHistorial: [], empresa: "", ugl: "", unidad_tipo: "semana", unidad_horas: "", unidad_veces: "", tope_manual: "", frecuencia_texto: "", duracion_horas: "1", pago_prestacion: "", pago_efector: "", fecha_inicio: "", fecha_vencimiento: "", bajas: [], notas: "" };

function Panel({ children, style }) {
  return <div style={{ background: C.panel, border: "1px solid " + C.line, borderRadius: "0 8px 8px 8px", padding: 24, ...style }}>{children}</div>;
}
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13.5, background: "#fff" };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.verde, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13.5, cursor: "pointer" };
const ghostBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#fff", color: C.ink, border: "1px solid " + C.line, borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" };

// ============================================================
// ACCESO RESTRINGIDO (LOGIN POR PIN)
// ============================================================
function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("gid_auth") === "true");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  // Define aquí la clave para acceder
  const PIN_CORRECTO = "1234";

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === PIN_CORRECTO) {
      localStorage.setItem("gid_auth", "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gid_auth");
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div style={{ display: "flex", height: "100vh", background: C.bg, alignItems: "center", justifyContent: "center", fontFamily: FONT_BODY }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 32, borderRadius: 10, border: `1px solid ${C.line}`, width: 340, textAlign: "center" }}>
          <Lock size={32} color={C.verde} style={{ marginBottom: 12 }} />
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 20, margin: "0 0 8px" }}>Acceso Restringido</h2>
          <p style={{ fontSize: 12.5, color: C.mute, marginBottom: 18 }}>Gestión Interna Internación Domiciliaria</p>
          {error && <div style={{ color: C.rojo, fontSize: 12, marginBottom: 10 }}>Clave de acceso incorrecta</div>}
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Ingrese clave de acceso" style={{ ...inputStyle, marginBottom: 14, textAlign: "center" }} autoFocus />
          <button type="submit" style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "absolute", top: 12, right: 20, zIndex: 100 }}>
        <button onClick={handleLogout} style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12 }}><LogOut size={13} /> Salir</button>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// EXPORTACIÓN A GOOGLE SHEETS
// ============================================================
function ExportBar({ getRows, filenameBase }) {
  const [status, setStatus] = useState(null);

  async function exportarSheets() {
    if (!GOOGLE_SHEETS_WEBHOOK_URL || GOOGLE_SHEETS_WEBHOOK_URL.includes("TU_SCRIPT_ID")) {
      alert("Por favor, reemplaza la variable GOOGLE_SHEETS_WEBHOOK_URL en el código con tu URL de Apps Script.");
      return;
    }
    setStatus("sending");
    try {
      await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ hoja: filenameBase, filas: getRows().rows })
      });
      setStatus("ok");
    } catch (e) {
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={exportarSheets} style={{ ...primaryBtn, padding: "9px 14px", fontSize: 13 }}><UploadCloud size={14} /> Enviar a Google Sheets</button>
      {status === "sending" && <span style={{ fontSize: 12, color: C.mute }}>Enviando...</span>}
      {status === "ok" && <span style={{ fontSize: 12, color: C.verde }}>Enviado ✓</span>}
      {status === "error" && <span style={{ fontSize: 12, color: C.rojo }}>Error al enviar</span>}
    </div>
  );
}

// ============================================================
// BASE DE DATOS Y RENDER
// ============================================================
function BaseDatos({ pacientes, setPacientes, prestaciones, setPrestaciones }) {
  const [query, setQuery] = useState("");
  const [expandido, setExpandido] = useState(null);

  const prestacionesDe = (pacienteId) => prestaciones.filter((p) => p.pacienteId === pacienteId);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pacientes.filter((pac) => {
      if (!q) return true;
      const texto = [pac.nombre, pac.dni, pac.numeroAfiliado, pac.obraSocial].join(" ");
      return texto.toLowerCase().includes(q);
    });
  }, [pacientes, query]);

  function exportRows() {
    const rows = [["Paciente", "DNI", "N° Afiliado", "Obra Social", "Estado"]];
    pacientes.forEach((pac) => {
      rows.push([pac.nombre, pac.dni, pac.numeroAfiliado, pac.obraSocial, internacionAbierta(pac) ? "Internado" : "Activo"]);
    });
    return { rows };
  }

  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 300 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: C.mute }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paciente, DNI..." style={{ ...inputStyle, padding: "8px 10px 8px 32px" }} />
        </div>
        <ExportBar getRows={exportRows} filenameBase="Pacientes_Prestaciones" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtrados.map((pac) => (
          <div key={pac.id} style={{ border: "1px solid " + C.line, borderRadius: 8, padding: 14, background: C.soft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 16 }}>{pac.nombre}</strong>
                <div style={{ fontSize: 12, color: C.mute }}>DNI: {pac.dni} | Afiliado: {pac.numeroAfiliado}</div>
              </div>
              <button onClick={() => setExpandido(expandido === pac.id ? null : pac.id)} style={ghostBtn}>
                {expandido === pac.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Detalle
              </button>
            </div>
            {expandido === pac.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, background: "#fff", padding: 12, borderRadius: 6 }}>
                <div><strong>Obra Social:</strong> {pac.obraSocial || "—"}</div>
                <div><strong>Dirección:</strong> {pac.direccion || "—"}</div>
                <div><strong>Prestaciones Registradas:</strong> {prestacionesDe(pac.id).length}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function App() {
  const [pacientes, setPacientes] = useState([]);
  const [prestaciones, setPrestaciones] = useState([]);
  const [visitas, setVisitas] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPacientes(parsed.pacientes || []);
        setPrestaciones(parsed.prestaciones || []);
        setVisitas(parsed.visitas || []);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pacientes, prestaciones, visitas }));
  }, [pacientes, prestaciones, visitas]);

  return (
    <AuthGate>
      <div style={{ fontFamily: FONT_BODY, background: C.bg, minHeight: "100vh", color: C.ink }}>
        <header style={{ borderBottom: "1px solid " + C.line, background: C.bg, position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "26px 20px 0" }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: C.mute }}>Sistema Interno</div>
            <h1 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 23, margin: 0 }}>Gestión Interna Internación Domiciliaria</h1>
            <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
              <button style={{ padding: "10px 18px", background: C.panel, border: "1px solid " + C.line, borderBottom: "none", borderRadius: "8px 8px 0 0", fontWeight: 600 }}>
                <Table2 size={14} /> Pacientes y Prestaciones
              </button>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px" }}>
          <BaseDatos pacientes={pacientes} setPacientes={setPacientes} prestaciones={prestaciones} setPrestaciones={setPrestaciones} />
        </main>
      </div>
    </AuthGate>
  );
}
