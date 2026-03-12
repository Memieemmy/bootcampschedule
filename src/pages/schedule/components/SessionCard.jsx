import { useDraggable } from "@dnd-kit/core";
import { T } from "../../../constants/theme";

export function SessionCard({
  sess, si, dateKey, sessions,
  isEditing, isEditMode, isDragging,
  onStartEdit, onStopEdit,
  onSetSess, onRmSess,
  getModuleColor, modules,
}) {
  const isHol   = sess.module?.toLowerCase().includes('holiday');
  const pillCol = getModuleColor(sess.module || "");

  // ── Draggable ──────────────────────────────────────────────────────────────
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `${dateKey}-${si}`,
    data: { dateKey, si, sess }, // ← ส่ง data ไปให้ handleDragOver/End ใช้
    disabled: !isEditMode || !sess.module, // ลากได้เฉพาะตอน Edit Mode และมี module
  });

  return (
    <div
      ref={setNodeRef}
      {...(isEditMode && sess.module ? { ...listeners, ...attributes } : {})}
      className="hov-lift"
      style={{
        background: "#FFFFFF",
        borderRadius: 10,
        border: `1.5px solid ${isEditing ? "#6366F1" : isEditMode && sess.module ? "#A5B4FC" : "#E5E7EB"}`,
        padding: "8px 9px",
        marginBottom: si < sessions.length - 1 ? 6 : 0,
        position: "relative",
        transition: "border-color .15s, opacity .2s",
        // การ์ดต้นทางจางลงเมื่อกำลังถูกลาก
        opacity: isDragging ? 0.3 : 1,
        // เปลี่ยน cursor ตาม mode
        cursor: isEditMode && sess.module ? "grab" : isEditing ? "default" : "pointer",
      }}
      onClick={() => { if (!isEditing && !isEditMode) onStartEdit(); }}
    >
      {/* drag handle icon ตอน Edit Mode */}
      {isEditMode && sess.module && (
        <div style={{ position:"absolute", top:5, right:6, fontSize:11, color:"#A5B4FC", userSelect:"none" }}>⠿</div>
      )}

      {isEditing ? (
        <EditMode
          sess={sess} si={si} dateKey={dateKey} sessions={sessions}
          isHol={isHol} modules={modules}
          onStopEdit={onStopEdit} onSetSess={onSetSess} onRmSess={onRmSess}
        />
      ) : (
        <ViewMode sess={sess} isHol={isHol} pillCol={pillCol} />
      )}
    </div>
  );
}

function ViewMode({ sess, isHol, pillCol }) {
  return (
    <>
      <div style={{
        fontSize:10, fontWeight:500,
        color: sess.module ? pillCol.tx : T.txtMuted,
        marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        display:"inline-block",
        background: sess.module ? pillCol.bg : "transparent",
        borderRadius:9999, padding:"2px 8px",
        border: sess.module ? `1px solid ${pillCol.bd}` : "none"
      }}>
        {sess.module || "Select Module"}
      </div>
      <div style={{ fontSize:11.5, color: sess.topic ? "#111827" : "#C0C0C8", fontWeight: sess.topic ? 500 : 400, lineHeight:1.5, marginBottom:4, minHeight:18 }}>
        {sess.topic || (sess.module ? "— Select topic —" : "+ Click to add")}
      </div>
      {sess.module && !isHol && (
        <>
          <div style={{ marginTop:2, paddingTop:4, borderTop:"1px dotted #E5E7EB", fontSize:10, color:"#374151", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12 }}>⏰</span>
            <span>{sess.start_time || "--:--"} — {sess.end_time || "--:--"}</span>
          </div>
          {sess.note && (
            <div style={{ marginTop:3, fontSize:9, color:"#6B7280", lineHeight:1.5, whiteSpace:"pre-line" }}>{sess.note}</div>
          )}
        </>
      )}
    </>
  );
}

function EditMode({ sess, si, dateKey, sessions, isHol, modules, onStopEdit, onSetSess, onRmSess }) {
  return (
    <div onClick={e => e.stopPropagation()}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:8, fontWeight:700, color:"#6366F1", textTransform:"uppercase", letterSpacing:.8 }}>S{si + 1} · Edit</span>
        <button onClick={onStopEdit} style={{ background:"none", fontSize:11, color:"#9CA3AF", padding:"0 2px", border:"none", cursor:"pointer" }}>✕</button>
      </div>
      <select value={sess.module} onChange={e => onSetSess(dateKey, si, "module", e.target.value)}
        style={{ width:"100%", padding:"4px 6px", borderRadius:7, border:"1.5px solid #E5E7EB", fontSize:10, fontWeight:600, color: sess.module ? T.txt : T.txtMuted, background:"#FAFAFA", outline:"none", marginBottom:4 }}>
        <option value="">— Module —</option>
        <optgroup label="── Special ──"><option value="Holiday">🏖 Holiday</option></optgroup>
        <optgroup label="── Modules ──">
          {Object.keys(modules).filter(m => !m.toLowerCase().includes('holiday')).map(m => <option key={m} value={m}>{m}</option>)}
        </optgroup>
      </select>
      {sess.module && !isHol && (
        <select value={sess.topic} onChange={e => onSetSess(dateKey, si, "topic", e.target.value)}
          style={{ width:"100%", padding:"4px 6px", borderRadius:7, border:"1.5px solid #E5E7EB", fontSize:9, color:T.txtSub, background:"#FAFAFA", outline:"none", marginBottom:4 }}>
          <option value="">— Topic —</option>
          {(modules[sess.module] || []).map((t, ti) => <option key={ti} value={t}>{t}</option>)}
        </select>
      )}
      {sess.module && !isHol && (
        <div style={{ display:"flex", alignItems:"center", gap:3, marginBottom:4 }}>
          <span style={{ fontSize:9, color:T.txtMuted, flexShrink:0 }}>⏰</span>
          <input type="time" value={sess.start_time} onChange={e => onSetSess(dateKey, si, "start_time", e.target.value)}
            style={{ flex:1, padding:"2px 5px", borderRadius:5, border:"1px solid #E5E7EB", fontSize:9, background:"#FAFAFA", outline:"none", color:"#374151", minWidth:0 }}/>
          <span style={{ fontSize:9, color:T.txtMuted }}>–</span>
          <input type="time" value={sess.end_time} onChange={e => onSetSess(dateKey, si, "end_time", e.target.value)}
            style={{ flex:1, padding:"2px 5px", borderRadius:5, border:"1px solid #E5E7EB", fontSize:9, background:"#FAFAFA", outline:"none", color:"#374151", minWidth:0 }}/>
        </div>
      )}
      {sess.module && (
        <textarea value={sess.note || ""} onChange={e => onSetSess(dateKey, si, "note", e.target.value)}
          placeholder="Note for this session" rows={2}
          style={{ width:"100%", marginTop:2, padding:"3px 6px", borderRadius:6, border:"1px solid #E5E7EB", fontSize:9, background:"#FFFFFF", outline:"none", color:"#374151", resize:"vertical" }}/>
      )}
      {sess.id && sessions.length > 1 && (
        <button onClick={() => { onRmSess(dateKey, si); onStopEdit(); }}
          style={{ marginTop:6, width:"100%", padding:"3px", borderRadius:6, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", fontSize:9, fontWeight:500, cursor:"pointer" }}>
          🗑 Delete session
        </button>
      )}
    </div>
  );
}
