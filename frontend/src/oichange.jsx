import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Info, Crosshair, AlertTriangle } from 'lucide-react';
import { globalResponsiveStyles } from './App'; // Import styles

const getInterpretation = (oiChg, ltpChg, isCall) => {
  if (oiChg > 0 && ltpChg > 0) return { text: "Long Buildup", color: "#4ade80" }; 
  if (oiChg > 0 && ltpChg <= 0) return { text: "Short Buildup", color: "#f87171" }; 
  if (oiChg < 0 && ltpChg > 0) return { text: "Short Covering", color: "#60a5fa" }; 
  if (oiChg < 0 && ltpChg <= 0) return { text: "Long Unwinding", color: "#fb923c" }; 
  return { text: "Neutral", color: "#94a3b8" };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

const OIChangeDashboard = ({ onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveOptionChain = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/option-chain`);
      if (res.data.status === 'success') { setData(res.data); setError(null); } 
      else { setError(res.data.message); }
    } catch (err) { setError("Failed to connect to Python backend."); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalResponsiveStyles;
    document.head.appendChild(styleSheet);
    
    fetchLiveOptionChain();
    const interval = setInterval(fetchLiveOptionChain, 10000);
    return () => { clearInterval(interval); document.head.removeChild(styleSheet); };
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#10b981' }}>
      <Zap size={40} className="animate-pulse" style={{ marginBottom: '20px' }} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', fontWeight: 'bold' }}>MAPPING MOMENTUM...</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#ef4444' }}>
      <AlertTriangle size={50} style={{ marginBottom: '20px' }} />
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Go Back</button>
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
    <div className="pro-scrollbar app-root" style={{ position: 'fixed', inset: 0, background: '#0b0f19', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', zIndex: 100 }}>
      
      <div className="oi-header" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11, 15, 25, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', margin: 0 }}>OI <span style={{ color: '#10b981' }}>MOMENTUM</span></h1>
        </div>
        <div className="oi-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>Spot: <span style={{ color: '#fff' }}>{data.spot}</span></div>
          <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} className="animate-pulse" /> LIVE SIM
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 0 80px 0' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', marginBottom: '25px', height: '350px', margin: '0 20px 25px 20px' }}>
          <h2 style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Crosshair size={16} /> Strike-wise Momentum (Lakhs)</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <XAxis dataKey="strike" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="PutOIChange" name="Put OI Chg" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CallOIChange" name="Call OI Chg" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="oi-momentum-grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', margin: '0 20px 25px 20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>Call Change</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '5px 0' }}>{totalCallOIChg.toFixed(1)} L</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '20px' }}>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}>Put Change</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#fff', margin: '5px 0' }}>{totalPutOIChg.toFixed(1)} L</div>
          </div>
          <div className="oi-overall-box" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${trendColor}40`, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Institutional Momentum</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: trendColor }}>{trendLabel}</div>
            </div>
            <div style={{ height: '50px', width: '50px', borderRadius: '50%', background: `${trendColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {netMomentum > 0 ? <TrendingUp color={trendColor} size={28} /> : <TrendingDown color={trendColor} size={28} />}
            </div>
          </div>
        </motion.div>

        <motion.div className="oi-table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', margin: '0 20px' }}>
          <div className="pro-scrollbar" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f1422', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '15px' }}>Call OI Chg</th><th style={{ padding: '15px' }}>Call Action</th>
                  <th style={{ padding: '15px', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>STRIKE</th>
                  <th style={{ padding: '15px' }}>Put Action</th><th style={{ padding: '15px' }}>Put OI Chg</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: '"Roboto Mono", monospace' }}>
                {data.chain.map((row, idx) => {
                  const callInterp = getInterpretation(row.call.chgOi, row.call.chg, true);
                  const putInterp = getInterpretation(row.put.chgOi, row.put.chg, false);
                  const isAtm = row.isATM;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isAtm ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
                      <td style={{ padding: '12px', color: row.call.chgOi > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi} L</td>
                      <td style={{ padding: '12px', color: callInterp.color, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{callInterp.text}</td>
                      <td style={{ padding: '12px', background: isAtm ? 'rgba(56,189,248,0.2)' : '#0f1422', color: isAtm ? '#38bdf8' : '#fff', fontWeight: '900', fontSize: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>{row.strike}</td>
                      <td style={{ padding: '12px', color: putInterp.color, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{putInterp.text}</td>
                      <td style={{ padding: '12px', color: row.put.chgOi > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi} L</td>
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