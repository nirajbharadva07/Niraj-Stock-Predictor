import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, TrendingDown, TrendingUp, Crosshair, Clock, ArrowLeft, Info, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE || window.location.origin;

// 🔥 ONLY MOBILE CSS: 100% Fixed Center Strike + Shadow
const oiMobileFixStyles = `
  .pro-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
  .pro-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }

  @media (max-width: 768px) {
    .oi-app-root { width: 100vw !important; overflow-x: hidden !important; overflow-y: auto !important; position: absolute !important; }
    .oi-nav { flex-direction: column !important; align-items: flex-start !important; padding: 15px !important; gap: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .oi-nav-right { width: 100%; display: flex; justify-content: space-between; }
    
    .oi-main-wrap { padding: 15px 0 !important; } 
    .oi-grid-wrap { padding: 0 15px !important; margin-bottom: 20px; } 
    .oi-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
    .oi-overall-box { flex-direction: column !important; text-align: center; gap: 15px; }

    .table-wrapper { border-radius: 0 !important; border: none !important; width: 100vw !important; margin: 0 !important; }
    .table-scroll-container { width: 100vw !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; padding: 0 !important; }
    
    table { border-collapse: separate !important; border-spacing: 0 !important; } 
    th, td { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
    tr { border-bottom: none !important; }
    
    .strike-col {
      position: -webkit-sticky !important;
      position: sticky !important;
      left: calc(50vw - 40px) !important;  
      right: calc(50vw - 40px) !important; 
      width: 80px !important; min-width: 80px !important; max-width: 80px !important;
      background-color: #0f1422 !important;
      z-index: 50 !important;
      box-shadow: 0px 0px 20px 5px rgba(0,0,0,0.9) !important;
    }
`;

const OIDashboard = ({ onBack }) => {
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  const fetchLiveOptionChain = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/option-chain`);
      if (res.data.status === 'success') { setChainData(res.data); setError(null); } 
      else { setError(res.data.message); }
    } catch (err) { setError("Failed to connect to Python backend."); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = oiMobileFixStyles;
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

  useEffect(() => {
    if (chainData) {
      setTimeout(() => {
        const container = document.querySelector('.table-scroll-container');
        if (container && window.innerWidth <= 768) {
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        }
      }, 50); 
    }
  }, [chainData]);

  if (loading) return (
    <div className="loader-screen" style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#22d3ee', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <Zap style={{ marginBottom: '24px' }} size={50} className="animate-pulse" />
      <div style={{ fontSize: '20px', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Fetching Live NSE Data...</div>
    </div>
  );

  if (error || !chainData) return (
    <div className="error-screen" style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#ef4444', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <AlertTriangle style={{ marginBottom: '24px' }} size={50} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  let totalCallOI = 0; let totalPutOI = 0;
  chainData.chain.forEach(row => { totalCallOI += row.call.oi; totalPutOI += row.put.oi; });
  const pcr = totalPutOI / totalCallOI;
  let overallTrend = "NEUTRAL / SIDEWAYS"; let trendDirection = "NEUTRAL"; let trendColor = "#eab308";

  if (pcr > 1.1) { overallTrend = "STRONG BULLISH TREND"; trendDirection = "UP"; trendColor = "#4ade80"; } 
  else if (pcr < 0.8) { overallTrend = "STRONG BEARISH TREND"; trendDirection = "DOWN"; trendColor = "#ef4444"; }

  const algoAnalysis = {
    callOTM: { status: 'Resistance', desc: `Calls: ${totalCallOI.toFixed(1)} L`, color: '#ef4444' },
    putOTM: { status: 'Support', desc: `Puts: ${totalPutOI.toFixed(1)} L`, color: '#4ade80' },
    overall: { status: overallTrend, trend: trendDirection, color: trendColor }
  };

  return (
    <div className="pro-scrollbar oi-app-root" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', backgroundColor: '#0b0f19', width: '100%', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', zIndex: 100 }}>
      
      {/* 🔥 FIX: Nav zIndex set to 999 to stay ABOVE the strike column 🔥 */}
      <div className="oi-nav" style={{ position: 'sticky', top: 0, zIndex: 999, backgroundColor: 'rgba(11, 15, 25, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            NIFTY <span style={{ fontWeight: '400', color: '#64748b' }}>Live Chain</span>
          </h1>
        </div>

        <div className="oi-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span>Spot:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{chainData.spot}</span>
          </div>
          {isMarketOpen ? (
            <div style={{ padding: '6px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} className="animate-pulse" /> LIVE
            </div>
          ) : (
            <div style={{ padding: '6px 16px', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} /> SNAPSHOT
            </div>
          )}
        </div>
      </div>

      <div className="oi-main-wrap" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        
        <motion.div className="oi-grid-wrap" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ShieldAlert color="#38bdf8" size={18} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Smart Data Engine (Live PCR: {pcr.toFixed(2)})</h2>
          </div>
          <div className="oi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Call Resistance</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#ef4444', marginBottom: '6px' }}>{algoAnalysis.callOTM.status}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{algoAnalysis.callOTM.desc}</div>
            </div>
            <div style={{ padding: '20px', backgroundColor: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Put Support</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#4ade80', marginBottom: '6px' }}>{algoAnalysis.putOTM.status}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{algoAnalysis.putOTM.desc}</div>
            </div>
          </div>
          <div className="oi-overall-box" style={{ padding: '24px', backgroundColor: '#131826', borderRadius: '10px', border: `1px solid ${algoAnalysis.overall.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}><Info size={14} style={{display:'inline', verticalAlign:'middle'}}/> Overall Prediction</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: algoAnalysis.overall.color }}>{algoAnalysis.overall.status}</div>
            </div>
            <div style={{ height: '48px', width: '48px', borderRadius: '50%', backgroundColor: `${algoAnalysis.overall.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {algoAnalysis.overall.trend === 'UP' ? <TrendingUp color={algoAnalysis.overall.color} size={24} /> : <TrendingDown color={algoAnalysis.overall.color} size={24} />}
            </div>
          </div>
        </motion.div>

        <div className="table-wrapper" style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(237, 25, 25, 0.05)', overflow: 'hidden', marginBottom: '40px', marginTop: '20px' }}>
          <div className="table-scroll-container pro-scrollbar" style={{ overflowX: 'auto', width: '100%', paddingBottom: '8px', position: 'relative' }}>
            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th colSpan="5" style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: '600' }}>CALLS</th>
                  <th className="strike-col" style={{ width: '80px', padding: '12px 0', backgroundColor: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', color: '#fff', fontWeight: 'bold' }}>STRIKE</th>
                  <th colSpan="5" style={{ padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: '600' }}>PUTS</th>
                </tr>
                <tr style={{ color: '#64748b' }}>
                  <th style={{ padding: '12px' }}>OI (L)</th>
                  <th style={{ padding: '12px' }}>Chg OI</th>
                  <th style={{ padding: '12px' }}>Volume</th>
                  <th style={{ padding: '12px' }}>LTP</th>
                  <th style={{ padding: '12px' }}>Chg%</th>
                  <th className="strike-col" style={{ width: '80px', backgroundColor: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}></th>
                  <th style={{ padding: '12px' }}>Chg%</th>
                  <th style={{ padding: '12px' }}>LTP</th>
                  <th style={{ padding: '12px' }}>Volume</th>
                  <th style={{ padding: '12px' }}>Chg OI</th>
                  <th style={{ padding: '12px' }}>OI (L)</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '13px' }}>
                {chainData.chain.map((row, idx) => {
                  const isAtm = row.isATM;
                  const bg = isAtm ? 'rgba(56, 189, 248, 0.08)' : 'transparent';
                  const strikeBg = isAtm ? '#1e293b' : '#0f1422';

                  return (
                    <tr key={idx} style={{ backgroundColor: bg }}>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{row.call.oi}</td>
                      <td style={{ padding: '12px', color: row.call.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.call.vol.toLocaleString()}</td>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>{row.call.ltp}</td>
                      <td style={{ padding: '12px', color: row.call.chg > 0 ? '#4ade80' : '#f87171' }}>{row.call.chg}%</td>
                      
                      <td className="strike-col" style={{ width: '80px', padding: '12px 0', backgroundColor: strikeBg, borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', color: isAtm ? '#38bdf8' : '#fff', fontWeight: '700' }}>
                        {row.strike}
                      </td>

                      <td style={{ padding: '12px', color: row.put.chg > 0 ? '#4ade80' : '#f87171' }}>{row.put.chg}%</td>
                      <td style={{ padding: '12px', color: '#fff', fontWeight: '600' }}>{row.put.ltp}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{row.put.vol.toLocaleString()}</td>
                      <td style={{ padding: '12px', color: row.put.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi}</td>
                      <td style={{ padding: '12px', color: '#cbd5e1' }}>{row.put.oi}</td>
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