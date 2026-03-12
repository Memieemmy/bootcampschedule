import { useState } from "react";
import { DAY_FULL, DAY_KEY, DAY_L } from "../../../constants/theme";
import { SessionCard } from "./SessionCard";

export function DayColumn({ date, getSess, setSess, addSess, rmSess, getModuleColor, modules }) {
  const [editingSession, setEditingSession] = useState(null); // si index

  const dayIdx = date.getDay() - 1;
  const dc = DAY_L[DAY_KEY[dayIdx] || "Mon"];
  const dateKey = date.toISOString().slice(0, 10);
  const sessions = getSess(dateKey);
  const dayHasHoliday = sessions.some(s => s.module?.toLowerCase().includes('holiday'));

  return (
    // 👇 ในอนาคต: ห่อด้วย <Droppable droppableId={dateKey}> ตรงนี้
    <div style={{
      background: dayHasHoliday ? "#F5F5F5" : dc.bg,
      borderRadius:14,
      border:`1.5px solid ${dayHasHoliday ? "#D1D5DB" : dc.ac + "66"}`,
      overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.05)"
    }}>
      {/* Day header */}
      <div style={{
        background: dayHasHoliday ? "#EBEBEB" : dc.hd,
        padding:"8px 12px",
        borderBottom:`1px solid ${dayHasHoliday ? "#D1D5DB" : dc.ac + "55"}`
      }}>
        <div style={{ fontSize:9, fontWeight:700, color: dayHasHoliday ? "#9CA3AF" : dc.txt, textTransform:"uppercase", letterSpacing:.8, opacity:.7 }}>
          {DAY_FULL[dayIdx]}
        </div>
        <div style={{ fontSize:14, fontWeight:800, color: dayHasHoliday ? "#9CA3AF" : dc.txt }}>
          {date.toLocaleDateString("th-TH", { day:"2-digit", month:"2-digit" })}
        </div>
        {dayHasHoliday && (
          <div style={{ fontSize:9, color:"#9CA3AF", fontWeight:600, marginTop:1, letterSpacing:.3 }}>🏖 Holiday</div>
        )}
      </div>

      {/* Sessions */}
      <div style={{ padding:"7px 7px 9px" }}>
        {dayHasHoliday ? (
          <HolidayDisplay
            onClear={() => {
              const hi = sessions.findIndex(s => s.module?.toLowerCase().includes('holiday'));
              if (hi >= 0) setSess(dateKey, hi, 'module', '');
            }}
          />
        ) : (
          sessions.map((sess, si) => (
            <SessionCard
              key={si}
              sess={sess} si={si}
              dateKey={dateKey} sessions={sessions}
              isEditing={editingSession === si}
              onStartEdit={() => setEditingSession(si)}
              onStopEdit={() => setEditingSession(null)}
              onSetSess={setSess}
              onRmSess={(dk, idx) => { rmSess(dk, idx); setEditingSession(null); }}
              getModuleColor={getModuleColor}
              modules={modules}
            />
          ))
        )}

        {!dayHasHoliday && sessions.length < 4 && (
          <button
            className="btn-ghost"
            onClick={() => addSess(dateKey)}
            style={{ width:"100%", marginTop:6, padding:"4px", borderRadius:8, border:`1.5px dashed ${dc.ac}`, background:"transparent", fontSize:10, color:"#AAA", fontWeight:500, cursor:"pointer" }}
          >
            + Session
          </button>
        )}
      </div>
    </div>
  );
}

function HolidayDisplay({ onClear }) {
  return (
    <div style={{ textAlign:"center", padding:"20px 8px" }}>
      <div style={{ fontSize:30, marginBottom:6 }}>🏖</div>
      <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", marginBottom:2 }}>Holiday</div>
      <div style={{ fontSize:9, color:"#D1D5DB", marginBottom:10 }}>Holiday</div>
      <button
        onClick={onClear}
        style={{ padding:"4px 14px", borderRadius:7, border:"1px solid #D1D5DB", background:"#fff", color:"#6B7280", fontSize:10, fontWeight:500, cursor:"pointer" }}
      >
        🔓 Edit
      </button>
    </div>
  );
}
