import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, Activity, Database, 
  Plus, Search, RefreshCw, Lock, Check, FileSpreadsheet,
  UserPlus, FileText, TrendingUp, AlertCircle
} from 'lucide-react';

const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyu3sSQXDciaR3xf7PxHcmEmbdic-WO_QFgLXTsVxwM208x8pMMotxT70XZ7Tj-RrPqJQ/exec";

export default function App() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('pacientes');
  const [loading, setLoading] = useState(false);

  // Estados de datos
  const [pacientes, setPacientes] = useState(() => {
    return JSON.parse(localStorage.getItem('dom_pacientes')) || [];
  });
  const [prestaciones, setPrestaciones] = useState(() => {
    return JSON.parse(localStorage.getItem('dom_prestaciones')) || [];
  });
  const [visitas, setVisitas] = useState(() => {
    return JSON.parse(localStorage.getItem('dom_visitas')) || [];
  });
  const [liquidaciones, setLiquidaciones] = useState(() => {
    return JSON.parse(localStorage.getItem('dom_liquidaciones')) || [];
  });

  // Formularios
  const [formPaciente, setFormPaciente] = useState({ dni: '', nombre: '', obraSocial: '', direccion: '', estado: 'Activo' });
  const [formPrestacion, setFormPrestacion] = useState({ pacienteDni: '', tipo: '', fechaInicio: '', valor: '' });
  const [formVisita, setFormVisita] = useState({ pacienteDni: '', profesional: '', fecha: '', estado: 'Programada' });
  const [formFinanza, setFormFinanza] = useState({ pacienteDni: '', concepto: '', monto: '', tipo: 'Ingreso' });

  const [searchTerm, setSearchTerm] = useState('');

  // Persistencia local
  useEffect(() => {
    localStorage.setItem('dom_pacientes', JSON.stringify(pacientes));
  }, [pacientes]);

  useEffect(() => {
    localStorage.setItem('dom_prestaciones', JSON.stringify(prestaciones));
  }, [prestaciones]);

  useEffect(() => {
    localStorage.setItem('dom_visitas', JSON.stringify(visitas));
  }, [visitas]);

  useEffect(() => {
    localStorage.setItem('dom_liquidaciones', JSON.stringify(liquidaciones));
  }, [liquidaciones]);

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('PIN Incorrecto');
    }
  };

  // Handlers para agregar registros
  const addPaciente = (e) => {
    e.preventDefault();
    if (!formPaciente.dni || !formPaciente.nombre) return;
    setPacientes([...pacientes, { ...formPaciente, id: Date.now() }]);
    setFormPaciente({ dni: '', nombre: '', obraSocial: '', direccion: '', estado: 'Activo' });
  };

  const addPrestacion = (e) => {
    e.preventDefault();
    if (!formPrestacion.pacienteDni) return;
    setPrestaciones([...prestaciones, { ...formPrestacion, id: Date.now() }]);
    setFormPrestacion({ pacienteDni: '', tipo: '', fechaInicio: '', valor: '' });
  };

  const addVisita = (e) => {
    e.preventDefault();
    if (!formVisita.pacienteDni) return;
    setVisitas([...visitas, { ...formVisita, id: Date.now() }]);
    setFormVisita({ pacienteDni: '', profesional: '', fecha: '', estado: 'Programada' });
  };

  const addFinanza = (e) => {
    e.preventDefault();
    if (!formFinanza.monto) return;
    setLiquidaciones([...liquidaciones, { ...formFinanza, id: Date.now() }]);
    setFormFinanza({ pacienteDni: '', concepto: '', monto: '', tipo: 'Ingreso' });
  };

  // Sincronización con Google Sheets
  const syncWithGoogle = async () => {
    setLoading(true);
    try {
      const payload = {
        pacientes,
        prestaciones,
        visitas,
        liquidaciones
      };
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('¡Sincronización enviada con éxito a Google Sheets!');
    } catch (err) {
      alert('Error de conexión con el Webhook.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <Lock size={48} color="#2563eb" />
            <h2>Gestión Internación Domiciliaria</h2>
            <p style={{ color: '#666' }}>Ingrese el PIN de acceso</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.buttonPrimary}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Navbar */}
      <header style={styles.navbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={28} color="#2563eb" />
          <h1 style={{ fontSize: '20px', margin: 0 }}>Internación Domiciliaria</h1>
        </div>
        <button onClick={syncWithGoogle} disabled={loading} style={styles.syncButton}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Sincronizando...' : 'Sincronizar Google Sheets'}
        </button>
      </header>

      {/* Menú de Navegación */}
      <nav style={styles.navMenu}>
        <button 
          style={activeTab === 'pacientes' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('pacientes')}
        >
          <Users size={18} /> Pacientes
        </button>
        <button 
          style={activeTab === 'prestaciones' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('prestaciones')}
        >
          <FileText size={18} /> Prestaciones
        </button>
        <button 
          style={activeTab === 'visitas' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('visitas')}
        >
          <Calendar size={18} /> Calendario / Visitas
        </button>
        <button 
          style={activeTab === 'finanzas' ? styles.tabActive : styles.tab} 
          onClick={() => setActiveTab('finanzas')}
        >
          <DollarSign size={18} /> Liquidación / Finanzas
        </button>
      </nav>

      {/* Contenido Principal */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'pacientes' && (
          <div>
            <h3><UserPlus size={20} /> Alta de Paciente</h3>
            <form onSubmit={addPaciente} style={styles.gridForm}>
              <input 
                placeholder="DNI" 
                value={formPaciente.dni} 
                onChange={e => setFormPaciente({...formPaciente, dni: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Nombre Completo" 
                value={formPaciente.nombre} 
                onChange={e => setFormPaciente({...formPaciente, nombre: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Obra Social / Prepaga" 
                value={formPaciente.obraSocial} 
                onChange={e => setFormPaciente({...formPaciente, obraSocial: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Dirección / Domicilio" 
                value={formPaciente.direccion} 
                onChange={e => setFormPaciente({...formPaciente, direccion: e.target.value})}
                style={styles.input}
              />
              <button type="submit" style={styles.buttonPrimary}>Agregar Paciente</button>
            </form>

            <h3 style={{ marginTop: '30px' }}>Listado de Pacientes</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>DNI</th>
                  <th>Nombre</th>
                  <th>Obra Social</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map(p => (
                  <tr key={p.id}>
                    <td>{p.dni}</td>
                    <td>{p.nombre}</td>
                    <td>{p.obraSocial}</td>
                    <td>{p.direccion}</td>
                    <td>{p.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'prestaciones' && (
          <div>
            <h3><FileText size={20} /> Registrar Prestación / Internación</h3>
            <form onSubmit={addPrestacion} style={styles.gridForm}>
              <input 
                placeholder="DNI del Paciente" 
                value={formPrestacion.pacienteDni} 
                onChange={e => setFormPrestacion({...formPrestacion, pacienteDni: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Tipo de Prestación (Kinesiología, Enfermería, etc.)" 
                value={formPrestacion.tipo} 
                onChange={e => setFormPrestacion({...formPrestacion, tipo: e.target.value})}
                style={styles.input}
              />
              <input 
                type="date" 
                value={formPrestacion.fechaInicio} 
                onChange={e => setFormPrestacion({...formPrestacion, fechaInicio: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Valor / Honorario ($)" 
                type="number" 
                value={formPrestacion.valor} 
                onChange={e => setFormPrestacion({...formPrestacion, valor: e.target.value})}
                style={styles.input}
              />
              <button type="submit" style={styles.buttonPrimary}>Guardar Prestación</button>
            </form>

            <h3 style={{ marginTop: '30px' }}>Prestaciones Registradas</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>DNI Paciente</th>
                  <th>Tipo</th>
                  <th>Fecha Inicio</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {prestaciones.map(p => (
                  <tr key={p.id}>
                    <td>{p.pacienteDni}</td>
                    <td>{p.tipo}</td>
                    <td>{p.fechaInicio}</td>
                    <td>${p.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'visitas' && (
          <div>
            <h3><Calendar size={20} /> Programar Visita Medica</h3>
            <form onSubmit={addVisita} style={styles.gridForm}>
              <input 
                placeholder="DNI del Paciente" 
                value={formVisita.pacienteDni} 
                onChange={e => setFormVisita({...formVisita, pacienteDni: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Profesional a Cargo" 
                value={formVisita.profesional} 
                onChange={e => setFormVisita({...formVisita, profesional: e.target.value})}
                style={styles.input}
              />
              <input 
                type="date" 
                value={formVisita.fecha} 
                onChange={e => setFormVisita({...formVisita, fecha: e.target.value})}
                style={styles.input}
              />
              <button type="submit" style={styles.buttonPrimary}>Agendar Visita</button>
            </form>

            <h3 style={{ marginTop: '30px' }}>Cronograma de Visitas</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>DNI Paciente</th>
                  <th>Profesional</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map(v => (
                  <tr key={v.id}>
                    <td>{v.pacienteDni}</td>
                    <td>{v.profesional}</td>
                    <td>{v.fecha}</td>
                    <td>{v.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'finanzas' && (
          <div>
            <h3><DollarSign size={20} /> Módulo de Liquidaciones y Finanzas</h3>
            <form onSubmit={addFinanza} style={styles.gridForm}>
              <input 
                placeholder="DNI del Paciente (Opcional)" 
                value={formFinanza.pacienteDni} 
                onChange={e => setFormFinanza({...formFinanza, pacienteDni: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Concepto / Detalle" 
                value={formFinanza.concepto} 
                onChange={e => setFormFinanza({...formFinanza, concepto: e.target.value})}
                style={styles.input}
              />
              <input 
                placeholder="Monto ($)" 
                type="number" 
                value={formFinanza.monto} 
                onChange={e => setFormFinanza({...formFinanza, monto: e.target.value})}
                style={styles.input}
              />
              <select 
                value={formFinanza.tipo} 
                onChange={e => setFormFinanza({...formFinanza, tipo: e.target.value})}
                style={styles.input}
              >
                <option value="Ingreso">Ingreso (Cobro Obra Social)</option>
                <option value="Egreso">Egreso (Pago Profesional / Insumo)</option>
              </select>
              <button type="submit" style={styles.buttonPrimary}>Registrar Movimiento</button>
            </form>

            <h3 style={{ marginTop: '30px' }}>Historial Financiero</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>DNI Paciente</th>
                  <th>Concepto</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map(f => (
                  <tr key={f.id}>
                    <td>{f.pacienteDni || '-'}</td>
                    <td>{f.concepto}</td>
                    <td>{f.tipo}</td>
                    <td style={{ color: f.tipo === 'Ingreso' ? 'green' : 'red', fontWeight: 'bold' }}>
                      {f.tipo === 'Ingreso' ? '+' : '-'}${f.monto}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' },
  loginCard: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '320px' },
  appContainer: { fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #e2e8f0' },
  navMenu: { display: 'flex', gap: '10px', backgroundColor: 'white', padding: '10px 20px', borderBottom: '1px solid #e2e8f0' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  tabActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#eff6ff', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#2563eb', fontWeight: 'bold' },
  gridForm: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  buttonPrimary: { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  syncButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
};
