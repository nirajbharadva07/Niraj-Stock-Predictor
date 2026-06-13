import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { ArrowLeft, Zap, TrendingUp, TrendingDown, Info, Crosshair, AlertTriangle } from 'lucide-react';

const OIDashboardStyle = `
  .pro-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
  .pro-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
`;

const getInterpretation = (oiChg, ltpChg, isCall) => {
  if (oiChg > 0 && ltpChg > 0) return { text: "Long Buildup", color: "#4ade80" }; // Green
  if (oiChg > 0 && ltpChg <= 0) return { text: "Short Buildup", color: "#f87171" }; // Red
  if (oiChg < 0 && ltpChg > 0) return { text: "Short Covering", color: "#60a5fa" }; // Blue
  if (oiChg < 0 && ltpChg <= 0) return { text: "Long Unwinding", color: "#fb923c" }; // Orange
  return { text: "Neutral", color: "#94a3b8" };
};

const OIChangeDashboard = ({ onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveOptionChain = async () => {
    try {
      const res = await axios.get('http://localhost:8001/option-chain');
      if (res.data.status === 'success') {
        setData(res.data);
        setError(null);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Failed to connect to Python backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = OIDashboardStyle;
    document.head.appendChild(styleSheet);
    
    fetchLiveOptionChain();
    const interval = setInterval(fetchLiveOptionChain, 10000); // 10s auto update
    
    return () => {
      clearInterval(interval);
      document.head.removeChild(styleSheet);
    };
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#10b981', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <Zap style={{ marginBottom: '24px' }} size={50} className="animate-pulse" />
      <div style={{ fontSize: '20px', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Mapping Intraday Momentum...</div>
    </div>
  );

  if (error || !data) return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#ef4444', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <AlertTriangle style={{ marginBottom: '24px' }} size={50} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  // Prepare data for Chart & Logic
  let totalCallOIChg = 0;
  let totalPutOIChg = 0;
  const chartData = [];

  data.chain.forEach(row => {
    totalCallOIChg += row.call.chgOi;
    totalPutOIChg += row.put.chgOi;
    
    chartData.push({
      strike: row.strike.toString(),
      CallOIChange: row.call.chgOi,
      PutOIChange: row.put.chgOi,
    });
  });

  // Institutional Logic
  const netMomentum = totalPutOIChg - totalCallOIChg;
  let trendLabel = "SIDEWAYS";
  let trendColor = "#eab308";
  
  if (netMomentum > 15) {
    trendLabel = "STRONG BULLISH (Put Writers Aggressive)";
    trendColor = "#10b981"; // Emerald
  } else if (netMomentum < -15) {
    trendLabel = "STRONG BEARISH (Call Writers Aggressive)";
    trendColor = "#ef4444"; // Red
  } else if (netMomentum > 5) {
    trendLabel = "MILD BULLISH";
    trendColor = "#34d399";
  } else if (netMomentum < -5) {
    trendLabel = "MILD BEARISH";
    trendColor = "#f87171";
  }

  return (
    <div className="pro-scrollbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', backgroundColor: '#0b0f19', width: '100%', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', zIndex: 100 }}>
      
      {/* ── TOP NAV ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            NIFTY <span style={{ fontWeight: '400', color: '#10b981' }}>Intraday OI Change</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span>Spot:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{data.spot}</span>
          </div>
          <div style={{ padding: '6px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} className="animate-pulse" /> LIVE SIMULATION
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        
        {/* ── BAR CHART VISUALIZATION ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', marginBottom: '32px', height: '400px' }}>
          <h2 style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={16} /> Strike-wise OI Addition / Unwinding (in Lakhs)
          </h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="strike" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Bar dataKey="PutOIChange" name="Put OI Chg (Support)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CallOIChange" name="Call OI Chg (Resistance)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ── ALGO MOMENTUM ANALYSIS ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total Call OI Change</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>{totalCallOIChg.toFixed(1)} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>Lakhs</span></div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Bears creating positions.</div>
          </div>
          
          <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px' }}>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Total Put OI Change</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff' }}>{totalPutOIChg.toFixed(1)} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>Lakhs</span></div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Bulls creating positions.</div>
          </div>

          <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: `1px solid ${trendColor}40`, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} /> Intraday Institutional Momentum
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: trendColor }}>{trendLabel}</div>
            </div>
            <div style={{ height: '50px', width: '50px', borderRadius: '50%', backgroundColor: `${trendColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {netMomentum > 0 ? <TrendingUp color={trendColor} size={24} /> : <TrendingDown color={trendColor} size={24} />}
            </div>
          </div>
        </motion.div>

        {/* ── DETAILED INTERPRETATION TABLE ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: '600', color: '#cbd5e1' }}>Strike-by-Strike Interpretation</div>
          <div className="pro-scrollbar" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f1422', color: '#64748b' }}>
                  <th style={{ padding: '16px', fontWeight: '500' }}>Call OI Chg</th>
                  <th style={{ padding: '16px', fontWeight: '500' }}>Call Action</th>
                  <th style={{ padding: '16px', fontWeight: '700', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>STRIKE</th>
                  <th style={{ padding: '16px', fontWeight: '500' }}>Put Action</th>
                  <th style={{ padding: '16px', fontWeight: '500' }}>Put OI Chg</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: '"Roboto Mono", monospace' }}>
                {data.chain.map((row, idx) => {
                  const callInterp = getInterpretation(row.call.chgOi, row.call.chg, true);
                  const putInterp = getInterpretation(row.put.chgOi, row.put.chg, false);
                  const isAtm = row.isATM;
                  
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', backgroundColor: isAtm ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '14px', color: row.call.chgOi > 0 ? '#10b981' : '#ef4444' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi} L</td>
                      <td style={{ padding: '14px', color: callInterp.color, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{callInterp.text}</td>
                      
                      <td style={{ padding: '14px', backgroundColor: isAtm ? 'rgba(56, 189, 248, 0.1)' : '#0f1422', color: isAtm ? '#38bdf8' : '#fff', fontWeight: '700', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        {row.strike}
                      </td>

                      <td style={{ padding: '14px', color: putInterp.color, fontWeight: '600', fontSize: '11px', textTransform: 'uppercase' }}>{putInterp.text}</td>
                      <td style={{ padding: '14px', color: row.put.chgOi > 0 ? '#10b981' : '#ef4444' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi} L</td>
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