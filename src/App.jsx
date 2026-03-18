import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";

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
  const {
    dbModules, dbTopics, loadModules,
    getTopicObjAt, getModuleColor,
    addModule, removeModule, updateModuleName,
    addTopic, removeTopic, updateTopic,
    restoreDefaults,
  } = useModules();

  const { dbCohort, syncCohort } = useCohort();
  const { schedEntries, loadSchedule, getSess, setSess, addSess, rmSess } = useSchedule(dbModules, dbTopics);

  const [page, setPage]         = useState("schedule");
  const [cohort, setCohort]     = useState("FSD11");
  const [sd, setSd]             = useState(() => localStorage.getItem("sd") || "2026-05-18");
  const [ed, setEd]             = useState(() => localStorage.getItem("ed") || "2026-08-28");
  const [loading, setLoading]   = useState(true);
  const [csvFlash, setCsvFlash] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  // ── Drag State ────────────────────────────────────────────────────────────
  const [activeCard, setActiveCard] = useState(null);
  const [optimisticDates, setOptimisticDates] = useState({});
  // ref ติดตาม dateKey ปัจจุบันของการ์ดที่กำลังลาก (แก้ multi-hop bug)
  const currentDragDateRef = useRef(null);

  const isFirstRender = useRef(true);

  useEffect(() => { localStorage.setItem("sd", sd); }, [sd]);
  useEffect(() => { localStorage.setItem("ed", ed); }, [ed]);

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

  // ── Sensors: ลากแค่ 3px ก็เริ่ม drag ────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  // ── onDragStart ───────────────────────────────────────────────────────────
  function handleDragStart(event) {
    const { dateKey, si, sess } = event.active.data.current;
    currentDragDateRef.current = dateKey; // ตั้งค่าเริ่มต้น
    setActiveCard({ dateKey, si, sess });
  }

  // ── onDragOver: optimistic move — ใช้ ref แก้ multi-hop bug ──────────────
  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const { si } = active.data.current;
    const fromDate = currentDragDateRef.current; // ← ใช้ ref แทน active.data ที่ stale
    const toDate = over.id;
    if (!fromDate || fromDate === toDate) return;

    const entry = schedEntries.find(e => {
      const currentDate = optimisticDates[e.id] || e.date;
      return currentDate === fromDate && e.session_index === si + 1;
    });
    if (!entry) return;

    currentDragDateRef.current = toDate; // อัปเดต ref ทันที
    setOptimisticDates(prev => ({ ...prev, [entry.id]: toDate }));
    setActiveCard(prev => prev ? { ...prev, dateKey: toDate } : prev);
  }

  // ── onDragEnd: save ลง Supabase ──────────────────────────────────────────
  async function handleDragEnd(event) {
    const { over } = event;
    currentDragDateRef.current = null;
    setActiveCard(null);

    if (!over || Object.keys(optimisticDates).length === 0) {
      setOptimisticDates({});
      return;
    }

    try {
      for (const [entryId, newDate] of Object.entries(optimisticDates)) {
        await supabase.from('schedule_entries').update({ date: newDate }).eq('id', entryId);
      }
      await loadSchedule(dbCohort.id);
    } finally {
      setOptimisticDates({});
    }
  }

  // ── onDragCancel: กด Esc → คืนของเดิม ────────────────────────────────────
  function handleDragCancel() {
    currentDragDateRef.current = null;
    setActiveCard(null);
    setOptimisticDates({});
  }

  // ── getSessWithOptimistic: แสดงผลรวม optimistic ──────────────────────────
  function getSessWithOptimistic(dateKey) {
    if (Object.keys(optimisticDates).length === 0) return getSess(dateKey);

    const patchedEntries = schedEntries.map(e => ({
      ...e,
      date: optimisticDates[e.id] || e.date,
    }));

    const entries = patchedEntries
      .filter(e => e.date === dateKey)
      .sort((a, b) => a.session_index - b.session_index);

    if (entries.length === 0) return [
      { id: null, module: '', topic: '', start_time: '', end_time: '', note: '' },
      { id: null, module: '', topic: '', start_time: '', end_time: '', note: '' },
    ];

    return entries.map(e => {
      const topicObj = e.topic_id ? dbTopics.find(t => t.id === e.topic_id) : null;
      return {
        id: e.id,
        module: dbModules.find(m => m.id === e.module_id)?.name || '',
        topic: topicObj?.text || '',
        start_time: (e.start_time?.slice(0, 5)) || (topicObj?.start_time?.slice(0, 5)) || '',
        end_time: (e.end_time?.slice(0, 5)) || (topicObj?.end_time?.slice(0, 5)) || '',
        note: e.note || '',
      };
    });
  }

  function askConfirm(title, desc, onConfirm) { setConfirmModal({ title, desc, onConfirm }); }

  function handleExportCSV() {
    downloadCSV(buildCSV(wdays, getSess), `Bootcamp_Schedule_${cohort}_${sd}_to_${ed}.csv`);
    setCsvFlash(true);
    setTimeout(() => setCsvFlash(false), 2200);
  }

  const boundSetSess = (dk, idx, field, val) => setSess(dbCohort?.id, dk, idx, field, val);
  const boundAddSess = (dk) => addSess(dbCohort?.id, dk);
  const boundRmSess  = (dk, idx) => rmSess(dbCohort?.id, dk, idx);

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

      {/* ── DndContext ครอบทั้งหมด → ลากข้ามสัปดาห์ได้ ── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {page === "schedule" ? (
          <SchedulePage
            cohort={cohort} setCohort={setCohort}
            sd={sd} setSd={setSd} ed={ed} setEd={setEd}
            totalDays={totalDays} totalTopics={totalTopics}
            scheduledTopics={scheduledTopics} progressPct={progressPct}
            weeks={weeks} wdays={wdays}
            getSess={getSessWithOptimistic}
            setSess={boundSetSess}
            addSess={boundAddSess}
            rmSess={boundRmSess}
            getModuleColor={getModuleColor}
            modules={modules}
            csvFlash={csvFlash} onExportCSV={handleExportCSV}
            activeCardId={activeCard ? `${activeCard.dateKey}-${activeCard.si}` : null}
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

        {/* ── DragOverlay: การ์ดที่โฟลตามนิ้วตอนลาก ── */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeCard ? (
            <div style={{
              background: "#fff",
              borderRadius: 10,
              border: "2px solid #6366F1",
              padding: "8px 9px",
              boxShadow: "0 12px 40px rgba(99,102,241,.35)",
              transform: "rotate(2deg) scale(1.04)",
              minWidth: 160,
              opacity: 0.95,
              cursor: "grabbing",
            }}>
              {/* pill */}
              <div style={{
                fontSize: 10, fontWeight: 600,
                color: getModuleColor(activeCard.sess?.module || "").tx,
                background: getModuleColor(activeCard.sess?.module || "").bg,
                border: `1px solid ${getModuleColor(activeCard.sess?.module || "").bd}`,
                borderRadius: 9999, padding: "2px 8px",
                display: "inline-block", marginBottom: 4,
              }}>
                {activeCard.sess?.module || "—"}
              </div>
              <div style={{ fontSize: 11, color: "#111827", fontWeight: 500, lineHeight: 1.5 }}>
                {activeCard.sess?.topic || "—"}
              </div>
              {activeCard.sess?.start_time && (
                <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>
                  ⏰ {activeCard.sess.start_time} — {activeCard.sess.end_time}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
    </div>
  );
}
