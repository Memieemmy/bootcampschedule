import { useState } from "react";

export function TopicRow({ mod, topic, ti, topicObj, isScheduled, onEdit, onRemove }) {
  const hasTime = topicObj?.start_time || topicObj?.end_time;

  return (
    <div
      className="topic-row"
      style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom:"1px solid #F3F4F6" }}
    >
      <span style={{ fontSize:10, color: isScheduled ? "#16A34A" : "#D1D5DB", fontWeight:700, width:20, textAlign:"right", flexShrink:0 }}>
        {ti + 1}
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:"#374151", lineHeight:1.6 }}>{topic}</div>
      </div>
      {hasTime && (
        <span style={{ fontSize:10, color:"#6B7280", display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
          <span style={{ fontSize:11 }}>⏰</span>
          <span style={{ fontFamily:"monospace", whiteSpace:"nowrap" }}>
            {topicObj.start_time?.slice(0, 5) || '--:--'} – {topicObj.end_time?.slice(0, 5) || '--:--'}
          </span>
        </span>
      )}
      <span className="topic-actions" style={{ display:"flex", gap:4, opacity:0, transition:"opacity .15s", flexShrink:0, marginLeft:4 }}>
        <button
          onClick={onEdit}
          style={{ padding:"2px 8px", borderRadius:5, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#6B7280", fontSize:11, cursor:"pointer" }}
        >
          ✏️
        </button>
        <button
          onClick={onRemove}
          style={{ padding:"2px 8px", borderRadius:5, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", fontSize:11, cursor:"pointer" }}
        >
          ✕
        </button>
      </span>
    </div>
  );
}

export function TopicEditRow({ editDraft, setEditDraft, editStartTime, setEditStartTime, editEndTime, setEditEndTime, onSave, onCancel }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
      <input
        value={editDraft}
        onChange={e => setEditDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
        style={{ width:"100%", padding:"5px 9px", borderRadius:7, border:"1.5px solid #D1D5DB", fontSize:12, outline:"none", background:"#fff" }}
        autoFocus
      />
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:11, color:"#9CA3AF" }}>⏰</span>
        <input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
          style={{ flex:1, padding:"4px 7px", borderRadius:6, border:"1.5px solid #E5E7EB", fontSize:11, outline:"none", background:"#fff", color:"#374151" }}
        />
        <span style={{ fontSize:11, color:"#9CA3AF", fontWeight:600 }}>–</span>
        <input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)}
          style={{ flex:1, padding:"4px 7px", borderRadius:6, border:"1.5px solid #E5E7EB", fontSize:11, outline:"none", background:"#fff", color:"#374151" }}
        />
        <button onClick={onSave} style={{ padding:"4px 12px", borderRadius:7, background:"#111827", color:"#fff", fontSize:11, fontWeight:600, flexShrink:0, border:"none", cursor:"pointer" }}>Save</button>
        <button onClick={onCancel} style={{ padding:"4px 9px", borderRadius:7, background:"#F3F4F6", color:"#6B7280", fontSize:11, flexShrink:0, border:"none", cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}
