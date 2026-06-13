import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Info, Crosshair, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

const safeMobileStyles = `
  .pro-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
  .pro-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }

  @media (max-width: 768px) {
    .safe-root { position: fixed !important; inset: 0 !important; overflow-y: auto !important; overflow-x: hidden !important; background: #0b0f19 !important; z-index: 1 !important; }
    
    .safe-nav { position: sticky !important; top: 0 !important; z-index: 1000 !important; flex-direction: column !important; align-items: flex-start !important; padding: 15px !important; gap: 15px !important; background: rgba(11, 15, 25, 0.98) !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
    .safe-nav-row { width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }
    
    .safe-main { padding: 15px !important; }
    .safe-chart-card { height: 320px !important; margin-bottom: 20px !important; padding: 15px 5px !important; }
    .safe-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; margin-bottom: 20px !important; }
    .safe-overall { grid-column: 1 / -1 !important; flex-direction: column !important; text-align: center; gap: 15px; }

    .safe-table-card { border-radius: 12px !important; margin: 0 !important; width: 100% !important; border: 1px solid rgba(255,255,255,0.1) !important; background: #131826 !important; }
    .table-scroll-container { width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; padding-bottom: 5px !important; }
    
    table { width: 100% !important; min-width: 900px !important; border-collapse: collapse !important; }
    th, td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
    
    .strike-col { background-color: #0f1422 !important; border-left: 1px solid rgba(255,255,255,0.1) !important; border-right: 1px solid rgba(255,255,255,0.1) !important; }
  }
`;

const getInterpretation = (oiChg, ltpChg, isCall) => {
  if (oiChg > 0 && ltpChg > 0) return { text: "Long Buildup", color: "#4ade80" }; 
  if (oiChg > 0 && ltpChg <= 0) return { text: "Short Buildup", color: "#f87171" }; 
  if (oiChg < 0 && ltpChg > 0) return { text: "Short Covering", color: "#60a5fa" }; 
  if (oiChg < 0 && ltpChg <= 0) return { text: "Long Unwinding", color: "#fb923c" }; 
  return { text: "Neutral", color: "#94a3b8" };
};

const OIChangeDashboard = ({ onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveOptionChain = async () => {
    try {
      // 🔥 CACHE BUSTER ADDED HERE
      const timestamp = new Date().getTime();
      const res = await axios.get(`${API_BASE_URL}/option-chain?t=${timestamp}`);
      if (res.data.status === 'success') { setData(res.data); setError(null); } 
      else { setError(res.data.message); }
    } catch (err) { setError("Failed to connect to Python backend."); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = safeMobileStyles;
    document.head.appendChild(styleSheet);
    
    fetchLiveOptionChain();
    const interval = setInterval(fetchLiveOptionChain, 10000);
    return () => { clearInterval(interval); document.head.removeChild(styleSheet); };
  }, []);

  useEffect(() => {
    if (data) {
      setTimeout(() => {
        const container = document.querySelector('.table-scroll-container');
        if (container && window.innerWidth <= 768) {
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        }
      }, 100); 
    }
  }, [data]);

  if (loading) return (
    // 🔥 LOADER TEXT FIX: padding added, font-size clamped, text-align center 🔥
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#10b981', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999, padding: '0 20px', boxSizing: 'border-box' }}>
      <Zap size={50} className="animate-pulse" style={{ marginBottom: '24px' }} />
      <div style={{ fontSize: 'clamp(14px, 4vw, 20px)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold', textAlign: 'center', width: '100%', wordWrap: 'break-word' }}>Mapping Intraday Momentum...</div>
    </div>
  );

  if (error || !data) return (
    <div className="error-screen" style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#ef4444', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999, padding: '0 20px', textAlign: 'center', boxSizing: 'border-box' }}>
      <AlertTriangle size={50} style={{ marginBottom: '24px' }} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  let totalCallOIChg = 0; let totalPutOIChg = 0; const chartData = [];
  data.chain.forEach(row => {
    totalCallOIChg += row.call.chgOi; totalPutOIChg += row.put.chgOi;
    chartData.push({ strike: row.strike.toString(), CallOIChange: row.call.chgOi, PutOIChange: row.put.chgOi });
  });

  const netMomentum = totalPutOIChg - totalCallOIChg;
  let trendLabel = "SIDEWAYS"; let trendColor = "#eab308";
  
  if (netMomentum > 15) { trendLabel = "STRONG BULLISH"; trendColor = "#10b981"; } 
  else if (netMomentum < -15) { trendLabel = "STRONG BEARISH"; trendColor = "#ef4444"; } 
  else if (netMomentum > 5) { trendLabel = "MILD BULLISH"; trendColor = "#34d399"; } 
  else if (netMomentum < -5) { trendLabel = "MILD BEARISH"; trendColor = "#f87171"; }

  return (
    <div className="pro-scrollbar safe-root" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', backgroundColor: '#0b0f19', width: '100%', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', zIndex: 100 }}>
      
      <div className="safe-nav" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            NIFTY <span style={{ fontWeight: '400', color: '#10b981' }}>OI Change</span>
          </h1>
        </div>
        <div className="safe-nav-row" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span>Spot:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{data.spot}</span>
          </div>
          <div style={{ padding: '6px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} className="animate-pulse" /> SIMULATION
          </div>
        </div>
      </div>

      <div className="safe-main" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        
        <motion.div className="safe-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', marginBottom: '32px', height: '400px' }}>
          <h2 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={16} /> Strike-wise OI Addition / Unwinding (Lakhs)
          </h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="strike" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="PutOIChange" name="Put OI Chg" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CallOIChange" name="Call OI Chg" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="safe-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total Call Change</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{totalCallOIChg.toFixed(1)} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>L</span></div>
          </div>
          <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total Put Change</div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{totalPutOIChg.toFixed(1)} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>L</span></div>
          </div>
          <div className="safe-overall" style={{ backgroundColor: '#131826', borderRadius: '12px', border: `1px solid ${trendColor}40`, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Institutional Momentum</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: trendColor }}>{trendLabel}</div>
            </div>
            <div style={{ height: '50px', width: '50px', borderRadius: '50%', backgroundColor: `${trendColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {netMomentum > 0 ? <TrendingUp color={trendColor} size={24} /> : <TrendingDown color={trendColor} size={24} />}
            </div>
          </div>
        </motion.div>

        <motion.div className="safe-table-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div className="table-scroll-container pro-scrollbar" style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Call OI Chg</th>
                  <th style={{ padding: '16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Call Action</th>
                  <th className="strike-col" style={{ width: '80px', padding: '16px 0', backgroundColor: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>STRIKE</th>
                  <th style={{ padding: '16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Put Action</th>
                  <th style={{ padding: '16px', fontWeight: '500', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Put OI Chg</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: '"Roboto Mono", monospace' }}>
                {data.chain.map((row, idx) => {
                  const callInterp = getInterpretation(row.call.chgOi, row.call.chg, true);
                  const putInterp = getInterpretation(row.put.chgOi, row.put.chg, false);
                  const isAtm = row.isATM;
                  const bg = isAtm ? 'rgba(56, 189, 248, 0.08)' : 'transparent';
                  const strikeBg = isAtm ? '#1e293b' : '#0f1422';
                  
                  return (
                    <tr key={idx} style={{ backgroundColor: bg }}>
                      <td style={{ padding: '14px', color: row.call.chgOi > 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi} L</td>
                      <td style={{ padding: '14px', color: callInterp.color, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{callInterp.text}</td>
                      
                      <td className="strike-col" style={{ width: '80px', padding: '14px 0', backgroundColor: strikeBg, color: isAtm ? '#38bdf8' : '#fff', fontWeight: '700', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {row.strike}
                      </td>

                      <td style={{ padding: '14px', color: putInterp.color, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{putInterp.text}</td>
                      <td style={{ padding: '14px', color: row.put.chgOi > 0 ? '#10b981' : '#ef4444', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi} L</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OIChangeDashboard;