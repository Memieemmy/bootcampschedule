import { useState } from "react";
import { SEED_MODULES } from "../../constants/seedData";
import { ModuleCard } from "./components/ModuleCard";

export function SubjectsPage({
  modules, dbModules, totalTopics, scheduledTopics, schedEntries,
  getTopicObjAt,
  onAddModule, onRemoveModule, onUpdateModuleName,
  onAddTopic, onRemoveTopic, onUpdateTopic,
  onRestoreDefaults,
  askConfirm,
}) {
  const [modFilter, setModFilter]   = useState("");
  const [showAddMod, setShowAddMod] = useState(false);
  const [newMod, setNewMod]         = useState("");
  const [openMod, setOpenMod]       = useState(null);
  const [newTopics, setNewTopics]   = useState({});

  const missingCount = SEED_MODULES.length - dbModules.length;

  const filteredModules = Object.entries(modules)
    .filter(([m]) => !m.toLowerCase().includes('holiday'))
    .filter(([m]) => !modFilter || m.toLowerCase().includes(modFilter.toLowerCase()));

  function handleAddModule() {
    const n = newMod.trim();
    if (!n || dbModules.find(m => m.name === n)) return;
    askConfirm("Add new Module?", `Name: "${n}"`, async () => {
      await onAddModule(n);
      setShowAddMod(false);
      setNewMod("");
    });
  }

  function handleRemoveModule(mod) {
    const tc = (modules[mod] || []).length;
    askConfirm(`Delete Module "${mod}"?`, `This module has ${tc} topics — all will be permanently deleted`, () => onRemoveModule(mod));
  }

  function handleUpdateModuleName(oldName, newName) {
    const n = newName.trim();
    if (!n || n === oldName || dbModules.find(m => m.name === n)) return;
    askConfirm("Rename Module?", `"${oldName}"  →  "${n}"`, () => onUpdateModuleName(oldName, n));
  }

  function handleAddTopic(mod) {
    const t = (newTopics[mod] || "").trim();
    if (!t) return;
    askConfirm("Add new topic?", `"${t}" in Module ${mod}`, async () => {
      await onAddTopic(mod, t);
      setNewTopics(p => ({ ...p, [mod]: "" }));
    });
  }

  function handleRemoveTopic(mod, ti) {
    const txt = (modules[mod] || [])[ti] || "";
    askConfirm("Delete this topic?", `"${txt}"`, () => onRemoveTopic(mod, ti));
  }

  function handleUpdateTopic(mod, ti, newText, startTime, endTime) {
    const t = newText.trim();
    if (!t) return;
    const old = (modules[mod] || [])[ti] || "";
    const timeLabel = startTime || endTime ? `\n⏰ ${startTime || '--:--'} – ${endTime || '--:--'}` : '';
    askConfirm("Edit topic?", `"${old}" → "${t}"${timeLabel}`, () => onUpdateTopic(mod, ti, t, startTime, endTime));
  }

  function handleRestoreDefaults() {
    const miss = SEED_MODULES.filter(sm => !dbModules.find(m => m.name === sm.name));
    askConfirm(
      "Restore missing Modules?",
      `Found ${miss.length} missing modules:\n${miss.map(m => `• ${m.name}`).join("\n")}\n\nRestore with all topics?`,
      onRestoreDefaults
    );
  }

  return (
    <main style={{ width:"100%", padding:"24px", boxSizing:"border-box", background:"#F4F5F7", minHeight:"calc(100vh - 62px)" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20, gap:12, flexWrap:"wrap" }}>
        <div>
          <h2 style={{ fontWeight:800, fontSize:22, color:"#111827", marginBottom:3 }}>📚 All subjects</h2>
          <p style={{ fontSize:12, color:"#6B7280" }}>{Object.keys(modules).length} modules · {totalTopics} topics</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {missingCount > 0 && (
            <button onClick={handleRestoreDefaults} style={{ padding:"7px 14px", borderRadius:9, background:"#FEF3C7", color:"#92400E", border:"1px solid #FDE68A", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
              🔄 Restore <span style={{ background:"#FDE68A", borderRadius:20, padding:"1px 7px", fontSize:11 }}>{missingCount}</span>
            </button>
          )}
          {!showAddMod && (
            <button onClick={() => setShowAddMod(true)} style={{ padding:"7px 14px", borderRadius:9, background:"#111827", color:"#fff", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, border:"none", cursor:"pointer" }}>
              <span style={{ fontSize:15, lineHeight:1 }}>+</span> Add Module
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{ l:"Total modules", v:Object.keys(modules).length, icon:"📦" }, { l:"Total topics", v:totalTopics, icon:"📝" }, { l:"Scheduled", v:scheduledTopics, icon:"✅" }].map((s, i) => (
          <div key={i} style={{ flex:1, background:"#fff", borderRadius:12, padding:"12px 16px", border:"1px solid #E5E7EB" }}>
            <div style={{ fontSize:9, color:"#9CA3AF", fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>{s.icon} {s.l}</div>
            <div style={{ fontSize:24, fontWeight:800, color:"#111827" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Add module form */}
      {showAddMod && (
        <div style={{ background:"#fff", border:"1.5px dashed #D1D5DB", borderRadius:12, padding:"14px 16px", marginBottom:10, display:"flex", gap:8, alignItems:"center" }}>
          <input
            value={newMod} onChange={e => setNewMod(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAddModule(); if (e.key === "Escape") { setShowAddMod(false); setNewMod(""); } }}
            placeholder="New module name…"
            style={{ flex:1, padding:"8px 12px", borderRadius:9, border:"1.5px solid #E5E7EB", fontSize:13, outline:"none", color:"#111827" }}
            autoFocus
          />
          <button onClick={handleAddModule} style={{ padding:"8px 18px", borderRadius:9, background:"#111827", color:"#fff", fontSize:13, fontWeight:600, border:"none", cursor:"pointer" }}>Add</button>
          <button onClick={() => { setShowAddMod(false); setNewMod(""); }} style={{ padding:"8px 12px", borderRadius:9, background:"#F3F4F6", color:"#6B7280", fontSize:13, border:"none", cursor:"pointer" }}>Cancel</button>
        </div>
      )}

      {/* Search */}
      <div style={{ position:"relative", marginBottom:12 }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#9CA3AF", pointerEvents:"none" }}>🔍</span>
        <input
          value={modFilter} onChange={e => setModFilter(e.target.value)}
          placeholder="Search modules…"
          style={{ width:"100%", padding:"9px 36px 9px 36px", borderRadius:10, border:"1.5px solid #E5E7EB", fontSize:13, background:"#fff", outline:"none", color:"#111827" }}
        />
        {modFilter && (
          <button onClick={() => setModFilter("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", fontSize:13, color:"#9CA3AF", padding:"2px 4px", border:"none", cursor:"pointer" }}>✕</button>
        )}
      </div>

      {filteredModules.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px 20px", color:"#9CA3AF", fontSize:14, background:"#fff", borderRadius:14, border:"1px solid #E5E7EB" }}>
          {modFilter ? `No module found "${modFilter}"` : "No modules yet"}
        </div>
      )}

      {/* Module cards */}
      {filteredModules.map(([mod, topics]) => (
        <ModuleCard
          key={mod} mod={mod} topics={topics}
          isOpen={openMod === mod}
          onToggle={() => setOpenMod(openMod === mod ? null : mod)}
          schedEntries={schedEntries}
          getTopicObjAt={(m, i) => getTopicObjAt(m, i)}
          newTopicText={newTopics[mod] || ""}
          setNewTopicText={v => setNewTopics(p => ({ ...p, [mod]: v }))}
          onAddTopic={handleAddTopic}
          onRemoveTopic={handleRemoveTopic}
          onUpdateTopic={handleUpdateTopic}
          onEditModule={handleUpdateModuleName}
          onRemoveModule={handleRemoveModule}
        />
      ))}
    </main>
  );
}
