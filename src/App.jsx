import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabase";

import { useModules }  from "./hooks/useModules";
import { useCohort }   from "./hooks/useCohort";
import { useSchedule } from "./hooks/useSchedule";

import { getWeekdays, groupByWeek } from "./utils/dateHelpers";
import { buildCSV, downloadCSV }    from "./utils/csvExport";

import { SchedulePage } from "./pages/schedule/SchedulePage";
import { SubjectsPage } from "./pages/subjects/SubjectsPage";
import { ConfirmModal } from "./components/ConfirmModal";

import { T, ACCENT, ACCENT_DIM } from "./constants/theme";

export default function App() {
  // ── Hooks ────────────────────────────────────────────────────────────────
  const {
    dbModules, dbTopics, loadModules,
    getTopicObjAt, getModuleColor,
    addModule, removeModule, updateModuleName,
    addTopic, removeTopic, updateTopic,
    restoreDefaults,
  } = useModules();

  const { dbCohort, syncCohort } = useCohort();

  const {
    schedEntries, loadSchedule,
    getSess, setSess, addSess, rmSess,
  } = useSchedule(dbModules, dbTopics);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [page, setPage]         = useState("schedule");
  const [cohort, setCohort]     = useState("FSD11");
  const [sd, setSd] = useState(() => localStorage.getItem("sd") || "2026-05-18");
  const [ed, setEd] = useState(() => localStorage.getItem("ed") || "2026-10-09");
  const [loading, setLoading]   = useState(true);
  const [csvFlash, setCsvFlash] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const isFirstRender = useRef(true);
  useEffect(() => { localStorage.setItem("sd", sd); }, [sd]);
  useEffect(() => { localStorage.setItem("ed", ed); }, [ed]);

useEffect(() => { localStorage.setItem("sd", sd); }, [sd]);
useEffect(() => { localStorage.setItem("ed", ed); }, [ed]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const modules = useMemo(() => {
    const r = {};
    dbModules.forEach(m => {
      r[m.name] = dbTopics
        .filter(t => t.module_id === m.id)
        .sort((a, b) => a.position - b.position)
        .map(t => t.text);
    });
    return r;
  }, [dbModules, dbTopics]);

  const start  = useMemo(() => sd ? new Date(sd) : null, [sd]);
  const end    = useMemo(() => ed ? new Date(ed) : null, [ed]);
  const wdays  = useMemo(() => start && end && end >= start ? getWeekdays(start, end) : [], [start, end]);
  const weeks  = useMemo(() => groupByWeek(wdays), [wdays]);

  const totalDays       = wdays.length;
  const totalTopics     = useMemo(() => Object.values(modules).reduce((s, t) => s + t.length, 0), [modules]);
  const scheduledTopics = useMemo(() => schedEntries.filter(e => e.module_id || e.topic_id).length, [schedEntries]);
  const progressPct     = totalTopics > 0 ? Math.round(scheduledTopics / totalTopics * 100) : 0;

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true);
      await supabase.from('modules').upsert(
        { name:'Holiday', color_config:{l:{bg:"#F9FAFB",bd:"#D1D5DB",tx:"#9CA3AF",dot:"#9CA3AF"},d:{bg:"#1E2030",bd:"#3A3E5A",tx:"#6B7280",dot:"#4B5563"}} },
        { onConflict:'name' }
      );
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  function askConfirm(title, desc, onConfirm) {
    setConfirmModal({ title, desc, onConfirm });
  }

  function handleExportCSV() {
    downloadCSV(buildCSV(wdays, getSess), `Bootcamp_Schedule_${cohort}_${sd}_to_${ed}.csv`);
    setCsvFlash(true);
    setTimeout(() => setCsvFlash(false), 2200);
  }

  // Wrappers ที่ส่ง cohortId ให้ schedule hooks
  const boundSetSess = (dk, idx, field, val) => setSess(dbCohort?.id, dk, idx, field, val);
  const boundAddSess = (dk) => addSess(dbCohort?.id, dk);
  const boundRmSess  = (dk, idx) => rmSess(dbCohort?.id, dk, idx);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#fff", fontFamily:"'Inter','Sarabun',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
        <div style={{ color:ACCENT, fontWeight:700, fontSize:18 }}>Loading...</div>
        <div style={{ color:"#9CA3AF", fontSize:13, marginTop:8 }}>Connecting to Supabase</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", width:"100%", background:T.bg, color:T.txt, fontFamily:"'Inter','Sarabun','Noto Sans Thai',sans-serif" }}>
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
        .modc{transition:box-shadow .2s,border-color .15s;}
        .modc:hover{box-shadow:0 3px 16px rgba(0,0,0,.08);}
        select option{background:white;color:#1A1540;}
        button{cursor:pointer;border:none;}
        .btn-accent{transition:all .15s;}.btn-accent:hover{opacity:.88;transform:scale(1.02);}
        .btn-ghost{transition:all .15s;}.btn-ghost:hover{opacity:.75;}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}
        .pop{animation:pop .3s ease;}
        .topic-row:hover .topic-actions{opacity:1!important;}
        .mod-row:hover{background:#FAFAFA!important;}
        .mod-row-btn{transition:background .2s;}
        .mod-row-btn:hover{background:rgba(147,197,253,.25)!important;}
        input[type=time]::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer;}
      `}</style>

      {/* ── Header ── */}
      <header style={{ background:"rgba(255,255,255,.96)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.brd}`, position:"sticky", top:0, zIndex:200, boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
        <div style={{ width:"100%", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:62 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:16 }}>🚀</span>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:T.txt, letterSpacing:"-.4px", lineHeight:1.1 }}>Bootcamp Schedule</div>
              <div style={{ fontSize:10, color:T.txtSub, fontWeight:500, marginTop:1 }}>TechUp · {cohort}</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <nav style={{ display:"flex", gap:4, background:T.surf2, borderRadius:12, padding:4, border:`1px solid ${T.brd}` }}>
              {[{ id:"schedule", label:"📅 Schedule" }, { id:"subjects", label:"📚 Subjects" }].map(p => (
                <button key={p.id} className="btn-ghost" onClick={() => setPage(p.id)}
                  style={{ padding:"6px 16px", borderRadius:9, fontWeight:600, fontSize:12, background: page === p.id ? T.accent : "transparent", color: page === p.id ? T.accentTx : T.txtSub, border:"none" }}>
                  {p.label}
                </button>
              ))}
            </nav>
            {wdays.length > 0 && (
              <button className={`btn-accent ${csvFlash ? "pop" : ""}`} onClick={handleExportCSV}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:10, background: csvFlash ? ACCENT_DIM : T.accent, color:T.accentTx, fontWeight:700, fontSize:12, boxShadow:"0 2px 8px rgba(0,0,0,.12)", border:"none" }}>
                <span>{csvFlash ? "✅" : "⬇"}</span>{csvFlash ? "Downloaded!" : "Export CSV"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Pages ── */}
      {page === "schedule" ? (
        <SchedulePage
          cohort={cohort} setCohort={setCohort}
          sd={sd} setSd={setSd} ed={ed} setEd={setEd}
          totalDays={totalDays} totalTopics={totalTopics}
          scheduledTopics={scheduledTopics} progressPct={progressPct}
          weeks={weeks} wdays={wdays}
          getSess={getSess}
          setSess={boundSetSess}
          addSess={boundAddSess}
          rmSess={boundRmSess}
          getModuleColor={getModuleColor}
          modules={modules}
          csvFlash={csvFlash} onExportCSV={handleExportCSV}
        />
      ) : (
        <SubjectsPage
          modules={modules} dbModules={dbModules}
          totalTopics={totalTopics} scheduledTopics={scheduledTopics}
          schedEntries={schedEntries}
          getTopicObjAt={getTopicObjAt}
          onAddModule={addModule} onRemoveModule={removeModule} onUpdateModuleName={updateModuleName}
          onAddTopic={addTopic} onRemoveTopic={removeTopic} onUpdateTopic={updateTopic}
          onRestoreDefaults={() => restoreDefaults(() => setLoading(true), () => setLoading(false))}
          askConfirm={askConfirm}
        />
      )}

      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
    </div>
  );
}
