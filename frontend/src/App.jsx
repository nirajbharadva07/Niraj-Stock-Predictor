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
  <div className="stat-pill">
    <span className="stat-label">{label}</span>
    <ProtectedValue value={value} className="stat-value" style={accent ? { color: accent } : {}} />
  </div>
);

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

// 🔥 MOBILE CSS: Ensures prediction area fits perfectly on small screens 🔥
const mobileFixStyles = `
  @media (max-width: 768px) {
    .app-root { width: 100% !important; overflow-x: hidden !important; overflow-y: auto !important; position: absolute !important; }
    .content { display: flex !important; flex-direction: column !important; padding: 15px !important; overflow: visible !important; }
    
    .topbar { flex-direction: column !important; align-items: flex-start !important; padding: 20px 15px !important; gap: 15px !important; height: auto !important; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .nav-chips { flex-wrap: wrap !important; gap: 8px !important; }
    
    .prediction-card { margin: 0 0 20px 0 !important; padding: 25px 20px !important; width: 100% !important; box-sizing: border-box !important; }
    
    /* 🔥 Fixed for text cutting off on small mobile phones 🔥 */
    .prediction-word { font-size: clamp(3rem, 15vw, 6rem) !important; margin: 10px 0 20px 0 !important; line-height: 1.1 !important; white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
    
    .chart-card { margin: 0 !important; width: 100% !important; box-sizing: border-box !important; height: 350px !important; padding: 20px 15px !important; }
    
    .metrics-row { flex-direction: column !important; gap: 12px !important; padding-top: 15px !important; }
    .divider-v { display: none !important; }
    .stat-pill { width: 100% !important; display: flex !important; justify-content: space-between !important; background: rgba(255,255,255,0.03) !important; padding: 15px !important; border-radius: 8px !important; }
    
    .footer { flex-direction: column !important; text-align: center !important; height: auto !important; padding: 25px 15px !important; gap: 12px !important; }
    .footer-sep { display: none !important; }
    .footer-item { background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; width: 100%; display: flex; justify-content: space-between; }
    .footer-item.dim { justify-content: center; background: transparent; margin-top: 10px; }
  }
`;

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('home'); 

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/predict`);
      if (res.data && res.data.status === "success") { setData(res.data); setError(null); } 
      else { setError("Backend Error: " + (res.data?.message || "Unknown Error")); }
    } catch (err) { setError("System Offline: " + err.message); } 
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const styleSheet = document.createElement("style");
    styleSheet.innerText = mobileFixStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  if (loading) return (
    <div className="loader-screen">
      <div className="loader-ring" />
      <Zap size={32} className="loader-icon" />
      <p className="loader-text">Initializing Quant Engine</p>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div className="error-code">ERR_CONNECTION</div>
      <p className="error-msg">{error}</p>
      <button onClick={() => window.location.reload()} className="error-btn">Retry Connection</button>
    </div>
  );

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
          <div className="nav-chips">
            <button onClick={() => setIsMenuOpen(true)} className="chip" style={{ cursor: 'pointer', background: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.3)', color: '#22d3ee' }}>
              <Menu size={12} /> MENU
            </button>
            <span className="chip live"><Radio size={10} className="blink" /> LIVE</span>
            <span className="chip"><Calendar size={13} /> TARGET &nbsp;{format(addDays(new Date(), 1), 'dd MMM yyyy')}</span>
          </div>
        </nav>

        <main className="content">
          <motion.section className="card prediction-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
            <div className="card-eyebrow"><ShieldCheck size={13} /> Neural Classification</div>
            <div className="prediction-badge" style={{ background: predColorDim, borderColor: predColor }}>
              {isUp ? <TrendingUp size={20} color={predColor} /> : <TrendingDown size={20} color={predColor} />}
            </div>
            {/* 🔥 Optimized prediction area on Desktop: Consistent prediction 🔥 */}
            <motion.h1 className="prediction-word" style={{ color: predColor, textShadow: `0 0 60px ${predColor}66`, display: 'block', textTransform: 'uppercase' }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}>
              <ProtectedValue value={data.prediction} />
            </motion.h1>
            <div className="confidence-bar-wrap">
              <span className="conf-label">Confidence</span>
              <div className="conf-track">
                <motion.div className="conf-fill" style={{ background: predColor }} initial={{ width: 0 }} animate={{ width: data.confidence }} transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }} />
              </div>
              <ProtectedValue value={data.confidence} className="conf-pct" style={{ color: predColor }} />
            </div>
            <div className="metrics-row">
              <StatPill label="Nifty Close" value={`₹${data.nifty_price}`} />
              <div className="divider-v" />
              <StatPill label="India VIX" value={data.vix_real} accent={data.vix_real > 18 ? '#f43f5e' : '#10b981'} />
            </div>
          </motion.section>

          <motion.section className="card chart-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}>
            <div className="card-eyebrow"><Activity size={13} /> Nifty 30-Day Trend Pulse</div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={predColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={predColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={56} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: `1px solid ${predColor}44`, borderRadius: '12px', fontFamily: 'monospace', fontSize: '12px' }} itemStyle={{ color: predColor }} labelStyle={{ color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="price" stroke={predColor} strokeWidth={2.5} fill="url(#cg)" dot={false} animationDuration={1800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>
        </main>
        
        <footer className="footer">
          <span className="footer-item">NIFTY <ProtectedValue value={`₹${data.nifty_price}`} className="footer-strong" /></span><span className="footer-sep">·</span>
          <span className="footer-item">VIX <ProtectedValue value={data.vix_real} className="footer-strong" /></span><span className="footer-sep">·</span>
          <span className="footer-item">US MARKET <ProtectedValue value={data.global_factors?.us_market ?? ''} className="footer-strong" /></span><span className="footer-sep">·</span>
          <span className="footer-item dim" style={{ background: 'transparent' }}>NIRAJ QUANT SYSTEM v2.0</span>
        </footer>
      </div>
    </div>
  );
}

export default App;