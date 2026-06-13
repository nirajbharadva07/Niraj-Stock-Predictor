import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, TrendingDown, TrendingUp, Crosshair, Clock, ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import { globalResponsiveStyles } from './App'; // Import styles

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

const OIDashboard = ({ onBack }) => {
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const fetchLiveOptionChain = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/option-chain`);
      if (res.data.status === 'success') {
        setChainData(res.data);
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
    styleSheet.innerText = globalResponsiveStyles;
    document.head.appendChild(styleSheet);

    fetchLiveOptionChain();
    const now = new Date();
    const isTradingHours = (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() >= 15)) && (now.getHours() < 15 || (now.getHours() === 15 && now.getMinutes() <= 30));
    const marketStatus = (now.getDay() > 0 && now.getDay() < 6 && isTradingHours);
    setIsMarketOpen(marketStatus);

    let interval;
    if (marketStatus) interval = setInterval(fetchLiveOptionChain, 10000); 
    
    return () => { if (interval) clearInterval(interval); document.head.removeChild(styleSheet); };
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#22d3ee' }}>
      <Zap size={40} className="animate-pulse" style={{ marginBottom: '20px' }} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', fontWeight: 'bold' }}>FETCHING LIVE NSE DATA...</div>
    </div>
  );

  if (error || !chainData) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#ef4444' }}>
      <AlertTriangle size={50} style={{ marginBottom: '20px' }} />
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '12px 24px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Go Back</button>
    </div>
  );

  let totalCallOI = 0; let totalPutOI = 0;
  chainData.chain.forEach(row => { totalCallOI += row.call.oi; totalPutOI += row.put.oi; });
  
  const pcr = totalPutOI / totalCallOI;
  let overallTrend = "NEUTRAL"; let trendDirection = "NEUTRAL"; let trendColor = "#eab308";
  if (pcr > 1.1) { overallTrend = "BULLISH"; trendDirection = "UP"; trendColor = "#4ade80"; } 
  else if (pcr < 0.8) { overallTrend = "BEARISH"; trendDirection = "DOWN"; trendColor = "#ef4444"; }

  const algoAnalysis = {
    callOTM: { status: 'Resistance', desc: `Calls: ${totalCallOI.toFixed(1)} L`, color: '#ef4444' },
    putOTM: { status: 'Support', desc: `Puts: ${totalPutOI.toFixed(1)} L`, color: '#4ade80' },
    overall: { status: overallTrend, trend: trendDirection, color: trendColor }
  };

  return (
    <div className="pro-scrollbar app-root" style={{ position: 'fixed', inset: 0, background: '#0b0f19', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', zIndex: 100 }}>
      
      <div className="oi-header" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(11, 15, 25, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', margin: 0 }}>NIFTY <span style={{ color: '#22d3ee' }}>CHAIN</span></h1>
        </div>

        <div className="oi-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>Spot: <span style={{ color: '#fff' }}>{chainData.spot}</span></div>
          {isMarketOpen ? (
            <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} className="animate-pulse" /> LIVE
            </div>
          ) : (
            <div style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> SNAPSHOT
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 0 80px 0' }}>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <ShieldAlert color="#38bdf8" size={18} />
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Smart Data Engine (PCR: {pcr.toFixed(2)})</h2>
          </div>

          <div className="oi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Call Resistance</div>
               <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444', margin: '8px 0' }}>{algoAnalysis.callOTM.status}</div>
               <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{algoAnalysis.callOTM.desc}</div>
            </div>
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Put Support</div>
               <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4ade80', margin: '8px 0' }}>{algoAnalysis.putOTM.status}</div>
               <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{algoAnalysis.putOTM.desc}</div>
            </div>
            <div className="oi-overall-box" style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${algoAnalysis.overall.color}40`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Market Trend</div>
                 <div style={{ fontSize: '1.8rem', fontWeight: '900', color: algoAnalysis.overall.color }}>{algoAnalysis.overall.status}</div>
               </div>
               <div style={{ height: '50px', width: '50px', borderRadius: '50%', background: `${algoAnalysis.overall.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {algoAnalysis.overall.trend === 'UP' ? <TrendingUp color={algoAnalysis.overall.color} size={28} /> : <TrendingDown color={algoAnalysis.overall.color} size={28} />}
               </div>
            </div>
          </div>
        </motion.div>

        <div className="oi-table-container" style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', margin: '0 20px' }}>
          <div className="pro-scrollbar" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <th colSpan="4" style={{ padding: '15px', color: '#ef4444', fontWeight: 'bold' }}>CALLS (Resistance)</th>
                  <th style={{ padding: '15px', background: '#0f1422', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>STRIKE</th>
                  <th colSpan="4" style={{ padding: '15px', color: '#10b981', fontWeight: 'bold' }}>PUTS (Support)</th>
                </tr>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '12px' }}>OI (L)</th><th style={{ padding: '12px' }}>Chg OI</th><th style={{ padding: '12px' }}>LTP</th><th style={{ padding: '12px' }}>Chg%</th>
                  <th style={{ background: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}></th>
                  <th style={{ padding: '12px' }}>Chg%</th><th style={{ padding: '12px' }}>LTP</th><th style={{ padding: '12px' }}>Chg OI</th><th style={{ padding: '12px' }}>OI (L)</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: '"Roboto Mono", monospace' }}>
                {chainData.chain.map((row, idx) => {
                  const isAtm = row.isATM;
                  const borderStyle = isAtm ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255,255,255,0.03)';
                  return (
                    <tr key={idx} style={{ borderBottom: borderStyle, background: isAtm ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
                      <td style={{ padding: '14px', color: '#cbd5e1' }}>{row.call.oi}</td>
                      <td style={{ padding: '14px', color: row.call.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi}</td>
                      <td style={{ padding: '14px', color: '#fff', fontWeight: 'bold' }}>{row.call.ltp}</td>
                      <td style={{ padding: '14px', color: row.call.chg > 0 ? '#4ade80' : '#f87171' }}>{row.call.chg}%</td>
                      <td style={{ padding: '14px', background: isAtm ? 'rgba(56,189,248,0.2)' : '#0f1422', color: isAtm ? '#38bdf8' : '#fff', fontWeight: '900', fontSize: '1rem', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>{row.strike}</td>
                      <td style={{ padding: '14px', color: row.put.chg > 0 ? '#4ade80' : '#f87171' }}>{row.put.chg}%</td>
                      <td style={{ padding: '14px', color: '#fff', fontWeight: 'bold' }}>{row.put.ltp}</td>
                      <td style={{ padding: '14px', color: row.put.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi}</td>
                      <td style={{ padding: '14px', color: '#cbd5e1' }}>{row.put.oi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OIDashboard;