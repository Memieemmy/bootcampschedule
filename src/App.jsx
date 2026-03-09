import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ── Default color (fallback for new modules) ──────────────────────────────────
const DEFAULT_COLOR = {
  l: { bg:"#F5F5F5", bd:"#DDD", tx:"#555", dot:"#AAA" },
  d: { bg:"#1E2035", bd:"#3A3E5A", tx:"#9090B8", dot:"#6060A0" },
};

// ── Day palette ───────────────────────────────────────────────────────────────
const DAY_L = {
  Mon: { bg:"#FFFDF0", ac:"#FFE566", hd:"#FFF7BB", txt:"#5A4800" },
  Tue: { bg:"#FFF5F8", ac:"#FFB3CC", hd:"#FFD6E7", txt:"#7A1A35" },
  Wed: { bg:"#F2FFF9", ac:"#90E0B0", hd:"#C5F0D8", txt:"#0D5C30" },
  Thu: { bg:"#F5F0FF", ac:"#C4ADFF", hd:"#DDD4FF", txt:"#3D1A99" },
  Fri: { bg:"#EFF7FF", ac:"#A8D4FF", hd:"#CCE7FF", txt:"#1A4D8C" },
};

const DAY_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const DAY_KEY  = ["Mon","Tue","Wed","Thu","Fri"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function isWeekend(d){return d.getDay()===0||d.getDay()===6;}
function getWeekdays(s,e){const a=[];let c=new Date(s);while(c<=e){if(!isWeekend(c))a.push(new Date(c));c=addDays(c,1);}return a;}
function groupByWeek(days){const w=[];for(let i=0;i<days.length;i+=5)w.push(days.slice(i,i+5));return w;}
function dkey(d){return d.toISOString().slice(0,10);}
function shortDate(d){
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  const yy=String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}
function fmtFull(d){return d.toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});}

// ── CSV ───────────────────────────────────────────────────────────────────────
function buildCSV(wdays, getSessFn) {
  const rows = [["Week","Date","Day","Start Time","End Time","Session","Module","Topic","Category","Note","Check"]];
  groupByWeek(wdays).forEach((week,wi)=>{
    week.forEach(date=>{
      const dayIdx=date.getDay()-1;
      const dateKey=dkey(date);
      getSessFn(dateKey).forEach((sess,si)=>{
        if(!sess.module&&!sess.topic) return;
        rows.push([`Week ${wi+1}`,fmtFull(date),DAY_FULL[dayIdx]||"",sess.start_time||"",sess.end_time||"",`Session ${si+1}`,sess.module||"",sess.topic||"",sess.module||"","",""]);
      });
    });
  });
  return rows.map(r=>r.map(c=>{const s=String(c);return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:`${s}`;}).join(",")).join("\n");
}
function downloadCSV(content,filename){
  const blob=new Blob(["\uFEFF"+content],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const dark = false;

  // ── DB State ──────────────────────────────────────────────────────────────
  const [dbModules, setDbModules]       = useState([]);
  const [dbTopics, setDbTopics]         = useState([]);
  const [dbCohort, setDbCohort]         = useState(null);
  const [schedEntries, setSchedEntries] = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── UI State ──────────────────────────────────────────────────────────────
  const [page,setPage]       = useState("schedule");
  const [cohort,setCohort]   = useState("FSD11");
  const [sd,setSd]           = useState("2026-05-18");
  const [ed,setEd]           = useState("2026-08-28");
  const [newMod,setNewMod]   = useState("");
  const [newTopics,setNewTopics] = useState({});
  const [openMod,setOpenMod] = useState(null);
  const [csvFlash,setCsvFlash] = useState(false);
  const [editingModule,setEditingModule] = useState(null);
  const [editingTopic,setEditingTopic]   = useState(null);
  const [editDraft,setEditDraft] = useState("");

  const isFirstRender = useRef(true);

  // ── Derived: modules object { name: [topicText, ...] } ───────────────────
  const modules = useMemo(() => {
    const result = {};
    dbModules.forEach(m => {
      result[m.name] = dbTopics
        .filter(t => t.module_id === m.id)
        .sort((a, b) => a.position - b.position)
        .map(t => t.text);
    });
    return result;
  }, [dbModules, dbTopics]);

  const start  = useMemo(()=>sd?new Date(sd):null,[sd]);
  const end    = useMemo(()=>ed?new Date(ed):null,[ed]);
  const wdays  = useMemo(()=>start&&end&&end>=start?getWeekdays(start,end):[],[start,end]);
  const weeks  = useMemo(()=>groupByWeek(wdays),[wdays]);
  const totalDays    = wdays.length;
  const totalTopics  = useMemo(()=>Object.values(modules).reduce((s,t)=>s+t.length,0),[modules]);
  const scheduledTopics = useMemo(()=>schedEntries.filter(e=>e.module_id||e.topic_id).length,[schedEntries]);
  const progressPct  = totalTopics>0?Math.round(scheduledTopics/totalTopics*100):0;

  // ── Theme ─────────────────────────────────────────────────────────────────
  const ACCENT = "#1A237E";
  const ACCENT_DIM = "#151B60";
  const ACCENT_SOFT = "#E8EAF6";
  const T = {
    bg:"#FFFFFF",bg2:"#F9FAFB",surf:"#FFFFFF",surf2:"#F9FAFB",
    brd:"#E5E7EB",brd2:"#D1D5DB",txt:"#111827",txtSub:"#4B5563",
    txtMuted:"#9CA3AF",inBg:"#FFFFFF",accent:ACCENT,accentDim:ACCENT_DIM,
    accentTx:"#FFFFFF",tagBg:ACCENT_SOFT,remBtn:"#D1D5DB",
  };
  const DC = DAY_L;

  function mc(modName) {
    const modObj = dbModules.find(m => m.name === modName);
    const c = modObj?.color_config;
    if (!c) return DEFAULT_COLOR.l;
    return c.l || DEFAULT_COLOR.l;
  }

  // ── Load helpers ──────────────────────────────────────────────────────────
  const loadModules = useCallback(async () => {
    const [{ data: mods }, { data: tops }] = await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('topics').select('*').order('position'),
    ]);
    if (mods) setDbModules(mods);
    if (tops) setDbTopics(tops);
  }, []);

  const syncCohort = useCallback(async (name, startDate, endDate) => {
    const { data: existing } = await supabase
      .from('cohorts').select('*').eq('name', name).maybeSingle();
    if (existing) {
      await supabase.from('cohorts')
        .update({ start_date: startDate, end_date: endDate })
        .eq('id', existing.id);
      const updated = { ...existing, start_date: startDate, end_date: endDate };
      setDbCohort(updated);
      return updated;
    } else {
      const { data: newC } = await supabase.from('cohorts')
        .insert({ name, start_date: startDate, end_date: endDate })
        .select().single();
      setDbCohort(newC);
      return newC;
    }
  }, []);

  const loadSchedule = useCallback(async (cohortId) => {
    if (!cohortId) return;
    const { data } = await supabase.from('schedule_entries')
      .select('*').eq('cohort_id', cohortId)
      .order('date').order('session_index');
    if (data) setSchedEntries(data);
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadModules();
      const c = await syncCohort("FSD11", "2026-05-18", "2026-08-28");
      if (c) await loadSchedule(c.id);
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!sd || !ed) return;
    async function sync() {
      const c = await syncCohort(cohort, sd, ed);
      if (c) await loadSchedule(c.id);
    }
    sync();
  }, [cohort, sd, ed]); // eslint-disable-line

  // ── getSess ───────────────────────────────────────────────────────────────
  function getSess(dk) {
    const entries = schedEntries
      .filter(e => e.date === dk)
      .sort((a, b) => a.session_index - b.session_index);
    if (entries.length === 0) {
      return [
        { id:null, module:'', topic:'', start_time:'', end_time:'' },
        { id:null, module:'', topic:'', start_time:'', end_time:'' },
      ];
    }
    return entries.map(e => ({
      id:         e.id,
      module:     dbModules.find(m => m.id === e.module_id)?.name || '',
      topic:      dbTopics.find(t => t.id === e.topic_id)?.text   || '',
      start_time: e.start_time?.slice(0,5) || '',
      end_time:   e.end_time?.slice(0,5)   || '',
    }));
  }

  // ── Session CRUD ──────────────────────────────────────────────────────────
  async function setSess(dateKey, idx, field, val) {
    if (!dbCohort) return;
    const sessionIndex = idx + 1;
    const existingEntry = schedEntries.find(
      e => e.date === dateKey && e.session_index === sessionIndex
    );
    let updates = {};
    if (field === 'module') {
      const modObj = val ? dbModules.find(m => m.name === val) : null;
      updates = { module_id: modObj?.id || null, topic_id: null };
    } else if (field === 'topic') {
      const modId = existingEntry?.module_id;
      const topicObj = val ? dbTopics.find(t => t.text === val && t.module_id === modId) : null;
      updates = { topic_id: topicObj?.id || null };
    } else if (field === 'start_time' || field === 'end_time') {
      updates = { [field]: val || null };
    }
    await supabase.from('schedule_entries').upsert(
      { cohort_id: dbCohort.id, date: dateKey, session_index: sessionIndex, ...updates },
      { onConflict: 'cohort_id,date,session_index' }
    );
    await loadSchedule(dbCohort.id);
  }

  async function addSess(dk) {
    if (!dbCohort) return;
    const dbEntries = schedEntries.filter(e => e.date === dk);
    const currentCount = dbEntries.length === 0 ? 2 : dbEntries.length;
    if (currentCount >= 4) return;
    await supabase.from('schedule_entries').insert({
      cohort_id: dbCohort.id, date: dk, session_index: currentCount + 1,
    });
    await loadSchedule(dbCohort.id);
  }

  async function rmSess(dk, idx) {
    if (!dbCohort) return;
    const entry = schedEntries.find(e => e.date === dk && e.session_index === idx + 1);
    if (!entry) return;
    await supabase.from('schedule_entries').delete().eq('id', entry.id);
    const toReindex = schedEntries
      .filter(e => e.date === dk && e.session_index > idx + 1)
      .sort((a, b) => a.session_index - b.session_index);
    for (const e of toReindex) {
      await supabase.from('schedule_entries')
        .update({ session_index: e.session_index - 1 }).eq('id', e.id);
    }
    await loadSchedule(dbCohort.id);
  }

  // ── Module CRUD ───────────────────────────────────────────────────────────
  async function addModule() {
    const n = newMod.trim();
    if (!n || dbModules.find(m => m.name === n)) return;
    const { data } = await supabase.from('modules')
      .insert({ name: n, color_config: DEFAULT_COLOR }).select().single();
    if (data) setDbModules(prev => [...prev, data]);
    setNewMod("");
  }

  async function rmModule(mod) {
    const modObj = dbModules.find(m => m.name === mod);
    if (!modObj) return;
    await supabase.from('modules').delete().eq('id', modObj.id);
    setDbModules(prev => prev.filter(m => m.id !== modObj.id));
    setDbTopics(prev => prev.filter(t => t.module_id !== modObj.id));
  }

  async function updateModuleName(oldName, newName) {
    const n = (newName||"").trim();
    if (!n || n === oldName || dbModules.find(m => m.name === n)) return;
    const modObj = dbModules.find(m => m.name === oldName);
    if (!modObj) return;
    await supabase.from('modules').update({ name: n }).eq('id', modObj.id);
    setDbModules(prev => prev.map(m => m.id === modObj.id ? {...m, name: n} : m));
    setEditingModule(null); setEditDraft("");
    if (openMod === oldName) setOpenMod(n);
  }

  // ── Topic CRUD ────────────────────────────────────────────────────────────
  async function addTopic(mod) {
    const t = (newTopics[mod]||"").trim();
    if (!t) return;
    const modObj = dbModules.find(m => m.name === mod);
    if (!modObj) return;
    const position = dbTopics.filter(tp => tp.module_id === modObj.id).length + 1;
    const { data } = await supabase.from('topics')
      .insert({ module_id: modObj.id, text: t, position }).select().single();
    if (data) setDbTopics(prev => [...prev, data]);
    setNewTopics(p => ({...p, [mod]: ""}));
  }

  async function rmTopic(mod, i) {
    const modObj = dbModules.find(m => m.name === mod);
    if (!modObj) return;
    const topicsForMod = dbTopics
      .filter(t => t.module_id === modObj.id)
      .sort((a, b) => a.position - b.position);
    const topicToRemove = topicsForMod[i];
    if (!topicToRemove) return;
    await supabase.from('topics').delete().eq('id', topicToRemove.id);
    setDbTopics(prev => prev.filter(t => t.id !== topicToRemove.id));
  }

  async function updateTopic(mod, index, newText) {
    const t = (newText||"").trim();
    if (!t) return;
    const modObj = dbModules.find(m => m.name === mod);
    if (!modObj) return;
    const topicsForMod = dbTopics
      .filter(tp => tp.module_id === modObj.id)
      .sort((a, b) => a.position - b.position);
    const topicObj = topicsForMod[index];
    if (!topicObj) return;
    await supabase.from('topics').update({ text: t }).eq('id', topicObj.id);
    setDbTopics(prev => prev.map(tp => tp.id === topicObj.id ? {...tp, text: t} : tp));
    setEditingTopic(null); setEditDraft("");
  }

  function handleExportCSV() {
    downloadCSV(buildCSV(wdays, getSess), `Bootcamp_Schedule_${cohort}_${sd}_to_${ed}.csv`);
    setCsvFlash(true); setTimeout(()=>setCsvFlash(false), 2200);
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle = {background:T.surf,borderRadius:16,border:`1px solid ${T.brd}`,padding:"16px 18px"};
  const inputStyle = {width:"100%",padding:"9px 13px",borderRadius:10,border:`1.5px solid ${T.brd2}`,fontSize:13,color:T.txt,background:T.inBg,outline:"none"};
  const labelStyle = {fontSize:9,color:T.txtSub,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,display:"block"};

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",fontFamily:"'Inter','Sarabun',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{color:ACCENT,fontWeight:700,fontSize:18}}>กำลังโหลดข้อมูล...</div>
        <div style={{color:"#9CA3AF",fontSize:13,marginTop:8}}>กำลังเชื่อมต่อ Supabase</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",width:"100%",background:T.bg,color:T.txt,fontFamily:"'Inter','Sarabun','Noto Sans Thai',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap');
        html,body{width:100%;margin:0;padding:0;overflow-x:hidden;}
        #root{width:100%;min-height:100vh;}
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px;}
        .hov-lift{transition:transform .15s,box-shadow .15s;}
        .hov-lift:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.12);}
        .modc{transition:box-shadow .2s;}
        .modc:hover{box-shadow:0 4px 20px rgba(0,0,0,.1);}
        select option{background:white;color:#1A1540;}
        button{cursor:pointer;border:none;}
        .btn-accent{transition:all .15s;}
        .btn-accent:hover{opacity:.88;transform:scale(1.02);}
        .btn-ghost{transition:all .15s;}
        .btn-ghost:hover{opacity:.75;}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}
        .pop{animation:pop .3s ease;}
        input[type=time]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;}
      `}</style>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header style={{
        background:"rgba(255,255,255,.96)",backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${T.brd}`,position:"sticky",top:0,zIndex:200,
        boxShadow:"0 2px 16px rgba(0,0,0,.06)",
      }}>
        <div style={{width:"100%",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:16}}>🚀</span>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:T.txt,letterSpacing:"-.4px",lineHeight:1.1}}>Bootcamp Schedule</div>
              <div style={{fontSize:10,color:T.txtSub,fontWeight:500,marginTop:1}}>TechUp · {cohort}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <nav style={{display:"flex",gap:4,background:T.surf2,borderRadius:12,padding:4,border:`1px solid ${T.brd}`}}>
              {[{id:"schedule",label:"📅 ตารางเรียน"},{id:"subjects",label:"📚 รายวิชา"}].map(p=>(
                <button key={p.id} className="btn-ghost" onClick={()=>setPage(p.id)} style={{
                  padding:"6px 16px",borderRadius:9,fontWeight:600,fontSize:12,
                  background:page===p.id?T.accent:"transparent",
                  color:page===p.id?T.accentTx:T.txtSub,
                }}>{p.label}</button>
              ))}
            </nav>
            {wdays.length>0&&(
              <button className={`btn-accent ${csvFlash?"pop":""}`} onClick={handleExportCSV} style={{
                display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:10,
                background:csvFlash?T.accentDim:T.accent,color:T.accentTx,fontWeight:700,fontSize:12,
                boxShadow:"0 2px 8px rgba(0,0,0,.12)",
              }}>
                <span>{csvFlash?"✅":"⬇"}</span>
                {csvFlash?"ดาวน์โหลดแล้ว!":"Export CSV"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══ SCHEDULE PAGE ════════════════════════════════════════════════════ */}
      {page==="schedule"?(
        <main style={{width:"100%",padding:"24px",boxSizing:"border-box"}}>

          {/* Dashboard */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginBottom:24}}>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>🎓 รุ่น / Cohort</label>
              <select value={cohort} onChange={e=>setCohort(e.target.value)} style={{...inputStyle,fontSize:16,fontWeight:700}}>
                {["FSD11","FSD12","FSD13"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📌 วันเริ่มต้น</label>
              <input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{...inputStyle,borderColor:"#FFE566"}}/>
            </div>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>🏁 วันสิ้นสุด</label>
              <input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{...inputStyle,borderColor:"#90E0B0"}}/>
            </div>
            <div style={{...cardStyle,background:"linear-gradient(135deg,#FFF4ED,#FFE1D2)",borderColor:"#FED7C3"}}>
              <label style={{...labelStyle,color:T.accent}}>📊 วันเรียนทั้งหมด</label>
              <div style={{fontSize:38,fontWeight:800,color:T.accent,lineHeight:1}}>{totalDays}</div>
              <div style={{fontSize:10,color:"#9A3412",marginTop:4}}>วัน (ไม่รวม เสาร์–อาทิตย์)</div>
            </div>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📚 วิชาทั้งหมด</label>
              <div style={{fontSize:36,fontWeight:800,color:"#006699",lineHeight:1}}>{totalTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>หัวข้อใน {Object.keys(modules).length} module</div>
            </div>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>✅ จัดตารางแล้ว</label>
              <div style={{fontSize:36,fontWeight:800,color:"#0D6035",lineHeight:1}}>{scheduledTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>จาก {totalTopics} หัวข้อทั้งหมด</div>
            </div>
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📈 ความคืบหน้า</label>
              <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                <span style={{fontSize:34,fontWeight:800,color:"#9B1A3A",lineHeight:1}}>{progressPct}</span>
                <span style={{fontSize:14,fontWeight:700,color:"#9B1A3A"}}>%</span>
              </div>
              <div style={{marginTop:10,height:5,borderRadius:3,background:T.brd2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,borderRadius:3,background:`linear-gradient(90deg,#FDBA74,${T.accent})`,transition:"width .6s ease"}}/>
              </div>
              <div style={{fontSize:9,color:T.txtMuted,marginTop:5}}>{scheduledTopics} / {totalTopics} หัวข้อ</div>
            </div>
          </div>

          {/* Calendar */}
          {weeks.length===0&&(
            <div style={{textAlign:"center",color:T.txtMuted,padding:"80px 20px",fontSize:15}}>
              <div style={{fontSize:40,marginBottom:12}}>🗓</div>
              กรุณาเลือกวันเริ่มต้นและวันสิ้นสุด
            </div>
          )}

          {weeks.map((week,wi)=>{
            const firstDay=week[0], lastDay=week[week.length-1];
            const rangeStr=`${shortDate(firstDay)} – ${shortDate(lastDay)}`;
            return (
              <div key={wi} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,background:"white",border:`1px solid ${T.brd}`,borderRadius:12,padding:"5px 14px 5px 10px",flexShrink:0}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:T.accent,flexShrink:0}}/>
                    <span style={{fontWeight:800,fontSize:13,color:T.txt}}>Week {wi+1}</span>
                    <span style={{fontSize:11,color:T.txtSub,fontWeight:500,borderLeft:`1px solid ${T.brd}`,paddingLeft:9,marginLeft:1}}>{rangeStr}</span>
                  </div>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,${T.brd},transparent)`}}/>
                </div>

                <div style={{display:"grid",gridTemplateColumns:`repeat(${week.length},1fr)`,gap:10}}>
                  {week.map((date,di)=>{
                    const dayIdx=date.getDay()-1;
                    const dKeyStr=DAY_KEY[dayIdx]||"Mon";
                    const dc=DC[dKeyStr];
                    const dateKey=dkey(date);
                    const sessions=getSess(dateKey);
                    return (
                      <div key={di} style={{background:dc.bg,borderRadius:14,border:`1.5px solid ${dc.ac}66`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                        {/* Day header */}
                        <div style={{background:dc.hd,padding:"8px 12px",borderBottom:`1px solid ${dc.ac}55`}}>
                          <div style={{fontSize:9,fontWeight:700,color:dc.txt,textTransform:"uppercase",letterSpacing:.8,opacity:.7}}>{DAY_FULL[dayIdx]}</div>
                          <div style={{fontSize:14,fontWeight:800,color:dc.txt}}>
                            {date.toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit"})}
                          </div>
                        </div>

                        {/* Sessions */}
                        <div style={{padding:"7px 7px 9px"}}>
                          {sessions.map((sess,si)=>{
                            const isFirst=si===0;
                            const col=mc(sess.module);
                            const cardBg=isFirst?"#FFFFFF":(sess.module?col.bg:"#FFFFFF");
                            const cardBd=isFirst?"#EBEBF5":(sess.module?col.bd:"#EBEBF5");
                            const selBg=isFirst?"#F8F8FF":(sess.module?col.bg:"#F8F8FF");
                            const selBd=isFirst?"#D5D0EE":(sess.module?col.bd:"#D5D0EE");
                            const selTx=isFirst?T.txt:(sess.module?col.tx:T.txtMuted);
                            return (
                              <div key={si} className="hov-lift" style={{
                                background:cardBg,borderRadius:10,border:`1.5px solid ${cardBd}`,
                                padding:"8px 9px 7px",marginBottom:si<sessions.length-1?6:0,position:"relative",
                              }}>
                                <div style={{fontSize:8,fontWeight:700,color:T.txtMuted,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>S{si+1}</div>

                                {/* Module */}
                                <select value={sess.module} onChange={e=>setSess(dateKey,si,"module",e.target.value)} style={{
                                  width:"100%",padding:"4px 6px",borderRadius:7,
                                  border:`1.5px solid ${selBd}`,fontSize:10,fontWeight:600,
                                  color:sess.module?selTx:T.txtMuted,background:selBg,outline:"none",marginBottom:4,
                                }}>
                                  <option value="">— Module —</option>
                                  {Object.keys(modules).map(m=><option key={m} value={m}>{m}</option>)}
                                </select>

                                {/* Topic */}
                                {sess.module&&(
                                  <select value={sess.topic} onChange={e=>setSess(dateKey,si,"topic",e.target.value)} style={{
                                    width:"100%",padding:"4px 6px",borderRadius:7,
                                    border:`1.5px solid ${isFirst?"#D5D0EE":col.bd}`,
                                    fontSize:9,color:isFirst?T.txt:col.tx,
                                    background:"white",outline:"none",marginBottom:4,
                                  }}>
                                    <option value="">— หัวข้อ —</option>
                                    {(modules[sess.module]||[]).map((t,ti)=><option key={ti} value={t}>{t}</option>)}
                                  </select>
                                )}

                                {/* ⏰ Time inputs */}
                                <div style={{display:"flex",alignItems:"center",gap:3,marginTop:2}}>
                                  <input
                                    type="time" value={sess.start_time}
                                    onChange={e=>setSess(dateKey,si,"start_time",e.target.value)}
                                    style={{flex:1,padding:"3px 5px",borderRadius:6,border:`1px solid ${col.bd||T.brd}`,fontSize:9,outline:"none",color:T.txtSub,background:"white"}}
                                  />
                                  <span style={{fontSize:9,color:T.txtMuted}}>–</span>
                                  <input
                                    type="time" value={sess.end_time}
                                    onChange={e=>setSess(dateKey,si,"end_time",e.target.value)}
                                    style={{flex:1,padding:"3px 5px",borderRadius:6,border:`1px solid ${col.bd||T.brd}`,fontSize:9,outline:"none",color:T.txtSub,background:"white"}}
                                  />
                                </div>

                                {/* Remove */}
                                {sess.id && sessions.length>1&&(
                                  <button onClick={()=>rmSess(dateKey,si)} className="btn-ghost" style={{
                                    position:"absolute",top:5,right:5,background:"none",fontSize:10,color:T.txtMuted,padding:2,
                                  }}>✕</button>
                                )}
                              </div>
                            );
                          })}
                          {sessions.length<4&&(
                            <button className="btn-ghost" onClick={()=>addSess(dateKey)} style={{
                              width:"100%",marginTop:6,padding:"4px",borderRadius:8,
                              border:`1.5px dashed ${dc.ac}`,background:"transparent",
                              fontSize:10,color:"#AAA",fontWeight:500,
                            }}>+ Session</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Floating export */}
          {scheduledTopics>0&&(
            <div style={{position:"fixed",bottom:28,right:28,zIndex:300}}>
              <button className={`btn-accent ${csvFlash?"pop":""}`} onClick={handleExportCSV} style={{
                display:"flex",alignItems:"center",gap:8,padding:"12px 22px",borderRadius:14,
                background:csvFlash?T.accentDim:T.accent,color:T.accentTx,fontWeight:700,fontSize:13,
                boxShadow:"0 4px 20px rgba(0,0,0,.18)",border:"none",
              }}>
                <span style={{fontSize:15}}>{csvFlash?"✅":"⬇"}</span>
                {csvFlash?"ดาวน์โหลดแล้ว!":"Export CSV"}
              </button>
            </div>
          )}
        </main>

      ):(
        /* ══ SUBJECTS PAGE ════════════════════════════════════════════════════ */
        <main style={{width:"100%",padding:"24px",boxSizing:"border-box"}}>
          <div style={{marginBottom:22}}>
            <h2 style={{fontWeight:800,fontSize:22,color:T.txt,marginBottom:4,letterSpacing:"-.4px"}}>📚 รายวิชาทั้งหมด</h2>
            <p style={{fontSize:12,color:T.txtSub}}>เพิ่ม Module และหัวข้อย่อย — จะปรากฏในตารางเรียนทันที</p>
          </div>

          <div style={{display:"flex",gap:10,marginBottom:18}}>
            {[
              {l:"Module ทั้งหมด",v:Object.keys(modules).length,c:T.accent},
              {l:"หัวข้อทั้งหมด",v:totalTopics,c:"#006699"},
              {l:"จัดตารางแล้ว",v:scheduledTopics,c:"#0D6035"},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,...cardStyle}}>
                <div style={{fontSize:9,color:T.txtSub,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{s.l}</div>
                <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>

          <div style={{...cardStyle,display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
            <input value={newMod} onChange={e=>setNewMod(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addModule()}
              placeholder="ชื่อ Module ใหม่…" style={{...inputStyle,flex:1,fontSize:13}}/>
            <button onClick={addModule} className="btn-accent" style={{padding:"9px 20px",borderRadius:10,background:T.accent,color:T.accentTx,fontWeight:700,fontSize:13}}>
              + เพิ่ม Module
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
            {Object.entries(modules).map(([mod,topics])=>{
              const col=mc(mod);
              const isOpen=openMod===mod;
              return (
                <div key={mod} className="modc" style={{background:col.bg,borderRadius:14,border:`1.5px solid ${col.bd}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                  <div onClick={()=>!editingModule&&setOpenMod(isOpen?null:mod)} style={{
                    padding:"12px 14px",display:"flex",alignItems:"center",
                    justifyContent:"space-between",cursor:editingModule?"default":"pointer",
                    borderBottom:isOpen?`1px solid ${col.bd}`:"none",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:col.dot,flexShrink:0}}/>
                      {editingModule===mod?(
                        <>
                          <input value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                            onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")updateModuleName(mod,editDraft);if(e.key==="Escape")setEditingModule(null);}}
                            onClick={e=>e.stopPropagation()}
                            style={{flex:1,minWidth:0,padding:"4px 8px",borderRadius:8,border:`1.5px solid ${col.bd}`,fontSize:12,fontWeight:600,outline:"none",background:"white",color:col.tx}}
                            autoFocus/>
                          <button onClick={e=>{e.stopPropagation();updateModuleName(mod,editDraft);}} className="btn-accent" style={{padding:"4px 10px",borderRadius:8,background:T.accent,color:T.accentTx,fontSize:11,fontWeight:600}}>บันทึก</button>
                          <button onClick={e=>{e.stopPropagation();setEditingModule(null);setEditDraft("");}} className="btn-ghost" style={{padding:"4px 8px",fontSize:11,color:T.txtSub}}>ยกเลิก</button>
                        </>
                      ):(
                        <>
                          <span style={{fontWeight:700,fontSize:13,color:col.tx}}>{mod}</span>
                          <span style={{fontSize:10,color:col.tx,opacity:.6,background:col.bd+"55",borderRadius:20,padding:"1px 7px"}}>{topics.length}</span>
                          <button onClick={e=>{e.stopPropagation();setEditingModule(mod);setEditDraft(mod);}} className="btn-ghost" style={{background:"none",color:T.accent,fontSize:11,fontWeight:600,padding:"2px 6px"}}>แก้ไข</button>
                        </>
                      )}
                    </div>
                    <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                      <span style={{fontSize:10,color:col.tx,opacity:.5}}>{isOpen?"▲":"▼"}</span>
                      <button onClick={e=>{e.stopPropagation();rmModule(mod);}} className="btn-ghost" style={{background:"none",color:T.remBtn,fontSize:13}}>🗑</button>
                    </div>
                  </div>
                  {isOpen&&(
                    <div style={{padding:"10px 14px"}}>
                      {topics.map((t,ti)=>(
                        <div key={ti} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:col.dot,marginTop:6,flexShrink:0}}/>
                          {editingTopic&&editingTopic.mod===mod&&editingTopic.index===ti?(
                            <>
                              <input value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Enter")updateTopic(mod,ti,editDraft);if(e.key==="Escape")setEditingTopic(null);}}
                                style={{flex:1,minWidth:0,padding:"4px 8px",borderRadius:6,border:`1.5px solid ${col.bd}`,fontSize:11,outline:"none",background:"white",color:col.tx}}
                                autoFocus/>
                              <button onClick={()=>updateTopic(mod,ti,editDraft)} className="btn-accent" style={{padding:"3px 8px",borderRadius:6,background:col.dot,color:"white",fontSize:10,fontWeight:600}}>บันทึก</button>
                              <button onClick={()=>{setEditingTopic(null);setEditDraft("");}} className="btn-ghost" style={{padding:"3px 6px",fontSize:10,color:T.txtSub}}>ยกเลิก</button>
                            </>
                          ):(
                            <>
                              <span style={{flex:1,fontSize:11,color:col.tx,lineHeight:1.6}}>{t}</span>
                              <button onClick={()=>{setEditingTopic({mod,index:ti});setEditDraft(t);}} className="btn-ghost" style={{background:"none",color:T.accent,fontSize:10,fontWeight:600}}>แก้ไข</button>
                              <button onClick={()=>rmTopic(mod,ti)} className="btn-ghost" style={{background:"none",color:T.txtMuted,fontSize:11}}>✕</button>
                            </>
                          )}
                        </div>
                      ))}
                      <div style={{display:"flex",gap:7,marginTop:10}}>
                        <input value={newTopics[mod]||""} onChange={e=>setNewTopics(p=>({...p,[mod]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTopic(mod)}
                          placeholder="เพิ่มหัวข้อใหม่…"
                          style={{flex:1,padding:"6px 10px",borderRadius:9,border:`1.5px solid ${col.bd}`,fontSize:11,outline:"none",background:"white",color:col.tx}}/>
                        <button onClick={()=>addTopic(mod)} className="btn-accent" style={{padding:"6px 12px",borderRadius:9,background:col.dot,color:"white",fontWeight:700,fontSize:12}}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
