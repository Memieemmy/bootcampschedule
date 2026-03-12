export function ConfirmModal({ modal, onClose }) {
  if (!modal) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, background:"rgba(17,24,39,.5)",
        zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:16, padding:"24px 28px",
          width:360, maxWidth:"90vw", boxShadow:"0 8px 40px rgba(0,0,0,.22)"
        }}
      >
        <div style={{ fontWeight:700, fontSize:16, color:"#111827", marginBottom: modal.desc ? 8 : 20 }}>
          {modal.title}
        </div>
        {modal.desc && (
          <div style={{ fontSize:13, color:"#6B7280", marginBottom:20, lineHeight:1.7, whiteSpace:"pre-line" }}>
            {modal.desc}
          </div>
        )}
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding:"8px 18px", borderRadius:9, background:"#F3F4F6", color:"#374151", fontSize:13, fontWeight:500, border:"none", cursor:"pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { modal.onConfirm(); onClose(); }}
            style={{ padding:"8px 20px", borderRadius:9, background:"#111827", color:"#fff", fontSize:13, fontWeight:700, border:"none", cursor:"pointer" }}
          >
            Confirm ✓
          </button>
        </div>
      </div>
    </div>
  );
}
