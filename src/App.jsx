import { useState, useMemo } from "react";


// ── Data ──────────────────────────────────────────────────────────────────────
const INITIAL_MODULES = {
  GIT: ["Git: Refs, Merging, Rebasing, Fixing Mistakes","Git: Remote Repository, Pull Request"],
  Algorithms: ["Basic Algorithm Operations and Step","Algorithm Session (From Steps to Code I)","Algorithm Session (From Steps to Code II)","Algorithm Session (Linear Search)","Algorithm Session (Binary Search)","Algorithm Session (Nested Loop)","Algorithm Session (Bubble Sort)","Algo Exercise Guiding (Roman Integer, Moving Zeros, X)","More Algo Problem Patterns Guiding (Sliding Windows and Etc)"],
  CSS: ["CSS: S&P, Pseudo, Specificity","CSS: Direction & Box model, Units, Fonts","CSS: Flexbox","CSS: Colors, Positioned, CSS Vars","Cursor AI Features","CSS: Tailwind CSS","CSS: Responsive Design","HTML CSS Mini Project 🚀"],
  JS: ["JS: Values & Variable, Primitive Values, Type Conversion, Intro to Debugging","JS: Objects + Array","JS: Functions, Equality of Values, If-Else","JS: Loops","JS: CB and HoF","JS: Asynchronicity, Promise, Async/Await","JS: CB and HoF Revisiting","JS: Built-In Array Function 1","JS: Built-In Array Function 2","JS: Scopes, ECMAScript Feature","JS: Algorithm Session (Big O)"],
  Nodejs: ["Node.js: REST API Design","Node.js: Node.js, Express, Module","Node.js: Build Creating Data API","Node.js: Build the Complete CRUD APIs (Read All / Read Id)","Node.js: Build the Complete CRUD APIs (Update / Delete / Read with Query Params)","Node.js: API Validation & Middlewares & Router","Node.js: Basic Queries in MongoDB","Node.js: Connect MongoDB and Express","Node.js: Authentication & JWT Authentication 1","Node.js: Authentication & JWT Authentication 2","Next.js + Prisma ORM Workshop"],
  RDBMS: ["RDBMS: Database Management System, Intro to Relational Database, Relational Database Design","RDBMS: PostgreSQL, Basic Queries in SQL","RDBMS: Joining Table","RDBMS: SQL Aggregations, SQL Tuning Performance"],
  React: ["REACT: Intro to React, Vite, React Component","REACT: JSX + Module","REACT: Props","REACT: Revisiting React (Component, Props, Module)","REACT: Component Styling","REACT: Rendering Lists Workshop","REACT: React States + Form Handling Workshop","REACT: Manipulating Array State","REACT: React Quick Form Mini Project","REACT: Client-Server Architecture, Connect the APIs in JavaScript, Data Fetching","REACT: React Router","REACT: Revisiting React (Data Fetching and Router)","REACT: React Custom Hook","REACT: React Context API"],
  RWEP: ["RWEP: Software Development Process & Software Deployments + Debugging Workshop","Authentication with services"],
  TypeScript: ["From JS to TS","TypeScript in React"],
  SkillCheckpoint: ["✅ Skill Checkpoint #1 (JavaScript1)","✅ Skill Checkpoint #2 (JavaScript2)","✅ Skill Checkpoint #3 (Frontend)","✅ Skill Checkpoint #4 (Backend)","✅ Skill Checkpoint #5 (Algorithm)"],
  PersonalBlog: ["Personal Blog"],
  Bootcamp_Info: ["Orientation [09:00 - 16:00]","Bootcamp Norms, HH briefing","Career Prep Phase Briefing","Final Project Norm Setting + Kick off meeting"],
  CareerPrep: ["Career Prep Phase (Project 1)","Career Prep Phase (Project 2)","💼 Job Searching"],
  CareerSkills: ["Cover Letter, Resume, LinkedIn","Technical Interviews - 2","Non-Technical Interviews","Vue","Java + OOP","Spring Boot","travel explorer Project Setup Workshop","💥Demo Day Rehearsal💥","💥Demo Day 💥","🎓Graduation Ceremony"],
  Softskill: ["Communications","Giving and Receiving Feedback","Growth Mindset + Skills Map","Get Together #1","Get Together #2","Norm Setting","Learning How to Learn (Recall & Test) + Present HTML CSS Mini Project","Imposter Syndrome","Learning How to Learn 1 (focused & diffuse mode)","Learning How to Learn 2 (focused & diffuse mode)","Learning How to Learn 3 (focused & diffuse mode)"],
  Speaker: ["Speaker #1 Succeeding in TechUp Bootcamp (Alumni)","Speaker #3 Switching into Dev Career (Alumni)"],
};

// Module colors — light/dark pastel pairs
const MOD_COLORS = {
  GIT:            { l:{bg:"#FFF0F5",bd:"#FFB3CC",tx:"#9B1A3A",dot:"#FF6B8A"}, d:{bg:"#2A1520",bd:"#5A2535",tx:"#FFB3CC",dot:"#FF6B8A"} },
  Algorithms:     { l:{bg:"#FFF8EC",bd:"#FFD09B",tx:"#8B4A00",dot:"#FF9E3D"}, d:{bg:"#2A1E00",bd:"#5A3E00",tx:"#FFD09B",dot:"#FF9E3D"} },
  CSS:            { l:{bg:"#EFF7FF",bd:"#B0CEFF",tx:"#1A5599",dot:"#4DA6FF"}, d:{bg:"#0D2035",bd:"#1A4070",tx:"#B0CEFF",dot:"#4DA6FF"} },
  JS:             { l:{bg:"#FFFEF0",bd:"#FFE566",tx:"#7A5800",dot:"#FFD700"}, d:{bg:"#25200A",bd:"#554500",tx:"#FFE566",dot:"#FFD700"} },
  Nodejs:         { l:{bg:"#F0FFF8",bd:"#90E0B0",tx:"#0D6035",dot:"#3DBD78"}, d:{bg:"#0A2318",bd:"#144D30",tx:"#90E0B0",dot:"#3DBD78"} },
  RDBMS:          { l:{bg:"#F5F0FF",bd:"#C4ADFF",tx:"#4A1EA8",dot:"#9B6DFF"}, d:{bg:"#180E35",bd:"#3D2880",tx:"#C4ADFF",dot:"#9B6DFF"} },
  React:          { l:{bg:"#EDFCFF",bd:"#80DEFF",tx:"#005580",dot:"#00BFFF"}, d:{bg:"#001C2A",bd:"#004466",tx:"#80DEFF",dot:"#00BFFF"} },
  RWEP:           { l:{bg:"#FFF0FA",bd:"#FFB3E0",tx:"#880060",dot:"#FF69B4"}, d:{bg:"#280018",bd:"#550035",tx:"#FFB3E0",dot:"#FF69B4"} },
  TypeScript:     { l:{bg:"#EEF2FF",bd:"#A0B8FF",tx:"#2040A0",dot:"#5580CC"}, d:{bg:"#0D1530",bd:"#1A3370",tx:"#A0B8FF",dot:"#5580CC"} },
  SkillCheckpoint:{ l:{bg:"#F0FFF4",bd:"#7DDC7D",tx:"#0D550D",dot:"#4CAF50"}, d:{bg:"#0A200A",bd:"#144D14",tx:"#7DDC7D",dot:"#4CAF50"} },
  PersonalBlog:   { l:{bg:"#FFF8F0",bd:"#FFCC80",tx:"#8B4A00",dot:"#FFA726"}, d:{bg:"#251500",bd:"#502A00",tx:"#FFCC80",dot:"#FFA726"} },
  Bootcamp_Info:  { l:{bg:"#F8F0FF",bd:"#C8B8FF",tx:"#4400AA",dot:"#7C4DFF"}, d:{bg:"#150033",bd:"#2D0066",tx:"#C8B8FF",dot:"#7C4DFF"} },
  CareerPrep:     { l:{bg:"#FFF0F7",bd:"#FFB3D1",tx:"#7A0035",dot:"#FF4081"}, d:{bg:"#250010",bd:"#550025",tx:"#FFB3D1",dot:"#FF4081"} },
  CareerSkills:   { l:{bg:"#EFF6FF",bd:"#99CCFF",tx:"#004080",dot:"#2196F3"}, d:{bg:"#001525",bd:"#00305A",tx:"#99CCFF",dot:"#2196F3"} },
  Softskill:      { l:{bg:"#FFF5EE",bd:"#FFB380",tx:"#662800",dot:"#FF7043"}, d:{bg:"#1E0D00",bd:"#451C00",tx:"#FFB380",dot:"#FF7043"} },
  Speaker:        { l:{bg:"#F0FFF4",bd:"#A0E0A0",tx:"#0D4D0D",dot:"#66BB6A"}, d:{bg:"#0A1A0A",bd:"#154015",tx:"#A0E0A0",dot:"#66BB6A"} },
};

// Day palette — light: yellow Mon, pink Tue | dark: same pastel on very dark bg
const DAY_L = {
  Mon: { bg:"#FFFDF0", ac:"#FFE566", hd:"#FFF7BB", txt:"#5A4800" },
  Tue: { bg:"#FFF5F8", ac:"#FFB3CC", hd:"#FFD6E7", txt:"#7A1A35" },
  Wed: { bg:"#F2FFF9", ac:"#90E0B0", hd:"#C5F0D8", txt:"#0D5C30" },
  Thu: { bg:"#F5F0FF", ac:"#C4ADFF", hd:"#DDD4FF", txt:"#3D1A99" },
  Fri: { bg:"#EFF7FF", ac:"#A8D4FF", hd:"#CCE7FF", txt:"#1A4D8C" },
};
const DAY_D = {
  Mon: { bg:"#1E1C00", ac:"#554E00", hd:"#2A2600", txt:"#FFE566" },
  Tue: { bg:"#200010", ac:"#5A1A30", hd:"#2A0A1A", txt:"#FFB3CC" },
  Wed: { bg:"#001A0D", ac:"#1A5533", hd:"#001A0D", txt:"#90E0B0" },
  Thu: { bg:"#0F0825", ac:"#3D2880", hd:"#160E33", txt:"#C4ADFF" },
  Fri: { bg:"#08152A", ac:"#1A3D70", hd:"#0E1F38", txt:"#A8D4FF" },
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
function buildCSV(wdays, sched, getSessFn) {
  const rows = [["Week","Date","Day","Start Time","End Time","Session","Module","Topic","Category","Note","Check"]];
  groupByWeek(wdays).forEach((week,wi)=>{
    week.forEach(date=>{
      const dayIdx=date.getDay()-1;
      const dateKey=dkey(date);
      getSessFn(dateKey).forEach((sess,si)=>{
        if(!sess.module&&!sess.topic) return;
        rows.push([`Week ${wi+1}`,fmtFull(date),DAY_FULL[dayIdx]||"","","",`Session ${si+1}`,sess.module||"",sess.topic||"",sess.module||"","",""]);
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
  const dark                 = false; // force light mode only
  const [page,setPage]       = useState("schedule");
  const [cohort,setCohort]   = useState("FSD11");
  const [sd,setSd]           = useState("2026-05-18");
  const [ed,setEd]           = useState("2026-08-28");
  const [modules,setModules] = useState(INITIAL_MODULES);
  const [sched,setSched]     = useState({});
  const [newMod,setNewMod]   = useState("");
  const [newTopics,setNewTopics] = useState({});
  const [openMod,setOpenMod] = useState(null);
  const [csvFlash,setCsvFlash] = useState(false);

  const start  = useMemo(()=>sd?new Date(sd):null,[sd]);
  const end    = useMemo(()=>ed?new Date(ed):null,[ed]);
  const wdays  = useMemo(()=>start&&end&&end>=start?getWeekdays(start,end):[],[start,end]);
  const weeks  = useMemo(()=>groupByWeek(wdays),[wdays]);
  const totalDays = wdays.length;
  const totalTopics     = useMemo(()=>Object.values(modules).reduce((s,t)=>s+t.length,0),[modules]);
  const scheduledTopics = useMemo(()=>{let n=0;Object.values(sched).forEach(ss=>ss.forEach(s=>{if(s.topic)n++;}));return n;},[sched]);
  const progressPct = totalTopics>0?Math.round(scheduledTopics/totalTopics*100):0;

  // ── TechUp-style theme (white + blue) ──────────────────────────────────────
  // Light: white background, dark text, deep blue accent (like techupth.com)
  // Dark palette kept for future but never used (dark = false)
  const ACCENT = "#1A237E";
  const ACCENT_DIM = "#151B60";
  const ACCENT_SOFT = "#E8EAF6";

  const T = dark ? {
    bg:       "#0B1120",
    bg2:      "#020617",
    surf:     "#020617",
    surf2:    "#111827",
    brd:      "#1F2937",
    brd2:     "#374151",
    txt:      "#F9FAFB",
    txtSub:   "#9CA3AF",
    txtMuted: "#6B7280",
    inBg:     "#020617",
    accent:   ACCENT,
    accentDim:ACCENT_DIM,
    accentTx: "#FFFFFF",
    tagBg:    "#111827",
    remBtn:   "#4B5563",
    sessEmpty:"#020617",
    sessEmptyBd:"#111827",
  } : {
    bg:       "#FFFFFF",
    bg2:      "#F9FAFB",
    surf:     "#FFFFFF",
    surf2:    "#F9FAFB",
    brd:      "#E5E7EB",
    brd2:     "#D1D5DB",
    txt:      "#111827",
    txtSub:   "#4B5563",
    txtMuted: "#9CA3AF",
    inBg:     "#FFFFFF",
    accent:   ACCENT,
    accentDim:ACCENT_DIM,
    accentTx: "#FFFFFF",
    tagBg:    ACCENT_SOFT,
    remBtn:   "#D1D5DB",
    sessEmpty:"#FFFFFF",
    sessEmptyBd:"#E5E7EB",
  };

  const DC = dark ? DAY_D : DAY_L;

  function mc(mod){
    const c=MOD_COLORS[mod];
    if(!c)return dark?{bg:"#1E2035",bd:"#3A3E5A",tx:"#9090B8",dot:"#6060A0"}:{bg:"#F5F5F5",bd:"#DDD",tx:"#555",dot:"#AAA"};
    return dark?{bg:c.d.bg,bd:c.d.bd,tx:c.d.tx,dot:c.d.dot}:{bg:c.l.bg,bd:c.l.bd,tx:c.l.tx,dot:c.l.dot};
  }

  function getSess(dk2){return sched[dk2]||[{module:"",topic:""},{module:"",topic:""}];}
  function setSess(dateKey,idx,field,val){
    setSched(prev=>{
      const ss=[...(prev[dateKey]||[{module:"",topic:""},{module:"",topic:""}])];
      while(ss.length<=idx)ss.push({module:"",topic:""});
      ss[idx]={...ss[idx],[field]:val};
      if(field==="module")ss[idx].topic="";
      return{...prev,[dateKey]:ss};
    });
  }
  function addSess(dk2){setSched(prev=>{const ss=[...(prev[dk2]||[{module:"",topic:""},{module:"",topic:""}])];if(ss.length<4)ss.push({module:"",topic:""});return{...prev,[dk2]:ss};});}
  function rmSess(dk2,idx){setSched(prev=>{const ss=[...(prev[dk2]||[])];ss.splice(idx,1);return{...prev,[dk2]:ss};});}
  function addModule(){const n=newMod.trim();if(!n||modules[n])return;setModules(p=>({...p,[n]:[]}));MOD_COLORS[n]={l:{bg:"#F5F5F5",bd:"#DDD",tx:"#555",dot:"#AAA"},d:{bg:"#1E2035",bd:"#3A3E5A",tx:"#9090B8",dot:"#6060A0"}};setNewMod("");}
  function addTopic(mod){const t=(newTopics[mod]||"").trim();if(!t)return;setModules(p=>({...p,[mod]:[...p[mod],t]}));setNewTopics(p=>({...p,[mod]:""}))}
  function rmTopic(mod,i){setModules(p=>({...p,[mod]:p[mod].filter((_,j)=>j!==i)}));}
  function rmModule(mod){setModules(p=>{const n={...p};delete n[mod];return n;});}
  function handleExportCSV(){
    downloadCSV(buildCSV(wdays,sched,getSess),`Bootcamp_Schedule_${cohort}_${sd}_to_${ed}.csv`);
    setCsvFlash(true);setTimeout(()=>setCsvFlash(false),2200);
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle = {background:T.surf,borderRadius:16,border:`1px solid ${T.brd}`,padding:"16px 18px"};
  const inputStyle = {width:"100%",padding:"9px 13px",borderRadius:10,border:`1.5px solid ${T.brd2}`,fontSize:13,color:T.txt,background:T.inBg,outline:"none",colorScheme:dark?"dark":"light"};
  const labelStyle = {fontSize:9,color:T.txtSub,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,display:"block"};

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.txt,fontFamily:"'Inter','Sarabun','Noto Sans Thai',sans-serif",transition:"background .3s,color .3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sarabun:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button{font-family:inherit;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-thumb{background:${dark?"#4B5563":"#D1D5DB"};border-radius:3px;}
        .hov-lift{transition:transform .15s,box-shadow .15s;}
        .hov-lift:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,${dark?.35:.12});}
        .modc{transition:box-shadow .2s;}
        .modc:hover{box-shadow:0 4px 20px rgba(0,0,0,${dark?.4:.1});}
        select option{background:${dark?"#141720":"white"};color:${dark?"#F0EEF8":"#1A1540"};}
        button{cursor:pointer;border:none;}
        .btn-accent{transition:all .15s;} 
        .btn-accent:hover{opacity:.88;transform:scale(1.02);}
        .btn-ghost{transition:all .15s;}
        .btn-ghost:hover{opacity:.75;}
        .tog{transition:all .3s;}
        @keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}
        .pop{animation:pop .3s ease;}
        ${dark?`
        select{color-scheme:dark;}
        input[type=date]{color-scheme:dark;}
        `:""}
      `}</style>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header style={{
        background:dark?"rgba(11,17,32,.96)":"rgba(255,255,255,.96)",
        backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${T.brd}`,
        position:"sticky",top:0,zIndex:200,
        boxShadow:dark?"0 2px 24px rgba(0,0,0,.4)":"0 2px 16px rgba(0,0,0,.06)",
      }}>
        <div style={{maxWidth:1440,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
              <span style={{fontSize:16}}>🚀</span>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:T.txt,letterSpacing:"-.4px",lineHeight:1.1}}>Bootcamp Schedule</div>
              <div style={{fontSize:10,color:T.txtSub,fontWeight:500,marginTop:1}}>TechUp · {cohort}</div>
            </div>
          </div>

          {/* Nav + controls */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <nav style={{display:"flex",gap:4,background:T.surf2,borderRadius:12,padding:4,border:`1px solid ${T.brd}`}}>
              {[{id:"schedule",label:"📅 ตารางเรียน"},{id:"subjects",label:"📚 รายวิชา"}].map(p=>(
                <button key={p.id} className="btn-ghost" onClick={()=>setPage(p.id)} style={{
                  padding:"6px 16px",borderRadius:9,fontWeight:600,fontSize:12,
                  background:page===p.id?T.accent:"transparent",
                  color:page===p.id?T.accentTx:T.txtSub,
                }}>
                  {p.label}
                </button>
              ))}
            </nav>

            {/* Export */}
            {wdays.length>0 && (
              <button className={`btn-accent ${csvFlash?"pop":""}`} onClick={handleExportCSV} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"7px 16px",borderRadius:10,
                background:csvFlash?T.accentDim:T.accent,
                color:T.accentTx,fontWeight:700,fontSize:12,
                boxShadow:dark?`0 0 16px ${T.accent}55`:"0 2px 8px rgba(0,0,0,.12)",
              }}>
                <span>{csvFlash?"✅":"⬇"}</span>
                {csvFlash?"ดาวน์โหลดแล้ว!":"Export CSV"}
              </button>
            )}

          </div>
        </div>
      </header>

      {/* ══ SCHEDULE PAGE ══════════════════════════════════════════════════ */}
      {page==="schedule"?(
        <main style={{maxWidth:1440,margin:"0 auto",padding:"24px 28px"}}>

          {/* Dashboard grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginBottom:24}}>

            {/* Cohort */}
            <div style={{...cardStyle,boxShadow:dark?"0 2px 12px rgba(0,0,0,.3)":"0 2px 8px rgba(0,0,0,.04)"}}>
              <label style={labelStyle}>🎓 รุ่น / Cohort</label>
              <select value={cohort} onChange={e=>setCohort(e.target.value)} style={{...inputStyle,fontSize:16,fontWeight:700}}>
                {["FSD11","FSD12","FSD13"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Start */}
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📌 วันเริ่มต้น</label>
              <input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{...inputStyle,borderColor:dark?"#554E00":"#FFE566"}}/>
            </div>

            {/* End */}
            <div style={{...cardStyle}}>
              <label style={labelStyle}>🏁 วันสิ้นสุด</label>
              <input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{...inputStyle,borderColor:dark?"#1A5533":"#90E0B0"}}/>
            </div>

            {/* Total days — accent card */}
            <div style={{...cardStyle,background:dark?"linear-gradient(135deg,#7A2E10,#9A3412)":"linear-gradient(135deg,#FFF4ED,#FFE1D2)",borderColor:dark?T.accentDim+"66":"#FED7C3",boxShadow:dark?`0 2px 16px ${T.accent}33`:"0 2px 8px rgba(0,0,0,.04)"}}>
              <label style={{...labelStyle,color:dark?"#FED7C3":T.accent}}>📊 วันเรียนทั้งหมด</label>
              <div style={{fontSize:38,fontWeight:800,color:dark?"#FFEDD5":T.accent,lineHeight:1}}>{totalDays}</div>
              <div style={{fontSize:10,color:dark?"#FED7C3":"#9A3412",marginTop:4}}>วัน (ไม่รวม เสาร์–อาทิตย์)</div>
            </div>

            {/* Total topics */}
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📚 วิชาทั้งหมด</label>
              <div style={{fontSize:36,fontWeight:800,color:dark?"#80DEFF":"#006699",lineHeight:1}}>{totalTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>หัวข้อใน {Object.keys(modules).length} module</div>
            </div>

            {/* Scheduled */}
            <div style={{...cardStyle}}>
              <label style={labelStyle}>✅ จัดตารางแล้ว</label>
              <div style={{fontSize:36,fontWeight:800,color:dark?"#90E0B0":"#0D6035",lineHeight:1}}>{scheduledTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>จาก {totalTopics} หัวข้อทั้งหมด</div>
            </div>

            {/* Progress */}
            <div style={{...cardStyle}}>
              <label style={labelStyle}>📈 ความคืบหน้า</label>
              <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                <span style={{fontSize:34,fontWeight:800,color:dark?"#FFB3CC":"#9B1A3A",lineHeight:1}}>{progressPct}</span>
                <span style={{fontSize:14,fontWeight:700,color:dark?"#FFB3CC":"#9B1A3A"}}>%</span>
              </div>
              <div style={{marginTop:10,height:5,borderRadius:3,background:T.brd2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,borderRadius:3,background:dark?`linear-gradient(90deg,#FDBA74,${T.accent})`:`linear-gradient(90deg,#FDBA74,${T.accent})`,transition:"width .6s ease"}}/>
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
            const firstDay = week[0];
            const lastDay  = week[week.length-1];
            const rangeStr = `${shortDate(firstDay)} – ${shortDate(lastDay)}`;

            return (
              <div key={wi} style={{marginBottom:20}}>
                {/* Week header row */}
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  {/* Week badge */}
                  <div style={{
                    display:"flex",alignItems:"center",gap:8,
                    background:dark?"#1A1D28":"white",
                    border:`1px solid ${T.brd}`,
                    borderRadius:12,padding:"5px 14px 5px 10px",
                    flexShrink:0,
                  }}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:T.accent,flexShrink:0}}/>
                    <span style={{fontWeight:800,fontSize:13,color:T.txt}}>Week {wi+1}</span>
                    <span style={{fontSize:11,color:T.txtSub,fontWeight:500,borderLeft:`1px solid ${T.brd}`,paddingLeft:9,marginLeft:1}}>{rangeStr}</span>
                  </div>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,${T.brd},transparent)`}}/>
                </div>

                {/* Day columns */}
                <div style={{display:"grid",gridTemplateColumns:`repeat(${week.length},1fr)`,gap:10}}>
                  {week.map((date,di)=>{
                    const dayIdx = date.getDay()-1;
                    const dKeyStr = DAY_KEY[dayIdx]||"Mon";
                    const dc = DC[dKeyStr];
                    const dateKey = dkey(date);
                    const sessions = getSess(dateKey);

                    return (
                      <div key={di} style={{
                        background:dc.bg,
                        borderRadius:14,
                        border:`1.5px solid ${dc.ac}66`,
                        overflow:"hidden",
                        boxShadow:dark?"0 2px 12px rgba(0,0,0,.3)":"0 2px 8px rgba(0,0,0,.05)",
                      }}>
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
                            const isFirst = si===0;
                            const col = mc(sess.module);
                            // Session 1 always neutral white/dark
                            const cardBg = isFirst?(dark?"#1A1D28":"#FFFFFF"):(sess.module?col.bg:(dark?"#1A1D28":"#FFFFFF"));
                            const cardBd = isFirst?(dark?"#2A2E45":"#EBEBF5"):(sess.module?col.bd:(dark?"#2A2E45":"#EBEBF5"));
                            const selBg  = isFirst?(dark?"#1F2335":"#F8F8FF"):(sess.module?col.bg:(dark?"#1F2335":"#F8F8FF"));
                            const selBd  = isFirst?(dark?"#353A55":"#D5D0EE"):(sess.module?col.bd:(dark?"#353A55":"#D5D0EE"));
                            const selTx  = isFirst?T.txt:(sess.module?col.tx:T.txtMuted);

                            return (
                              <div key={si} className="hov-lift" style={{
                                background:cardBg,borderRadius:10,
                                border:`1.5px solid ${cardBd}`,
                                padding:"8px 9px 7px",
                                marginBottom:si<sessions.length-1?6:0,
                                position:"relative",
                              }}>
                                <div style={{fontSize:8,fontWeight:700,color:T.txtMuted,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>
                                  S{si+1}
                                </div>

                                <select value={sess.module} onChange={e=>setSess(dateKey,si,"module",e.target.value)} style={{
                                  width:"100%",padding:"4px 6px",borderRadius:7,
                                  border:`1.5px solid ${selBd}`,fontSize:10,fontWeight:600,
                                  color:sess.module?selTx:T.txtMuted,
                                  background:selBg,outline:"none",marginBottom:4,
                                }}>
                                  <option value="">— Module —</option>
                                  {Object.keys(modules).map(m=><option key={m} value={m}>{m}</option>)}
                                </select>

                                {sess.module&&(
                                  <select value={sess.topic} onChange={e=>setSess(dateKey,si,"topic",e.target.value)} style={{
                                    width:"100%",padding:"4px 6px",borderRadius:7,
                                    border:`1.5px solid ${isFirst?(dark?"#353A55":"#D5D0EE"):col.bd}`,
                                    fontSize:9,
                                    color:isFirst?T.txt:col.tx,
                                    background:dark?"#1F2335":"white",outline:"none",
                                  }}>
                                    <option value="">— หัวข้อ —</option>
                                    {(modules[sess.module]||[]).map((t,ti)=><option key={ti} value={t}>{t}</option>)}
                                  </select>
                                )}

                                {sessions.length>1&&(
                                  <button onClick={()=>rmSess(dateKey,si)} className="btn-ghost" style={{
                                    position:"absolute",top:5,right:5,
                                    background:"none",fontSize:10,color:T.txtMuted,padding:2,
                                  }}>✕</button>
                                )}
                              </div>
                            );
                          })}

                          {sessions.length<4&&(
                            <button className="btn-ghost" onClick={()=>addSess(dateKey)} style={{
                              width:"100%",marginTop:6,padding:"4px",borderRadius:8,
                              border:`1.5px dashed ${dark?"#2A2E45":dc.ac}`,
                              background:"transparent",fontSize:10,
                              color:dark?"#3A4060":"#AAA",fontWeight:500,
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
                display:"flex",alignItems:"center",gap:8,
                padding:"12px 22px",borderRadius:14,
                background:csvFlash?T.accentDim:T.accent,
                color:T.accentTx,fontWeight:700,fontSize:13,
                boxShadow:dark?`0 4px 24px ${T.accent}55`:"0 4px 20px rgba(0,0,0,.18)",
                border:"none",
              }}>
                <span style={{fontSize:15}}>{csvFlash?"✅":"⬇"}</span>
                {csvFlash?"ดาวน์โหลดแล้ว!":"Export CSV"}
              </button>
            </div>
          )}
        </main>

      ) : (
        /* ══ SUBJECTS PAGE ════════════════════════════════════════════════ */
        <main style={{maxWidth:1060,margin:"0 auto",padding:"26px 28px"}}>
          <div style={{marginBottom:22}}>
            <h2 style={{fontWeight:800,fontSize:22,color:T.txt,marginBottom:4,letterSpacing:"-.4px"}}>📚 รายวิชาทั้งหมด</h2>
            <p style={{fontSize:12,color:T.txtSub}}>เพิ่ม Module และหัวข้อย่อย — จะปรากฏในตารางเรียนทันที</p>
          </div>

          {/* Stats row */}
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            {[
              {l:"Module ทั้งหมด",v:Object.keys(modules).length,c:T.accent},
              {l:"หัวข้อทั้งหมด",v:totalTopics,c:dark?"#80DEFF":"#006699"},
              {l:"จัดตารางแล้ว",v:scheduledTopics,c:dark?"#90E0B0":"#0D6035"},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,...cardStyle}}>
                <div style={{fontSize:9,color:T.txtSub,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{s.l}</div>
                <div style={{fontSize:28,fontWeight:800,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Add module */}
          <div style={{...cardStyle,display:"flex",gap:10,alignItems:"center",marginBottom:18}}>
            <input value={newMod} onChange={e=>setNewMod(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addModule()}
              placeholder="ชื่อ Module ใหม่…"
              style={{...inputStyle,flex:1,fontSize:13}}
            />
            <button onClick={addModule} className="btn-accent" style={{
              padding:"9px 20px",borderRadius:10,
              background:T.accent,
              color:T.accentTx,fontWeight:700,fontSize:13,
            }}>+ เพิ่ม Module</button>
          </div>

          {/* Module cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
            {Object.entries(modules).map(([mod,topics])=>{
              const col=mc(mod);
              const isOpen=openMod===mod;
              return (
                <div key={mod} className="modc" style={{
                  background:col.bg,borderRadius:14,border:`1.5px solid ${col.bd}`,overflow:"hidden",
                  boxShadow:dark?"0 2px 12px rgba(0,0,0,.3)":"0 2px 8px rgba(0,0,0,.05)",
                }}>
                  <div onClick={()=>setOpenMod(isOpen?null:mod)} style={{
                    padding:"12px 14px",display:"flex",alignItems:"center",
                    justifyContent:"space-between",cursor:"pointer",
                    borderBottom:isOpen?`1px solid ${col.bd}`:"none",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:col.dot,flexShrink:0}}/>
                      <span style={{fontWeight:700,fontSize:13,color:col.tx}}>{mod}</span>
                      <span style={{fontSize:10,color:col.tx,opacity:.6,background:col.bd+"55",borderRadius:20,padding:"1px 7px"}}>{topics.length}</span>
                    </div>
                    <div style={{display:"flex",gap:5,alignItems:"center"}}>
                      <span style={{fontSize:10,color:col.tx,opacity:.5}}>{isOpen?"▲":"▼"}</span>
                      <button onClick={e=>{e.stopPropagation();rmModule(mod);}} className="btn-ghost" style={{background:"none",color:T.remBtn,fontSize:13}}>🗑</button>
                    </div>
                  </div>
                  {isOpen&&(
                    <div style={{padding:"10px 14px"}}>
                      {topics.map((t,ti)=>(
                        <div key={ti} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:5}}>
                          <div style={{width:4,height:4,borderRadius:"50%",background:col.dot,marginTop:8,flexShrink:0}}/>
                          <span style={{flex:1,fontSize:11,color:col.tx,lineHeight:1.6}}>{t}</span>
                          <button onClick={()=>rmTopic(mod,ti)} className="btn-ghost" style={{background:"none",color:T.txtMuted,fontSize:11}}>✕</button>
                        </div>
                      ))}
                      <div style={{display:"flex",gap:7,marginTop:10}}>
                        <input value={newTopics[mod]||""} onChange={e=>setNewTopics(p=>({...p,[mod]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTopic(mod)}
                          placeholder="เพิ่มหัวข้อใหม่…"
                          style={{flex:1,padding:"6px 10px",borderRadius:9,border:`1.5px solid ${col.bd}`,fontSize:11,outline:"none",background:dark?"#141720":"white",color:col.tx}}
                        />
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

