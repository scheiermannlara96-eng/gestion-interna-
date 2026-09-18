import React, { useState, useEffect, useMemo } from "react";
import {
Plus, X, Search, Trash2, Pencil, Download, ChevronLeft, ChevronRight,
CalendarDays, Table2, Users, AlertTriangle, ChevronDown, ChevronUp,
Settings, UploadCloud, Heart, HeartCrack, Archive, UserPlus, Lock, LogOut,
DollarSign, FileText, CheckCircle2, AlertCircle
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
const SHEETS_URL_KEY = "gid-sheets-webhook-url";

// URL por defecto provista para Google Apps Script
const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyu3sSQXDciaR3xf7PxHcmEmbdic-WO_QFgLXTsVxwM208x8pMMotxT70XZ7Tj-RrPqJQ/exec";

// ============================================================
// UTILIDADES
// ============================================================
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

function internacionAbierta(pac) { return ((pac && pac.internaciones) || 

).find((h) => !h.hasta) || null; }

function Panel({ children, style }) {
return <div style={{ background: C.panel, border: "1px solid " + C.line, borderRadius: "0 8px 8px 8px", padding: 24, ...style }}>{children};
}

const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid " + C.line, borderRadius: 6, fontSize: 13.5, background: "#fff", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: C.mute, marginBottom: 4 };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.verde, color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13.5, cursor: "pointer" };
const ghostBtn = { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: "#fff", color: C.ink, border: "1px solid " + C.line, borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" };

// ============================================================
// ACCESO RESTRINGIDO (LOGIN POR PIN)
// ============================================================
function AuthGate({ children }) {
const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("gid_auth") === "true");
const [pin, setPin] = useState("");
const [error, setError] = useState(false);

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

);
}

return (

{children}

);
}

// ============================================================
// BOTÓN / MODAL DE SINCRONIZACIÓN CON GOOGLE SHEETS
// ============================================================
function ExportBar({ getRows, filenameBase }) {
const [status, setStatus] = useState(null);
const [showModal, setShowModal] = useState(false);
const [webhookUrl, setWebhookUrl] = useState(() => {
return localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_WEBHOOK_URL;
});

const handleSaveConfig = () => {
localStorage.setItem(SHEETS_URL_KEY, webhookUrl.trim());
setShowModal(false);
};

async function exportarSheets() {
const activeUrl = (localStorage.getItem(SHEETS_URL_KEY) || webhookUrl || "").trim();
if (!activeUrl) {
setShowModal(true);
return;
}
setStatus("sending");
try {
const payload = getRows();
await fetch(activeUrl, {
method: "POST",
mode: "no-cors",
headers: { "Content-Type": "text/plain" },
body: JSON.stringify({ hoja: filenameBase, filas: payload.rows })
});
setStatus("ok");
setTimeout(() => setStatus(null), 4000);
} catch (e) {
setStatus("error");
setTimeout(() => setStatus(null), 4000);
}
}

return (

  <button onClick={() => setShowModal(true)} style={{ ...ghostBtn, padding: "8px 10px" }} title="Configurar Webhook">
    <Settings size={15} />
  </button>

  {status === "sending" && <span style={{ fontSize: 12, color: C.mute }}>Sincronizando...</span>}
  {status === "ok" && <span style={{ fontSize: 12, color: C.verde, fontWeight: 600 }}>Sincronizado ✓</span>}
  {status === "error" && <span style={{ fontSize: 12, color: C.rojo, fontWeight: 600 }}>Error de conexión</span>}

  {showModal && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, width: 480, maxWidth: "90%", border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: 16 }}>Configuración Google Sheets Webhook</h3>
          <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.mute, marginBottom: 12 }}>
          Dirección del Apps Script Webhook:
        </p>
        <input
          type="text"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/.../exec"
          style={{ ...inputStyle, marginBottom: 18, fontFamily: FONT_MONO, fontSize: 12 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={() => setShowModal(false)} style={ghostBtn}>Cancelar</button>
          <button onClick={handleSaveConfig} style={primaryBtn}>Guardar URL</button>
        </div>
      </div>
    </div>
  )}
</div>



);
}

// ============================================================
// PESTAÑA 1: BASE DE DATOS Y NUEVO PACIENTE
// ============================================================
function BaseDatos({ pacientes, setPacientes, prestaciones }) {
const 

$$query, setQuery$$

 = useState("");
const 

$$expandido, setExpandido$$

 = useState(null);
const 

$$showModalNuevo, setShowModalNuevo$$

 = useState(false);

// Formulario nuevo paciente
const 

$$nombre, setNombre$$

 = useState("");
const 

$$dni, setDni$$

 = useState("");
const 

$$numeroAfiliado, setNumeroAfiliado$$

 = useState("");
const 

$$obraSocial, setObraSocial$$

 = useState("");
const 

$$direccion, setDireccion$$

 = useState("");

const handleCrearPaciente = (e) => {
e.preventDefault();
if (!nombre.trim() || !dni.trim()) {
alert("Nombre y DNI son obligatorios");
return;
}
const nuevo = {
id: uid(),
nombre: nombre.trim(),
dni: dni.trim(),
numeroAfiliado: numeroAfiliado.trim(),
obraSocial: obraSocial.trim(),
direccion: direccion.trim(),
internaciones: 

$${ desde: todayISO(), hasta: null }$$

,
bajas: 


};
setPacientes(

$$nuevo, ...pacientes$$

);
setNombre(""); setDni(""); setNumeroAfiliado(""); setObraSocial(""); setDireccion("");
setShowModalNuevo(false);
};

const prestacionesDe = (pacienteId) => prestaciones.filter((p) => p.pacienteId === pacienteId);

const filtrados = useMemo(() => {
const q = query.trim().toLowerCase();
return pacientes.filter((pac) => {
if (!q) return true;
const texto = 

$$pac.nombre, pac.dni, pac.numeroAfiliado, pac.obraSocial$$

.join(" ");
return texto.toLowerCase().includes(q);
});
}, 

$$pacientes, query$$

);

function exportRows() {
const rows = 

$$\["Nombre Paciente", "DNI", "N° Afiliado", "Obra Social", "Dirección", "Estado"$$

];
pacientes.forEach((pac) => {
rows.push(

$$pac.nombre, pac.dni, pac.numeroAfiliado, pac.obraSocial, pac.direccion, internacionAbierta(pac) ? "Internado" : "Alta / Inactivo"$$

);
});
return { rows };
}

return (

<button onClick={() => setShowModalNuevo(true)} style={primaryBtn}>
Nuevo Paciente

  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    {filtrados.length === 0 ? (
      <div style={{ padding: 30, textAlign: "center", color: C.mute, fontSize: 13, background: C.soft, borderRadius: 6 }}>
        No hay pacientes registrados que coincidan con la búsqueda.
      </div>
    ) : (
      filtrados.map((pac) => {
        const internado = internacionAbierta(pac);
        return (
          <div key={pac.id} style={{ border: "1px solid " + C.line, borderRadius: 8, padding: 14, background: C.soft }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{pac.nombre}</strong>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: internado ? C.verdeSoft : C.rojoSoft, color: internado ? C.verde : C.rojo, fontWeight: 600 }}>
                    {internado ? "Internado" : "Alta"}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.mute, marginTop: 4 }}>
                  DNI: <strong>{pac.dni}</strong> | Afiliado: <strong>{pac.numeroAfiliado || "—"}</strong> | OS: <strong>{pac.obraSocial || "—"}</strong>
                </div>
              </div>
              <button onClick={() => setExpandido(expandido === pac.id ? null : pac.id)} style={ghostBtn}>
                {expandido === pac.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Detalle
              </button>
            </div>

            {expandido === pac.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, background: "#fff", padding: 14, borderRadius: 6, fontSize: 13 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  <div><strong>Dirección:</strong> {pac.direccion || "No especificada"}</div>
                  <div><strong>Prestaciones Asignadas:</strong> {prestacionesDe(pac.id).length}</div>
                </div>
              </div>
            )}
          </div>
        );
      })
    )}
  </div>

  {/* MODAL NUEVO PACIENTE */}
  {showModalNuevo && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleCrearPaciente} style={{ background: "#fff", borderRadius: 8, padding: 24, width: 450, maxWidth: "90%", border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: FONT_HEAD, fontSize: 16 }}>Registrar Nuevo Paciente</h3>
          <button type="button" onClick={() => setShowModalNuevo(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombre Completo *</label>
            <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Juan Pérez" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>DNI *</label>
              <input required value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej. 30123456" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>N° Afiliado</label>
              <input value={numeroAfiliado} onChange={(e) => setNumeroAfiliado(e.target.value)} placeholder="Ej. 12-345678" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Obra Social</label>
              <input value={obraSocial} onChange={(e) => setObraSocial(e.target.value)} placeholder="Ej. OSDE" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Calle 123" style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button type="button" onClick={() => setShowModalNuevo(false)} style={ghostBtn}>Cancelar</button>
          <button type="submit" style={primaryBtn}>Guardar Paciente</button>
        </div>
      </form>
    </div>
  )}
</Panel>



);
}

// ============================================================
// PESTAÑA 2: PRESTACIONES E INTERNACIONES
// ============================================================
function PrestacionesManager({ pacientes, prestaciones, setPrestaciones }) {
const 

$$pacienteId, setPacienteId$$

 = useState("");
const 

$$tipo, setTipo$$

 = useState("");
const 

$$frecuencia, setFrecuencia$$

 = useState("");
const 

$$monto, setMonto$$

 = useState("");

const handleAltaPrestacion = (e) => {
e.preventDefault();
if (!pacienteId || !tipo.trim()) {
alert("Selecciona un paciente e indica el tipo de prestación");
return;
}
const nueva = {
id: uid(),
pacienteId,
tipo: tipo.trim(),
frecuencia: frecuencia.trim() || "Diaria",
monto: parseFloat(monto) || 0,
fechaAlta: todayISO()
};
setPrestaciones(

$$nueva, ...prestaciones$$

);
setTipo(""); setFrecuencia(""); setMonto("");
};

const borrarPrestacion = (id) => {
setPrestaciones(prestaciones.filter(p => p.id !== id));
};

function exportRows() {
const rows = 

$$\["Paciente", "Prestación", "Frecuencia", "Monto", "Fecha Alta"$$

];
prestaciones.forEach((pr) => {
const pac = pacientes.find(p => p.id === pr.pacienteId);
rows.push(

$$pac ? pac.nombre : "Desconocido", pr.tipo, pr.frecuencia, pr.monto, pr.fechaAlta$$

);
});
return { rows };
}

return (

  <form onSubmit={handleAltaPrestacion} style={{ background: C.soft, padding: 16, borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      <div>
        <label style={labelStyle}>Paciente *</label>
        <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} style={inputStyle} required>
          <option value="">-- Seleccionar --</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.dni})</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Prestación / Servicio *</label>
        <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ej. Enfermería, Kinesiología" style={inputStyle} required />
      </div>
      <div>
        <label style={labelStyle}>Frecuencia</label>
        <input value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} placeholder="Ej. 2 hs diarias" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Honorario / Monto ($)</label>
        <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" style={inputStyle} />
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
      <button type="submit" style={primaryBtn}><Plus size={15} /> Asignar Prestación</button>
    </div>
  </form>

  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {prestaciones.length === 0 ? (
      <div style={{ padding: 20, textAlign: "center", color: C.mute, fontSize: 13 }}>No hay prestaciones asignadas.</div>
    ) : (
      prestaciones.map((pr) => {
        const pac = pacientes.find(p => p.id === pr.pacienteId);
        return (
          <div key={pr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.line}`, padding: 12, borderRadius: 6, background: "#fff" }}>
            <div>
              <strong>{pr.tipo}</strong> — <span style={{ color: C.mute }}>{pac ? pac.nombre : "Sin paciente"}</span>
              <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>Frecuencia: {pr.frecuencia} | Monto: ${pr.monto}</div>
            </div>
            <button onClick={() => borrarPrestacion(pr.id)} style={{ background: "none", border: "none", color: C.rojo, cursor: "pointer", padding: 6 }}>
              <Trash2 size={16} />
            </button>
          </div>
        );
      })
    )}
  </div>
</Panel>



);
}

// ============================================================
// PESTAÑA 3: CALENDARIO Y REGISTRO DE VISITAS
// ============================================================
function CalendarioVisitas({ pacientes, prestaciones, visitas, setVisitas }) {
const 

$$pacienteId, setPacienteId$$

 = useState("");
const 

$$fecha, setFecha$$

 = useState(todayISO());
const 

$$profesional, setProfesional$$

 = useState("");
const 

$$observaciones, setObservaciones$$

 = useState("");

const handleRegVisita = (e) => {
e.preventDefault();
if (!pacienteId || !fecha) {
alert("Selecciona un paciente y una fecha");
return;
}
const nueva = {
id: uid(),
pacienteId,
fecha,
profesional: profesional.trim() || "No especificado",
observaciones: observaciones.trim()
};
setVisitas(

$$nueva, ...visitas$$

);
setProfesional(""); setObservaciones("");
};

function exportRows() {
const rows = 

$$\["Fecha", "Paciente", "Profesional / Médico", "Observaciones"$$

];
visitas.forEach((v) => {
const pac = pacientes.find(p => p.id === v.pacienteId);
rows.push(

$$v.fecha, pac ? pac.nombre : "Desconocido", v.profesional, v.observaciones$$

);
});
return { rows };
}

return (

  <form onSubmit={handleRegVisita} style={{ background: C.soft, padding: 16, borderRadius: 8, border: `1px solid ${C.line}`, marginBottom: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      <div>
        <label style={labelStyle}>Paciente *</label>
        <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} style={inputStyle} required>
          <option value="">-- Seleccionar --</option>
          {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Fecha de Visita *</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} required />
      </div>
      <div>
        <label style={labelStyle}>Profesional a cargo</label>
        <input value={profesional} onChange={(e) => setProfesional(e.target.value)} placeholder="Ej. Dr. Gómez" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Observaciones / Notas</label>
        <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej. Control de signos vitales ok" style={inputStyle} />
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
      <button type="submit" style={primaryBtn}><CalendarDays size={15} /> Agendar Visita</button>
    </div>
  </form>

  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {visitas.length === 0 ? (
      <div style={{ padding: 20, textAlign: "center", color: C.mute, fontSize: 13 }}>No hay visitas registradas.</div>
    ) : (
      visitas.map((v) => {
        const pac = pacientes.find(p => p.id === v.pacienteId);
        return (
          <div key={v.id} style={{ border: `1px solid ${C.line}`, padding: 12, borderRadius: 6, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong style={{ color: C.verde }}>{v.fecha}</strong> — <strong>{pac ? pac.nombre : "Paciente"}</strong>
              <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>Atendido por: {v.profesional} {v.observaciones && `| Nota: ${v.observaciones}`}</div>
            </div>
          </div>
        );
      })
    )}
  </div>
</Panel>



);
}

// ============================================================
// PESTAÑA 4: FINANZAS Y LIQUIDACIÓN
// ============================================================
function Finanzas({ pacientes, prestaciones }) {
const totalMonto = useMemo(() => {
return prestaciones.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
}, 

$$prestaciones$$

);

function exportRows() {
const rows = 

$$\["Paciente", "Obra Social", "Total Prestaciones (\$)"$$

];
pacientes.forEach((pac) => {
const presPac = prestaciones.filter(p => p.pacienteId === pac.id);
const subtotal = presPac.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
rows.push(

$$pac.nombre, pac.obraSocial || "—", subtotal$$

);
});
return { rows };
}

return (

  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
    <div style={{ background: C.verdeSoft, padding: 18, borderRadius: 8, border: `1px solid ${C.verde}` }}>
      <div style={{ fontSize: 12, color: C.verde, fontWeight: 600 }}>MONTO TOTAL ASIGNADO</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.verde, marginTop: 4 }}>${totalMonto.toLocaleString()}</div>
    </div>
    <div style={{ background: C.soft, padding: 18, borderRadius: 8, border: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>TOTAL PRESTACIONES VIGENTES</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 4 }}>{prestaciones.length}</div>
    </div>
  </div>

  <h4 style={{ fontFamily: FONT_HEAD, fontSize: 15, marginBottom: 12 }}>Desglose por Paciente</h4>
  <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
      <thead>
        <tr style={{ background: C.soft, borderBottom: `1px solid ${C.line}` }}>
          <th style={{ padding: 10 }}>Paciente</th>
          <th style={{ padding: 10 }}>Obra Social</th>
          <th style={{ padding: 10, textAlign: "right" }}>Subtotal ($)</th>
        </tr>
      </thead>
      <tbody>
        {pacientes.map((pac) => {
          const presPac = prestaciones.filter(p => p.pacienteId === pac.id);
          const subtotal = presPac.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
          return (
            <tr key={pac.id} style={{ borderBottom: `1px solid ${C.softLine}` }}>
              <td style={{ padding: 10, fontWeight: 600 }}>{pac.nombre}</td>
              <td style={{ padding: 10, color: C.mute }}>{pac.obraSocial || "—"}</td>
              <td style={{ padding: 10, textAlign: "right", fontWeight: 700, color: C.verde }}>${subtotal.toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</Panel>



);
}

// ============================================================
// COMPONENTE PRINCIPAL CON NAVEGACIÓN
// ============================================================
export default function App() {
const [tab, setTab] = useState("pacientes");
const [pacientes, setPacientes] = useState(

);
const [prestaciones, setPrestaciones] = useState(

);
const [visitas, setVisitas] = useState(

);

useEffect(() => {
const raw = localStorage.getItem(STORAGE_KEY);
if (raw) {
try {
const parsed = JSON.parse(raw);
setPacientes(parsed.pacientes || 

);
setPrestaciones(parsed.prestaciones || 

);
setVisitas(parsed.visitas || 

);
} catch (e) {}
}
}, 

);

useEffect(() => {
localStorage.setItem(STORAGE_KEY, JSON.stringify({ pacientes, prestaciones, visitas }));
}, [pacientes, prestaciones, visitas]);

return (

        {/* PESTAÑAS DE NAVEGACIÓN COMPLETAS */}
        <div style={{ display: "flex", gap: 6, marginTop: 18, overflowX: "auto" }}>
          <button
            onClick={() => setTab("pacientes")}
            style={{
              padding: "9px 16px",
              background: tab === "pacientes" ? C.panel : "transparent",
              border: "1px solid " + (tab === "pacientes" ? C.line : "transparent"),
              borderBottom: "none",
              borderRadius: "6px 6px 0 0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Users size={15} /> Pacientes
          </button>

          <button
            onClick={() => setTab("prestaciones")}
            style={{
              padding: "9px 16px",
              background: tab === "prestaciones" ? C.panel : "transparent",
              border: "1px solid " + (tab === "prestaciones" ? C.line : "transparent"),
              borderBottom: "none",
              borderRadius: "6px 6px 0 0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Table2 size={15} /> Prestaciones
          </button>

          <button
            onClick={() => setTab("visitas")}
            style={{
              padding: "9px 16px",
              background: tab === "visitas" ? C.panel : "transparent",
              border: "1px solid " + (tab === "visitas" ? C.line : "transparent"),
              borderBottom: "none",
              borderRadius: "6px 6px 0 0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <CalendarDays size={15} /> Visitas / Agenda
          </button>

          <button
            onClick={() => setTab("finanzas")}
            style={{
              padding: "9px 16px",
              background: tab === "finanzas" ? C.panel : "transparent",
              border: "1px solid " + (tab === "finanzas" ? C.line : "transparent"),
              borderBottom: "none",
              borderRadius: "6px 6px 0 0",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <DollarSign size={15} /> Finanzas
          </button>
        </div>
      </div>
    </header>

    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px" }}>
      {tab === "pacientes" && <BaseDatos pacientes={pacientes} setPacientes={setPacientes} prestaciones={prestaciones} />}
      {tab === "prestaciones" && <PrestacionesManager pacientes={pacientes} prestaciones={prestaciones} setPrestaciones={setPrestaciones} />}
      {tab === "visitas" && <CalendarioVisitas pacientes={pacientes} prestaciones={prestaciones} visitas={visitas} setVisitas={setVisitas} />}
      {tab === "finanzas" && <Finanzas pacientes={pacientes} prestaciones={prestaciones} />}
    </main>
  </div>
</AuthGate>



);
}
