import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Activity, Calendar, Zap, TrendingUp, TrendingDown, Radio, Menu, X, BarChart2, Database } from 'lucide-react';
import { format, addDays } from 'date-fns';
import Hero3D from './Hero3D';
import OIDashboard from './oi'; 
import OIChangeDashboard from './oichange';
import './App.css';

// ── PROTECTED VALUE HOOK ──
function useProtectedValue(value) {
  const ref = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = valueRef.current;

    const observer = new MutationObserver(() => {
      if (el.textContent !== String(valueRef.current)) {
        el.textContent = valueRef.current;
      }
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });

    const interval = setInterval(() => {
      if (el && el.textContent !== String(valueRef.current)) {
        el.textContent = valueRef.current;
      }
    }, 300);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [value]);
  return ref;
}

function ProtectedValue({ value, className, style }) {
  const ref = useProtectedValue(String(value));
  return <span ref={ref} className={className} style={style} />;
}

const StatPill = ({ label, value, accent }) => (
  <div className="stat-pill">
    <span className="stat-label">{label}</span>
    <ProtectedValue value={value} className="stat-value" style={accent ? { color: accent } : {}} />
  </div>
);

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('home'); 

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/predict`);
      if (res.data && res.data.status === "success") {
        setData(res.data);
        setError(null);
      } else {
        setError("Backend Error: " + (res.data?.message || "Unknown Error"));
      }
    } catch (err) {
      setError("System Offline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 1. Loading Screen
  if (loading) return (
    <div className="loader-screen">
      <div className="loader-ring" />
      <Zap size={32} className="loader-icon" />
      <p className="loader-text">Initializing Quant Engine</p>
    </div>
  );

  // 2. Error Screen
  if (error) return (
    <div className="error-screen">
      <div className="error-code">ERR_CONNECTION</div>
      <p className="error-msg">{error}</p>
      <button onClick={() => window.location.reload()} className="error-btn">Retry Connection</button>
    </div>
  );

  // 3. Safety Check: Agar data load ho gaya par null hai
  if (!data) return null;

  const isUp = data.prediction === 'UP';
  const predColor = isUp ? '#10b981' : '#f43f5e';
  const predColorDim = isUp ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)';

  if (activeView === 'oi') return <OIDashboard onBack={() => setActiveView('home')} />;
  if (activeView === 'oichange') return <OIChangeDashboard onBack={() => setActiveView('home')} />;

  return (
    <div className="app-root">
      <div className="canvas-bg"><Hero3D prediction={data.prediction} /></div>
      <div className="grain" />
      
      {/* Menu Logic */}
      <AnimatePresence>
        {isMenuOpen && (
           <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', background: 'rgba(15, 23, 42, 0.95)', zIndex: 100, padding: '2rem' }}>
              <button onClick={() => setIsMenuOpen(false)} style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={() => { setIsMenuOpen(false); setActiveView('oi'); }} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Live Option Chain</button>
                <button onClick={() => { setIsMenuOpen(false); setActiveView('oichange'); }} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>OI Change Analysis</button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="layout">
        <nav className="topbar">
          <div className="brand">NIRAJ <span className="brand-accent">STOCK PREDICTOR</span></div>
          <button onClick={() => setIsMenuOpen(true)} className="chip"><Menu size={12} /> MENU</button>
        </nav>

        <main className="content">
          <motion.section className="card prediction-card">
            <h1 className="prediction-word" style={{ color: predColor }}><ProtectedValue value={data.prediction} /></h1>
            <div className="confidence-bar-wrap">
              <div className="conf-track"><motion.div className="conf-fill" style={{ background: predColor, width: data.confidence }} /></div>
              <ProtectedValue value={data.confidence} className="conf-pct" style={{ color: predColor }} />
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}

export default App;