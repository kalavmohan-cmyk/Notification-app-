import { useState } from 'react';

const APP_ID = 'fc172999-dca0-4cf3-be2d-8f8d5a8bd035';

const REGIONS = ['USA', 'UK', 'Canada', 'Australia', 'Europe'];
const REGION_COUNTRY_MAP = {
  USA:       ['US'],
  UK:        ['GB'],
  Canada:    ['CA'],
  Australia: ['AU'],
  Europe:    ['DE','FR','IT','ES','NL','PL','SE','NO','DK','FI','AT','BE','CH','PT','CZ','RO','HU','GR','SK','BG','HR','LT','LV','EE','SI','CY','LU','MT','IE'],
};
const FLAG = { USA:'🇺🇸', UK:'🇬🇧', Canada:'🇨🇦', Australia:'🇦🇺', Europe:'🇪🇺' };
const EXPIRY_OPTIONS = [
  { label:'24 hrs',  value:'24h',  seconds:86400   },
  { label:'48 hrs',  value:'48h',  seconds:172800  },
  { label:'72 hrs',  value:'72h',  seconds:259200  },
  { label:'7 days',  value:'7d',   seconds:604800  },
  { label:'15 days', value:'15d',  seconds:1296000 },
  { label:'30 days', value:'30d',  seconds:2592000 },
];

export default function NotificationSettings() {
  const [restApiKey, setRestApiKey]           = useState('');
  const [showKey, setShowKey]                 = useState(false);
  const [title, setTitle]                     = useState('');
  const [message, setMessage]                 = useState('');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [customRegion, setCustomRegion]       = useState('');
  const [showCustom, setShowCustom]           = useState(false);
  const [expiry, setExpiry]                   = useState('');
  const [status, setStatus]                   = useState(null);
  const [sending, setSending]                 = useState(false);
  const [sent, setSent]                       = useState(false);
  const [apiLog, setApiLog]                   = useState(null);

  const toggleRegion = (r) =>
    setSelectedRegions((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const addCustom = () => {
    const t = customRegion.trim();
    if (t && !selectedRegions.includes(t)) {
      setSelectedRegions((p) => [...p, t]);
      setCustomRegion('');
      setShowCustom(false);
    }
  };

  const buildFilters = () => {
    const known  = selectedRegions.filter((r) => REGIONS.includes(r));
    const custom = selectedRegions.filter((r) => !REGIONS.includes(r));
    const codes  = [...known.flatMap((r) => REGION_COUNTRY_MAP[r] || []), ...custom];
    if (!codes.length) return [];
    const filters = [];
    codes.forEach((c, i) => {
      if (i > 0) filters.push({ operator: 'OR' });
      filters.push({ field: 'country', relation: '=', value: c });
    });
    return filters;
  };

  const handleSend = async () => {
    setStatus(null);
    if (!restApiKey.trim())      return setStatus({ type:'error', msg:'Paste your OneSignal REST API Key.' });
    if (!title.trim())           return setStatus({ type:'error', msg:'Enter a notification title.' });
    if (!message.trim())         return setStatus({ type:'error', msg:'Enter a notification message.' });
    if (!selectedRegions.length) return setStatus({ type:'error', msg:'Select at least one target region.' });
    if (!expiry)                 return setStatus({ type:'error', msg:'Select an expiry duration.' });

    const expiryObj = EXPIRY_OPTIONS.find((o) => o.value === expiry);
    const filters   = buildFilters();
    const payload   = {
      app_id:   APP_ID,
      headings: { en: title },
      contents: { en: message },
      ttl:      expiryObj.seconds,
      ...(filters.length ? { filters } : { included_segments: ['All'] }),
    };

    setSending(true);
    setApiLog(null);
    try {
      const res  = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Basic ${restApiKey.trim()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setApiLog(JSON.stringify(data, null, 2));
      if (res.ok && data.id) {
        setSent(true);
        setStatus({ type:'success', msg:`Notification sent! ID: ${data.id}` });
        setTimeout(() => setSent(false), 4000);
      } else {
        const errMsg = data.errors?.[0] || data.error || JSON.stringify(data);
        setStatus({ type:'error', msg:`API Error: ${errMsg}` });
      }
    } catch (err) {
      setStatus({ type:'error', msg:`Network error: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setTitle(''); setMessage(''); setSelectedRegions([]);
    setExpiry(''); setStatus(null); setApiLog(null);
    setSent(false); setShowCustom(false); setCustomRegion('');
  };

  const expiryLabel = EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label;

  return (
    <div style={{ minHeight:'100vh', background:'#f0eff0', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem', fontFamily:"'Sora',sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { animation: fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        .pill { transition: all .18s cubic-bezier(.16,1,.3,1); }
        .pill:hover { transform: translateY(-2px); }
        .exp-btn { transition: all .15s ease; }
        .exp-btn:hover { transform: scale(1.04); }
        .send-btn { transition: all .2s cubic-bezier(.16,1,.3,1); }
        .send-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(0,0,0,.24) !important; }
        input:focus, textarea:focus { outline: none; border-color: #1a1a1a !important; box-shadow: 0 0 0 3px rgba(26,26,26,.08); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { 0%{transform:scale(.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        .pop { animation: pop .4s cubic-bezier(.16,1,.3,1) both; }
        .log-box { animation: fadeUp .3s ease both; }
        .key-toggle:hover { color: #555 !important; }
        textarea { resize: vertical; font-family: 'Sora', sans-serif; }
        .reset-btn:hover { background: #f0ede8 !important; color: #666 !important; }
      `}</style>

      <div className="card" style={{ width:'100%', maxWidth:500, background:'#fff', borderRadius:24, border:'1.5px solid #e4e2dd', boxShadow:'0 8px 48px rgba(0,0,0,.09)', overflow:'hidden' }}>

        <div style={{ padding:'1.75rem 2rem 1.5rem', background:'linear-gradient(150deg,#111 0%,#2a2a2a 100%)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:180, height:180, background:'radial-gradient(circle,rgba(255,255,255,.06) 0%,transparent 70%)', borderRadius:'50%' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#f97316,#ef4444)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:'0 4px 14px rgba(249,115,22,.45)' }}>🔔</div>
            <span style={{ fontFamily:"'Fira Mono',monospace", fontSize:10, color:'#666', letterSpacing:3, textTransform:'uppercase' }}>OneSignal · Push</span>
          </div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#fff', letterSpacing:-.5 }}>Send Notification</h2>
          <p style={{ margin:'4px 0 0', fontSize:12.5, color:'#888' }}>Configure, target and send in one step</p>
        </div>

        <div style={{ padding:'1.75rem 2rem' }}>

          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#999', textTransform:'uppercase', letterSpacing:1.8, marginBottom:8 }}>REST API Key</label>
            <div style={{ position:'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={restApiKey}
                onChange={(e) => setRestApiKey(e.target.value)}
                placeholder="Paste your OneSignal REST API Key…"
                style={{ width:'100%', padding:'10px 44px 10px 14px', background:'#fafaf9', border:'1.5px solid #e4e2dd', borderRadius:12, color:'#1a1a1a', fontSize:13, fontFamily:"'Fira Mono',monospace", transition:'border .15s,box-shadow .15s' }}
              />
              <button className="key-toggle" onClick={() => setShowKey(!showKey)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#ccc', padding:0, transition:'color .15s' }}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <p style={{ margin:'5px 0 0', fontSize:11.5, color:'#bbb' }}>OneSignal → Settings → Keys & IDs</p>
          </div>

          <div style={{ height:'1.5px', background:'#f0ede8', margin:'0 0 1.5rem' }}/>

          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#999', textTransform:'uppercase', letterSpacing:1.8, marginBottom:8 }}>Notification Content</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title  e.g. New Update Available"
              style={{ width:'100%', padding:'10px 14px', background:'#fafaf9', border:'1.5px solid #e4e2dd', borderRadius:'12px 12px 0 0', borderBottom:'1px solid #ece9e4', color:'#1a1a1a', fontSize:13.5, fontWeight:600, fontFamily:"'Sora',sans-serif", transition:'border .15s,box-shadow .15s' }}
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message  e.g. Check out what's new!"
              rows={3}
              style={{ width:'100%', padding:'10px 14px', background:'#fafaf9', border:'1.5px solid #e4e2dd', borderTop:'none', borderRadius:'0 0 12px 12px', color:'#444', fontSize:13, transition:'border .15s,box-shadow .15s' }}
            />
          </div>

          <div style={{ height:'1.5px', background:'#f0ede8', margin:'0 0 1.5rem' }}/>

          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#999', textTransform:'uppercase', letterSpacing:1.8 }}>Target Regions</span>
              {selectedRegions.length > 0 && (
                <span style={{ fontSize:11, fontWeight:600, color:'#f97316', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:20, padding:'2px 10px' }}>
                  {selectedRegions.length} selected
                </span>
              )}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {REGIONS.map((r) => {
                const on = selectedRegions.includes(r);
                return (
                  <button key={r} className="pill" onClick={() => toggleRegion(r)} style={{ padding:'8px 14px', borderRadius:50, border:on?'1.5px solid #1a1a1a':'1.5px solid #e4e2dd', background:on?'#1a1a1a':'#fafaf9', color:on?'#fff':'#555', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:"'Sora',sans-serif" }}>
                    {FLAG[r]} {r} {on && <span style={{ fontSize:10, opacity:.6 }}>✕</span>}
                  </button>
                );
              })}
              {selectedRegions.filter((r) => !REGIONS.includes(r)).map((r) => (
                <button key={r} className="pill" onClick={() => toggleRegion(r)} style={{ padding:'8px 14px', borderRadius:50, border:'1.5px solid #1a1a1a', background:'#1a1a1a', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:"'Sora',sans-serif" }}>
                  🌐 {r} <span style={{ fontSize:10, opacity:.6 }}>✕</span>
                </button>
              ))}
              <button className="pill" onClick={() => setShowCustom(!showCustom)} style={{ padding:'8px 14px', borderRadius:50, border:'1.5px dashed #d0cdc8', background:'transparent', color:'#aaa', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>
                + Other
              </button>
            </div>
            {showCustom && (
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <input autoFocus value={customRegion} onChange={(e) => setCustomRegion(e.target.value)} onKeyDown={(e) => e.key==='Enter' && addCustom()} placeholder="e.g. India, Brazil, UAE…" style={{ flex:1, padding:'9px 14px', background:'#fafaf9', border:'1.5px solid #e4e2dd', borderRadius:12, color:'#1a1a1a', fontSize:13, fontFamily:"'Sora',sans-serif", outline:'none' }}/>
                <button onClick={addCustom} style={{ padding:'9px 16px', background:'#1a1a1a', border:'none', borderRadius:12, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Sora',sans-serif" }}>Add</button>
              </div>
            )}
          </div>

          <div style={{ height:'1.5px', background:'#f0ede8', margin:'0 0 1.5rem' }}/>

          <div style={{ marginBottom:'1.75rem' }}>
            <span style={{ display:'block', fontSize:11, fontWeight:600, color:'#999', textTransform:'uppercase', letterSpacing:1.8, marginBottom:12 }}>Expiry Window</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {EXPIRY_OPTIONS.map((opt) => {
                const on = expiry === opt.value;
                return (
                  <button key={opt.value} className="exp-btn" onClick={() => setExpiry(opt.value)} style={{ padding:'11px 8px', borderRadius:14, border:on?'1.5px solid #1a1a1a':'1.5px solid #e4e2dd', background:on?'#1a1a1a':'#fafaf9', color:on?'#fff':'#666', fontSize:13, fontWeight:on?700:500, cursor:'pointer', fontFamily:"'Sora',sans-serif", boxShadow:on?'0 4px 14px rgba(0,0,0,.15)':'none' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(title || selectedRegions.length > 0 || expiry) && (
            <div style={{ padding:'12px 14px', borderRadius:12, background:'#fafaf9', border:'1.5px solid #f0ede8', marginBottom:'1.5rem', fontSize:12, color:'#888', fontFamily:"'Fira Mono',monospace", lineHeight:1.8 }}>
              {title   && <div>📢 <b style={{ color:'#555' }}>{title}</b></div>}
              {message && <div style={{ color:'#aaa', fontSize:11.5 }}>{message}</div>}
              {selectedRegions.length > 0 && <div>📍 {selectedRegions.join(', ')}</div>}
              {expiry  && <div>⏱ Expires in {expiryLabel}</div>}
            </div>
          )}

          {status && (
            <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:'1rem', background:status.type==='success'?'#f0fdf4':'#fef2f2', border:`1px solid ${status.type==='success'?'#bbf7d0':'#fecaca'}`, color:status.type==='success'?'#16a34a':'#dc2626', fontSize:13, fontWeight:500 }}>
              {status.type === 'success' ? '✅ ' : '⚠️ '}{status.msg}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button className="reset-btn" onClick={reset} style={{ padding:'13px 18px', borderRadius:14, border:'1.5px solid #e4e2dd', background:'#fafaf9', color:'#999', fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:"'Sora',sans-serif", transition:'all .15s' }}>
              Reset
            </button>
            <button className="send-btn" onClick={handleSend} disabled={sending || sent} style={{ flex:1, padding:'13px 18px', borderRadius:14, border:'none', background:sent?'linear-gradient(135deg,#16a34a,#15803d)':sending?'#d1cfc9':'linear-gradient(135deg,#1a1a1a,#333)', color:sending?'#999':'#fff', fontSize:13.5, fontWeight:700, cursor:sending?'not-allowed':'pointer', fontFamily:"'Sora',sans-serif", boxShadow:sent||sending?'none':'0 6px 22px rgba(0,0,0,.18)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {sending
                ? <><span style={{ width:14, height:14, border:'2px solid #bbb', borderTopColor:'#555', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> Sending…</>
                : sent
                ? <span className="pop">✓ Sent!</span>
                : 'Save & Send →'}
            </button>
          </div>

          {apiLog && (
            <div className="log-box" style={{ marginTop:'1.5rem' }}>
              <p style={{ fontSize:11, fontWeight:600, color:'#bbb', textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 6px' }}>API Response</p>
              <pre style={{ margin:0, padding:'12px 14px', background:'#111', borderRadius:12, color:'#7dd3fc', fontSize:11.5, fontFamily:"'Fira Mono',monospace", overflowX:'auto', lineHeight:1.6 }}>{apiLog}</pre>
            </div>
          )}

        </div>

        <div style={{ padding:'0.9rem 2rem', borderTop:'1.5px solid #f0ede8', background:'#fafaf9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Fira Mono',monospace", fontSize:10, color:'#ccc' }}>APP ID</span>
          <span style={{ fontFamily:"'Fira Mono',monospace", fontSize:10, color:'#ccc' }}>fc172999···bd035</span>
        </div>

      </div>
    </div>
  );
