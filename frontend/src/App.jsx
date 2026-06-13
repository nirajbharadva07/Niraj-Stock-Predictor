import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Activity, Calendar, Zap, TrendingUp, TrendingDown, Radio, Menu, X, BarChart2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import Hero3D from './Hero3D';
import OIDashboard from './oi'; 
import OIChangeDashboard from './oichange';
import './App.css';

// ── RESPONSIVE MOBILE STYLES (Injected Globally) ──
export const globalResponsiveStyles = `
  .pro-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .pro-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
  .pro-scrollbar { -webkit-overflow-scrolling: touch; }

  @media (max-width: 768px) {
    .app-root { padding: 10px; overflow-x: hidden; }
    .layout { padding: 0 !important; }
    .topbar { flex-direction: column; gap: 15px; align-items: flex-start !important; padding: 20px 15px !important; background: rgba(11, 15, 25, 0.95); }
    .nav-chips { width: 100%; display: flex; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 5px; gap: 8px; -webkit-overflow-scrolling: touch; justify-content: flex-start; }
    .nav-chips .chip { white-space: nowrap; flex-shrink: 0; padding: 8px 14px; }
    
    .prediction-card { padding: 20px !important; margin-bottom: 15px !important; }
    .prediction-word { font-size: 3.5rem !important; margin: 10px 0 !important; }
    .metrics-row { flex-direction: column; gap: 12px; }
    .divider-v { display: none; }
    .stat-pill { width: 100%; justify-content: space-between; padding: 15px !important; background: rgba(255,255,255,0.03); border-radius: 10px; }
    
    .chart-card { padding: 15px !important; height: 350px !important; }
    
    .footer { flex-direction: column; gap: 12px; align-items: center; padding: 20px !important; text-align: center; border-radius: 12px; margin-top: 20px; }
    .footer-sep { display: none; }

    /* OI & OI Change Mobile Styles */
    .oi-header { flex-direction: column; gap: 15px; align-items: flex-start !important; padding: 15px !important; }
    .oi-header-right { flex-wrap: wrap; width: 100%; gap: 8px !important; justify-content: space-between !important; }
    .oi-header-right > div { flex: 1 1 calc(50% - 8px); justify-content: center; text-align: center; }
    
    .oi-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
    .oi-grid > div { padding: 15px !important; }
    
    .oi-momentum-grid { grid-template-columns: 1fr !important; gap: 15px !important; }
    .oi-overall-box { flex-direction: column; text-align: center; gap: 15px; justify-content: center !important; padding: 20px !important; }
    .oi-table-container { border-radius: 8px; margin: 0 10px; }
  }

  @media (max-width: 480px) {
    .oi-grid { grid-template-columns: 1fr !important; }
    .prediction-word { font-size: 3rem !important; }
    .brand { font-size: 1.1rem; }
  }
`;

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
      if (el.textContent !== String(valueRef.current)) el.textContent = valueRef.current;
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    const interval = setInterval(() => {
      if (el && el.textContent !== String(valueRef.current)) el.textContent = valueRef.current;
    }, 300);
    return () => { observer.disconnect(); clearInterval(interval); };
  }, [value]);
  return ref;
}

function ProtectedValue({ value, className, style }) {
  const ref = useProtectedValue(String(value));
  return <span ref={ref} className={className} style={style} />;
}

const StatPill = ({ label, value, accent }) => (
  <div className="stat-pill" style={{ display: 'flex', alignItems: 'center' }}>
    <span className="stat-label" style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    <ProtectedValue value={value} className="stat-value" style={{ fontWeight: '800', fontSize: '1.2rem', color: accent || '#fff' }} />
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

  useEffect(() => { 
    fetchData(); 
    // Inject responsive styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalResponsiveStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  if (loading) return (
    <div className="loader-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#22d3ee' }}>
      <Zap size={40} className="animate-pulse" style={{ marginBottom: '20px' }} />
      <p style={{ fontFamily: 'monospace', letterSpacing: '2px', fontWeight: 'bold' }}>INITIALIZING QUANT ENGINE</p>
    </div>
  );

  if (error) return (
    <div className="error-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#ef4444' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>ERR_CONNECTION</div>
      <p style={{ marginBottom: '20px', color: '#94a3b8', textAlign: 'center', padding: '0 20px' }}>{error}</p>
      <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Retry Connection</button>
    </div>
  );

  if (!data) return null;

  const isUp = data.prediction === 'UP';
  const predColor = isUp ? '#10b981' : '#f43f5e';
  const predColorDim = isUp ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)';

  if (activeView === 'oi') return <OIDashboard onBack={() => setActiveView('home')} />;
  if (activeView === 'oichange') return <OIChangeDashboard onBack={() => setActiveView('home')} />;

  return (
    <div className="app-root" style={{ minHeight: '100vh', background: '#0b0f19', color: '#fff', position: 'relative' }}>
      <div className="canvas-bg" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60vh', zIndex: 0, opacity: 0.6 }}><Hero3D prediction={data.prediction} /></div>
      
      <AnimatePresence>
        {isMenuOpen && (
           <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '320px', background: 'rgba(15, 23, 42, 0.98)', borderLeft: '1px solid rgba(255,255,255,0.1)', zIndex: 999, padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px' }}>QUANT <span style={{ color: '#22d3ee' }}>TOOLS</span></div>
                <button onClick={() => setIsMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '5px' }}><X size={28} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => { setIsMenuOpen(false); setActiveView('oi'); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#e2e8f0', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <BarChart2 size={20} color="#22d3ee" /> Live Option Chain (OI)
                </button>
                <button onClick={() => { setIsMenuOpen(false); setActiveView('oichange'); }} style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#e2e8f0', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Activity size={20} color="#10b981" /> OI Change Analysis
                </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="layout" style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <nav className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
          <div className="brand" style={{ fontSize: '1.3rem', fontWeight: '900', letterSpacing: '1px' }}>NIRAJ <span style={{ color: '#22d3ee' }}>STOCK PREDICTOR</span></div>
          <div className="nav-chips" style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsMenuOpen(true)} className="chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              <Menu size={14} /> MENU
            </button>
            <span className="chip live" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 'bold', fontSize: '0.85rem' }}>
              <Radio size={12} className="blink" /> LIVE
            </span>
            <span className="chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>
              <Calendar size={12} /> {format(addDays(new Date(), 1), 'dd MMM')}
            </span>
          </div>
        </nav>

        <main className="content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <motion.section className="card prediction-card" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '20px' }}><ShieldCheck size={16} /> Neural Classification</div>
            
            <motion.h1 className="prediction-word" style={{ fontSize: '6rem', fontWeight: '900', margin: '20px 0', lineHeight: 1, color: predColor }} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <ProtectedValue value={data.prediction} />
            </motion.h1>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8', fontWeight: '600' }}>
                <span>Confidence</span>
                <ProtectedValue value={data.confidence} style={{ color: predColor }} />
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: predColor }} initial={{ width: 0 }} animate={{ width: data.confidence }} transition={{ duration: 1 }} />
              </div>
            </div>

            <div className="metrics-row" style={{ display: 'flex', gap: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <StatPill label="Nifty Close" value={`₹${data.nifty_price}`} />
              <div className="divider-v" style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
              <StatPill label="India VIX" value={data.vix_real} accent={data.vix_real > 18 ? '#f43f5e' : '#10b981'} />
            </div>
          </motion.section>

          <motion.section className="card chart-card" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)', height: '400px' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', marginBottom: '20px' }}><Activity size={16} /> 30-Day Trend Pulse</div>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={data.chart_data}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={predColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={predColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={45} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="price" stroke={predColor} strokeWidth={3} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.section>
        </main>
        
        <footer className="footer" style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '30px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px', color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
          <span className="footer-item">NIFTY <ProtectedValue value={`₹${data.nifty_price}`} style={{ color: '#fff' }} /></span><span className="footer-sep">·</span>
          <span className="footer-item">VIX <ProtectedValue value={data.vix_real} style={{ color: '#fff' }} /></span><span className="footer-sep">·</span>
          <span className="footer-item">US MARKET <ProtectedValue value={data.global_factors?.us_market ?? ''} style={{ color: '#fff' }} /></span>
        </footer>
      </div>
    </div>
  );
}

export default App;