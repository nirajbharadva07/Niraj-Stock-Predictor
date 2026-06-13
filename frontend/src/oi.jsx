import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, TrendingDown, TrendingUp, Crosshair, Clock, ArrowLeft, Info, AlertTriangle } from 'lucide-react';

const customScrollbarStyles = `
  .pro-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
  .pro-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
  .pro-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
`;

const OIDashboard = ({ onBack }) => {
  const [chainData, setChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // FETCH REAL DATA
  const fetchLiveOptionChain = async () => {
    try {
      const res = await axios.get('http://localhost:8001/option-chain');
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
    styleSheet.innerText = customScrollbarStyles;
    document.head.appendChild(styleSheet);

    // Initial Fetch
    fetchLiveOptionChain();

    // Check Market Time
    const now = new Date();
    const day = now.getDay(); 
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isTradingHours = (hours > 9 || (hours === 9 && minutes >= 15)) && (hours < 15 || (hours === 15 && minutes <= 30));
    
    const marketStatus = (day > 0 && day < 6 && isTradingHours);
    setIsMarketOpen(marketStatus);

    // 🔥 LIVE AUTO-UPDATE EVERY 10 SECONDS
    let interval;
    if (marketStatus) {
      interval = setInterval(() => {
        fetchLiveOptionChain();
      }, 10000); 
    }

    return () => {
      if (interval) clearInterval(interval);
      document.head.removeChild(styleSheet);
    };
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#22d3ee', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <Zap style={{ marginBottom: '24px' }} size={50} className="animate-pulse" />
      <div style={{ fontSize: '20px', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Fetching Live NSE Data...</div>
    </div>
  );

  if (error || !chainData) return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', color: '#ef4444', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 999 }}>
      <AlertTriangle style={{ marginBottom: '24px' }} size={50} />
      <div style={{ fontSize: '16px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );

  // ─── REAL ALGORITHM CALCULATION ───
  // Calculate Total Call OI & Put OI for PCR
  let totalCallOI = 0;
  let totalPutOI = 0;
  chainData.chain.forEach(row => {
    totalCallOI += row.call.oi;
    totalPutOI += row.put.oi;
  });
  
  const pcr = totalPutOI / totalCallOI;
  let overallTrend = "NEUTRAL / SIDEWAYS";
  let trendDirection = "NEUTRAL";
  let trendColor = "#eab308"; // Yellow

  if (pcr > 1.1) {
    overallTrend = "STRONG BULLISH TREND";
    trendDirection = "UP";
    trendColor = "#4ade80"; // Green
  } else if (pcr < 0.8) {
    overallTrend = "STRONG BEARISH TREND";
    trendDirection = "DOWN";
    trendColor = "#ef4444"; // Red
  }

  const algoAnalysis = {
    callITM: { status: 'Analyzed', desc: 'Real-time ITM Call positions mapped.', color: '#38bdf8' },
    callOTM: { status: 'Resistance', desc: `Total Call OI: ${totalCallOI.toFixed(1)} Lakhs`, color: '#ef4444' },
    putITM: { status: 'Analyzed', desc: 'Real-time ITM Put positions mapped.', color: '#38bdf8' },
    putOTM: { status: 'Support', desc: `Total Put OI: ${totalPutOI.toFixed(1)} Lakhs`, color: '#4ade80' },
    overall: { status: overallTrend, trend: trendDirection, color: trendColor }
  };

  return (
    <div className="pro-scrollbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', backgroundColor: '#0b0f19', width: '100%', color: '#cbd5e1', fontFamily: '"Inter", sans-serif', overflowY: 'auto', overflowX: 'hidden', paddingBottom: '80px', zIndex: 100 }}>
      
      {/* ── UNIFIED TOP NAVIGATION BAR ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            NIFTY <span style={{ fontWeight: '400', color: '#64748b' }}>Live Chain</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span>Spot:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{chainData.spot}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
            <span>Exp:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{chainData.expiry}</span>
          </div>
          {isMarketOpen ? (
            <div style={{ padding: '6px 16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} className="animate-pulse" /> LIVE
            </div>
          ) : (
            <div style={{ padding: '6px 16px', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} /> NSE SNAPSHOT: {chainData.timestamp}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        
        {/* OPTION CHAIN */}
        <div style={{ backgroundColor: '#131826', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden', marginBottom: '40px' }}>
          <div className="pro-scrollbar" style={{ overflowX: 'auto', width: '100%', paddingBottom: '8px' }}>
            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th colSpan="5" style={{ padding: '12px 16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>CALLS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', backgroundColor: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>STRIKE</th>
                  <th colSpan="5" style={{ padding: '12px 16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: '600', letterSpacing: '1px' }}>PUTS</th>
                </tr>
                <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>OI (L)</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Chg OI</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Volume</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>LTP</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Chg%</th>
                  
                  <th style={{ backgroundColor: '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}></th>
                  
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Chg%</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>LTP</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Volume</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>Chg OI</th>
                  <th style={{ padding: '12px 20px', fontWeight: '500' }}>OI (L)</th>
                </tr>
              </thead>
              
              <tbody style={{ fontFamily: '"Roboto Mono", monospace', fontSize: '13px' }}>
                {chainData.chain.map((row, idx) => {
                  const callBg = row.call.isITM ? 'rgba(251, 191, 36, 0.04)' : 'transparent';
                  const putBg = row.put.isITM ? 'rgba(251, 191, 36, 0.04)' : 'transparent';
                  const isAtm = row.isATM;
                  const atmBg = isAtm ? 'rgba(56, 189, 248, 0.08)' : 'transparent';
                  const borderStyle = isAtm ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255,255,255,0.03)';

                  return (
                    <tr key={idx} style={{ borderBottom: borderStyle, backgroundColor: atmBg, transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '12px 20px', backgroundColor: callBg, color: '#cbd5e1' }}>{row.call.oi}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: callBg, color: row.call.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.call.chgOi > 0 ? `+${row.call.chgOi}` : row.call.chgOi}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: callBg, color: '#64748b' }}>{row.call.vol.toLocaleString()}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: callBg, color: '#fff', fontWeight: '600' }}>{row.call.ltp}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: callBg, color: row.call.chg > 0 ? '#4ade80' : '#f87171' }}>{row.call.chg}%</td>
                      
                      <td style={{ padding: '12px 20px', textAlign: 'center', backgroundColor: isAtm ? 'rgba(56, 189, 248, 0.15)' : '#0f1422', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', color: isAtm ? '#38bdf8' : '#fff', fontWeight: '700' }}>
                        {row.strike}
                      </td>

                      <td style={{ padding: '12px 20px', backgroundColor: putBg, color: row.put.chg > 0 ? '#4ade80' : '#f87171' }}>{row.put.chg}%</td>
                      <td style={{ padding: '12px 20px', backgroundColor: putBg, color: '#fff', fontWeight: '600' }}>{row.put.ltp}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: putBg, color: '#64748b' }}>{row.put.vol.toLocaleString()}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: putBg, color: row.put.chgOi > 0 ? '#4ade80' : '#f87171' }}>{row.put.chgOi > 0 ? `+${row.put.chgOi}` : row.put.chgOi}</td>
                      <td style={{ padding: '12px 20px', backgroundColor: putBg, color: '#cbd5e1' }}>{row.put.oi}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── REAL ALGO ANALYSIS SECTION ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ShieldAlert color="#38bdf8" size={18} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Smart Data Engine (Live PCR: {pcr.toFixed(2)})</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {[
              { title: "Call ITM", data: algoAnalysis.callITM },
              { title: "Call OTM", data: algoAnalysis.callOTM },
              { title: "Put ITM", data: algoAnalysis.putITM },
              { title: "Put OTM", data: algoAnalysis.putOTM },
            ].map((item, idx) => (
              <div key={idx} style={{ padding: '20px', backgroundColor: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: item.data.color, marginBottom: '6px' }}>{item.data.status}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>{item.data.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '24px', backgroundColor: '#131826', borderRadius: '10px', border: `1px solid ${algoAnalysis.overall.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Info size={14} /> Overall Market Prediction
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: algoAnalysis.overall.color, letterSpacing: '-0.5px' }}>
                {algoAnalysis.overall.status}
              </div>
            </div>
            <div style={{ height: '48px', width: '48px', borderRadius: '50%', backgroundColor: `${algoAnalysis.overall.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {algoAnalysis.overall.trend === 'UP' ? <TrendingUp color={algoAnalysis.overall.color} size={24} /> : <TrendingDown color={algoAnalysis.overall.color} size={24} />}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OIDashboard;