import { useState } from "react";
import { TopicRow, TopicEditRow } from "./TopicRow";

export function ModuleCard({
  mod, topics, isOpen, onToggle,
  schedEntries, getTopicObjAt,
  newTopicText, setNewTopicText,
  onAddTopic, onRemoveTopic, onUpdateTopic,
  onEditModule, onRemoveModule,
}) {
  const [modMenuOpen, setModMenuOpen]     = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [moduleDraft, setModuleDraft]     = useState(mod);

  const [editingTopicIdx, setEditingTopicIdx] = useState(null);
  const [editDraft, setEditDraft]         = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime]     = useState("");

  const allScheduled = topics.length > 0 && topics.every((_, ti) => {
    const topicObj = getTopicObjAt(mod, ti);
    return topicObj && schedEntries.some(e => e.topic_id === topicObj.id);
  });

  function handleStartEditTopic(ti, text, topicObj) {
    setEditingTopicIdx(ti);
    setEditDraft(text);
    setEditStartTime(topicObj?.start_time?.slice(0, 5) || '');
    setEditEndTime(topicObj?.end_time?.slice(0, 5) || '');
  }

  function handleCancelEditTopic() {
    setEditingTopicIdx(null);
    setEditDraft(""); setEditStartTime(""); setEditEndTime("");
  }

  return (
    <div
      className="modc"
      style={{
        background:"#fff", borderRadius:12,
        border:`1px solid ${isOpen ? "#D1D5DB" : "#E5E7EB"}`,
        marginBottom:6, overflow:"hidden",
        boxShadow: isOpen ? "0 2px 12px rgba(0,0,0,.07)" : "none"
      }}
    >
      {/* Module header row */}
      <div className="mod-row" style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"relative" }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background: allScheduled ? "#16A34A" : "#9CA3AF", flexShrink:0 }}/>

        {isEditingModule ? (
          <>
            <input
              value={moduleDraft}
              onChange={e => setModuleDraft(e.target.value)}
              onKeyDown={e => {
                e.stopPropagation();
                if (e.key === "Enter") { onEditModule(mod, moduleDraft); setIsEditingModule(false); }
                if (e.key === "Escape") { setIsEditingModule(false); setModuleDraft(mod); }
              }}
              onClick={e => e.stopPropagation()}
              style={{ flex:1, padding:"5px 10px", borderRadius:8, border:"1.5px solid #D1D5DB", fontSize:13, fontWeight:600, outline:"none", color:"#111827" }}
              autoFocus
            />
            <button onClick={() => { onEditModule(mod, moduleDraft); setIsEditingModule(false); }}
              style={{ padding:"5px 12px", borderRadius:8, background:"#111827", color:"#fff", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" }}>Save</button>
            <button onClick={() => { setIsEditingModule(false); setModuleDraft(mod); }}
              style={{ padding:"5px 10px", borderRadius:8, background:"#F3F4F6", color:"#6B7280", fontSize:12, border:"none", cursor:"pointer" }}>Cancel</button>
          </>
        ) : (
          <>
            <span style={{ fontWeight:600, fontSize:14, color:"#111827", flex:1, cursor:"pointer" }} onClick={onToggle}>{mod}</span>
            <span style={{ fontSize:11, color:"#6B7280", background:"#F3F4F6", borderRadius:20, padding:"2px 9px", flexShrink:0, fontWeight:500 }}>
              {topics.length} topics
            </span>
            <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0 }}>
              <button
                className="mod-row-btn"
                onClick={e => { e.stopPropagation(); setModMenuOpen(v => !v); }}
                style={{ padding:"4px 10px", borderRadius:999, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#6B7280", fontSize:13, cursor:"pointer" }}
              >⋯</button>
              <button
                className="mod-row-btn"
                onClick={e => { e.stopPropagation(); onToggle(); setModMenuOpen(false); }}
                style={{ padding:"4px 10px", borderRadius:999, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#9CA3AF", fontSize:11, cursor:"pointer" }}
              >{isOpen ? "▲" : "▼"}</button>
            </div>

            {modMenuOpen && (
              <div style={{ position:"absolute", right:16, top:40, background:"#fff", borderRadius:10, boxShadow:"0 8px 24px rgba(15,23,42,.18)", border:"1px solid #E5E7EB", padding:"6px 0", zIndex:10, minWidth:120 }}>
                <button
                  onClick={e => { e.stopPropagation(); setIsEditingModule(true); setModuleDraft(mod); setModMenuOpen(false); }}
                  style={{ width:"100%", textAlign:"left", padding:"6px 12px", fontSize:12, color:"#111827", background:"none", border:"none", cursor:"pointer" }}
                >✏️ Edit</button>
                <button
                  onClick={e => { e.stopPropagation(); setModMenuOpen(false); onRemoveModule(mod); }}
                  style={{ width:"100%", textAlign:"left", padding:"6px 12px", fontSize:12, color:"#DC2626", background:"none", border:"none", cursor:"pointer" }}
                >🗑 Delete</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Topics list */}
      {isOpen && (
        <div style={{ borderTop:"1px solid #F3F4F6", padding:"10px 16px 14px", background:"#FAFAFA" }}>
          {topics.length === 0 && (
            <div style={{ fontSize:12, color:"#9CA3AF", textAlign:"center", padding:"10px 0" }}>No topics — add below</div>
          )}

          {topics.map((t, ti) => {
            const topicObj = getTopicObjAt(mod, ti);
            const isScheduled = topicObj ? schedEntries.some(e => e.topic_id === topicObj.id) : false;
            return (
              <div key={ti} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:10, color: isScheduled ? "#16A34A" : "#D1D5DB", fontWeight:700, width:20, textAlign:"right", flexShrink:0 }}>
                  {ti + 1}
                </span>
                {editingTopicIdx === ti ? (
                  <TopicEditRow
                    editDraft={editDraft} setEditDraft={setEditDraft}
                    editStartTime={editStartTime} setEditStartTime={setEditStartTime}
                    editEndTime={editEndTime} setEditEndTime={setEditEndTime}
                    onSave={() => { onUpdateTopic(mod, ti, editDraft, editStartTime, editEndTime); handleCancelEditTopic(); }}
                    onCancel={handleCancelEditTopic}
                  />
                ) : (
                  <TopicRow
                    mod={mod} topic={t} ti={ti}
                    topicObj={topicObj} isScheduled={isScheduled}
                    onEdit={() => handleStartEditTopic(ti, t, topicObj)}
                    onRemove={() => onRemoveTopic(mod, ti)}
                  />
                )}
              </div>
            );
          })}

          {/* Add topic */}
          <div style={{ display:"flex", gap:7, marginTop:10 }}>
            <input
              value={newTopicText}
              onChange={e => setNewTopicText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onAddTopic(mod)}
              placeholder="Add new topic…"
              style={{ flex:1, padding:"7px 11px", borderRadius:8, border:"1.5px solid #E5E7EB", fontSize:12, outline:"none", background:"#fff", color:"#111827" }}
            />
            <button
              onClick={() => onAddTopic(mod)}
              style={{ padding:"7px 16px", borderRadius:8, background:"#111827", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer" }}
            >+</button>
          </div>
        </div>
      )}
    </div>
  );
}
