import { T, ACCENT, ACCENT_DIM } from "../../constants/theme";
import { shortDate } from "../../utils/dateHelpers";
import { DayColumn } from "./components/DayColumn";

export function SchedulePage({
  cohort, setCohort,
  sd, setSd, ed, setEd,
  totalDays, totalTopics, scheduledTopics, progressPct,
  weeks, wdays,
  getSess, setSess, addSess, rmSess,
  getModuleColor, modules,
  csvFlash, onExportCSV,
  activeCardId,
}) {
  const cardStyle  = { background:T.surf, borderRadius:16, border:`1px solid ${T.brd}`, padding:"16px 18px" };
  const inputStyle = { width:"100%", padding:"9px 13px", borderRadius:10, border:`1.5px solid ${T.brd2}`, fontSize:13, color:T.txt, background:T.inBg, outline:"none" };
  const labelStyle = { fontSize:9, color:T.txtSub, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:7, display:"block" };

  return (
    <main style={{ width:"100%", padding:"24px", boxSizing:"border-box" }}>


      {/* Dashboard */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:12, marginBottom:24 }}>
        <div style={cardStyle}>
          <label style={labelStyle}>🎓 Cohort</label>
          <select value={cohort} onChange={e => setCohort(e.target.value)} style={{ ...inputStyle, fontSize:16, fontWeight:700 }}>
            {["FSD11","FSD12","FSD13"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={cardStyle}>
          <label style={labelStyle}>📌 Start date</label>
          <input type="date" value={sd} onChange={e => setSd(e.target.value)} style={{ ...inputStyle, borderColor:"#FFE566" }}/>
        </div>
        <div style={cardStyle}>
          <label style={labelStyle}>🏁 End date</label>
          <input type="date" value={ed} onChange={e => setEd(e.target.value)} style={{ ...inputStyle, borderColor:"#90E0B0" }}/>
        </div>
        <div style={{ ...cardStyle, background:"linear-gradient(135deg,#FFF4ED,#FFE1D2)", borderColor:"#FED7C3" }}>
          <label style={{ ...labelStyle, color:T.accent }}>📊 Total school days</label>
          <div style={{ fontSize:38, fontWeight:800, color:T.accent, lineHeight:1 }}>{totalDays}</div>
          <div style={{ fontSize:10, color:"#9A3412", marginTop:4 }}>days (excl. weekends)</div>
        </div>
        <div style={cardStyle}>
          <label style={labelStyle}>📚 Total topics</label>
          <div style={{ fontSize:36, fontWeight:800, color:"#006699", lineHeight:1 }}>{totalTopics}</div>
          <div style={{ fontSize:10, color:T.txtSub, marginTop:4 }}>topics in {Object.keys(modules).length} modules</div>
        </div>
        <div style={cardStyle}>
          <label style={labelStyle}>✅ Scheduled</label>
          <div style={{ fontSize:36, fontWeight:800, color:"#0D6035", lineHeight:1 }}>{scheduledTopics}</div>
          <div style={{ fontSize:10, color:T.txtSub, marginTop:4 }}>of {totalTopics} topics total</div>
        </div>
        <div style={cardStyle}>
          <label style={labelStyle}>📈 Progress</label>
          <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
            <span style={{ fontSize:34, fontWeight:800, color:"#9B1A3A", lineHeight:1 }}>{progressPct}</span>
            <span style={{ fontSize:14, fontWeight:700, color:"#9B1A3A" }}>%</span>
          </div>
          <div style={{ marginTop:10, height:5, borderRadius:3, background:T.brd2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progressPct}%`, borderRadius:3, background:`linear-gradient(90deg,#FDBA74,${T.accent})`, transition:"width .6s ease" }}/>
          </div>
          <div style={{ fontSize:9, color:T.txtMuted, marginTop:5 }}>{scheduledTopics} / {totalTopics} topics</div>
        </div>
      </div>

      {weeks.length === 0 && (
        <div style={{ textAlign:"center", color:T.txtMuted, padding:"80px 20px", fontSize:15 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🗓</div>Select start and end dates
        </div>
      )}

      {/* Calendar — DndContext อยู่ที่ App.jsx ครอบทั้งหมด */}
      {weeks.map((week, wi) => {
        const rangeStr = `${shortDate(week[0])} – ${shortDate(week[week.length - 1])}`;
        return (
          <div key={wi} style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"white", border:`1px solid ${T.brd}`, borderRadius:12, padding:"5px 14px 5px 10px", flexShrink:0 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:T.accent, flexShrink:0 }}/>
                <span style={{ fontWeight:800, fontSize:13, color:T.txt }}>Week {wi + 1}</span>
                <span style={{ fontSize:11, color:T.txtSub, fontWeight:500, borderLeft:`1px solid ${T.brd}`, paddingLeft:9, marginLeft:1 }}>{rangeStr}</span>
              </div>
              <div style={{ height:1, flex:1, background:`linear-gradient(90deg,${T.brd},transparent)` }}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:`repeat(${week.length},1fr)`, gap:10 }}>
              {week.map((date, di) => (
                <DayColumn
                  key={di} date={date}
                  getSess={getSess} setSess={setSess}
                  addSess={addSess} rmSess={rmSess}
                  getModuleColor={getModuleColor} modules={modules}
                  activeCardId={activeCardId}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Floating button */}
      {scheduledTopics > 0 && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:300 }}>
          <button className={`btn-accent ${csvFlash ? "pop" : ""}`} onClick={onExportCSV}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", borderRadius:14, background: csvFlash ? ACCENT_DIM : ACCENT, color:"#fff", fontWeight:700, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,.18)", border:"none", cursor:"pointer" }}>
            <span style={{ fontSize:15 }}>{csvFlash ? "✅" : "⬇"}</span>
            {csvFlash ? "Downloaded!" : "Export CSV"}
          </button>
        </div>
      )}
    </main>
  );
}
