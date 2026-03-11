import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ── Seed data (for module restore) ────────────────────────────────────────────
const SEED_MODULES = [
  { name:'GIT',            color_config:{l:{bg:"#FFF0F5",bd:"#FFB3CC",tx:"#9B1A3A",dot:"#FF6B8A"},d:{bg:"#2A1520",bd:"#5A2535",tx:"#FFB3CC",dot:"#FF6B8A"}} },
  { name:'Algorithms',     color_config:{l:{bg:"#FFF8EC",bd:"#FFD09B",tx:"#8B4A00",dot:"#FF9E3D"},d:{bg:"#2A1E00",bd:"#5A3E00",tx:"#FFD09B",dot:"#FF9E3D"}} },
  { name:'CSS',            color_config:{l:{bg:"#EFF7FF",bd:"#B0CEFF",tx:"#1A5599",dot:"#4DA6FF"},d:{bg:"#0D2035",bd:"#1A4070",tx:"#B0CEFF",dot:"#4DA6FF"}} },
  { name:'JS',             color_config:{l:{bg:"#FFFEF0",bd:"#FFE566",tx:"#7A5800",dot:"#FFD700"},d:{bg:"#25200A",bd:"#554500",tx:"#FFE566",dot:"#FFD700"}} },
  { name:'Nodejs',         color_config:{l:{bg:"#F0FFF8",bd:"#90E0B0",tx:"#0D6035",dot:"#3DBD78"},d:{bg:"#0A2318",bd:"#144D30",tx:"#90E0B0",dot:"#3DBD78"}} },
  { name:'RDBMS',          color_config:{l:{bg:"#F5F0FF",bd:"#C4ADFF",tx:"#4A1EA8",dot:"#9B6DFF"},d:{bg:"#180E35",bd:"#3D2880",tx:"#C4ADFF",dot:"#9B6DFF"}} },
  { name:'React',          color_config:{l:{bg:"#EDFCFF",bd:"#80DEFF",tx:"#005580",dot:"#00BFFF"},d:{bg:"#001C2A",bd:"#004466",tx:"#80DEFF",dot:"#00BFFF"}} },
  { name:'RWEP',           color_config:{l:{bg:"#FFF0FA",bd:"#FFB3E0",tx:"#880060",dot:"#FF69B4"},d:{bg:"#280018",bd:"#550035",tx:"#FFB3E0",dot:"#FF69B4"}} },
  { name:'TypeScript',     color_config:{l:{bg:"#EEF2FF",bd:"#A0B8FF",tx:"#2040A0",dot:"#5580CC"},d:{bg:"#0D1530",bd:"#1A3370",tx:"#A0B8FF",dot:"#5580CC"}} },
  { name:'SkillCheckpoint',color_config:{l:{bg:"#F0FFF4",bd:"#7DDC7D",tx:"#0D550D",dot:"#4CAF50"},d:{bg:"#0A200A",bd:"#144D14",tx:"#7DDC7D",dot:"#4CAF50"}} },
  { name:'PersonalBlog',   color_config:{l:{bg:"#FFF8F0",bd:"#FFCC80",tx:"#8B4A00",dot:"#FFA726"},d:{bg:"#251500",bd:"#502A00",tx:"#FFCC80",dot:"#FFA726"}} },
  { name:'Bootcamp_Info',  color_config:{l:{bg:"#F8F0FF",bd:"#C8B8FF",tx:"#4400AA",dot:"#7C4DFF"},d:{bg:"#150033",bd:"#2D0066",tx:"#C8B8FF",dot:"#7C4DFF"}} },
  { name:'CareerPrep',     color_config:{l:{bg:"#FFF0F7",bd:"#FFB3D1",tx:"#7A0035",dot:"#FF4081"},d:{bg:"#250010",bd:"#550025",tx:"#FFB3D1",dot:"#FF4081"}} },
  { name:'CareerSkills',   color_config:{l:{bg:"#EFF6FF",bd:"#99CCFF",tx:"#004080",dot:"#2196F3"},d:{bg:"#001525",bd:"#00305A",tx:"#99CCFF",dot:"#2196F3"}} },
  { name:'Softskill',      color_config:{l:{bg:"#FFF5EE",bd:"#FFB380",tx:"#662800",dot:"#FF7043"},d:{bg:"#1E0D00",bd:"#451C00",tx:"#FFB380",dot:"#FF7043"}} },
  { name:'Speaker',        color_config:{l:{bg:"#F0FFF4",bd:"#A0E0A0",tx:"#0D4D0D",dot:"#66BB6A"},d:{bg:"#0A1A0A",bd:"#154015",tx:"#A0E0A0",dot:"#66BB6A"}} },
  { name:'Holiday',        color_config:{l:{bg:"#F9FAFB",bd:"#D1D5DB",tx:"#9CA3AF",dot:"#9CA3AF"},d:{bg:"#1E2030",bd:"#3A3E5A",tx:"#6B7280",dot:"#4B5563"}} },
];

const SEED_TOPICS = {
  GIT:['Git: Refs, Merging, Rebasing, Fixing Mistakes','Git: Remote Repository, Pull Request'],
  Algorithms:['Basic Algorithm Operations and Step','Algorithm Session (From Steps to Code I)','Algorithm Session (From Steps to Code II)','Algorithm Session (Linear Search)','Algorithm Session (Binary Search)','Algorithm Session (Nested Loop)','Algorithm Session (Bubble Sort)','Algo Exercise Guiding (Roman Integer, Moving Zeros, X)','More Algo Problem Patterns Guiding (Sliding Windows and Etc)'],
  CSS:['CSS: S&P, Pseudo, Specificity','CSS: Direction & Box model, Units, Fonts','CSS: Flexbox','CSS: Colors, Positioned, CSS Vars','Cursor AI Features','CSS: Tailwind CSS','CSS: Responsive Design','HTML CSS Mini Project 🚀'],
  JS:['JS: Values & Variable, Primitive Values, Type Conversion, Intro to Debugging','JS: Objects + Array','JS: Functions, Equality of Values, If-Else','JS: Loops','JS: CB and HoF','JS: Asynchronicity, Promise, Async/Await','JS: CB and HoF Revisiting','JS: Built-In Array Function 1','JS: Built-In Array Function 2','JS: Scopes, ECMAScript Feature','JS: Algorithm Session (Big O)'],
  Nodejs:['Node.js: REST API Design','Node.js: Node.js, Express, Module','Node.js: Build Creating Data API','Node.js: Build the Complete CRUD APIs (Read All / Read Id)','Node.js: Build the Complete CRUD APIs (Update / Delete / Read with Query Params)','Node.js: API Validation & Middlewares & Router','Node.js: Basic Queries in MongoDB','Node.js: Connect MongoDB and Express','Node.js: Authentication & JWT Authentication 1','Node.js: Authentication & JWT Authentication 2','Next.js + Prisma ORM Workshop'],
  RDBMS:['RDBMS: Database Management System, Intro to Relational Database, Relational Database Design','RDBMS: PostgreSQL, Basic Queries in SQL','RDBMS: Joining Table','RDBMS: SQL Aggregations, SQL Tuning Performance'],
  React:['REACT: Intro to React, Vite, React Component','REACT: JSX + Module','REACT: Props','REACT: Revisiting React (Component, Props, Module)','REACT: Component Styling','REACT: Rendering Lists Workshop','REACT: React States + Form Handling Workshop','REACT: Manipulating Array State','REACT: React Quick Form Mini Project','REACT: Client-Server Architecture, Connect the APIs in JavaScript, Data Fetching','REACT: React Router','REACT: Revisiting React (Data Fetching and Router)','REACT: React Custom Hook','REACT: React Context API'],
  RWEP:['RWEP: Software Development Process & Software Deployments + Debugging Workshop','Authentication with services'],
  TypeScript:['From JS to TS','TypeScript in React'],
  SkillCheckpoint:['✅ Skill Checkpoint #1 (JavaScript1)','✅ Skill Checkpoint #2 (JavaScript2)','✅ Skill Checkpoint #3 (Frontend)','✅ Skill Checkpoint #4 (Backend)','✅ Skill Checkpoint #5 (Algorithm)'],
  PersonalBlog:['Personal Blog'],
  Bootcamp_Info:['Orientation [09:00 - 16:00]','Bootcamp Norms, HH briefing','Career Prep Phase Briefing','Final Project Norm Setting + Kick off meeting'],
  CareerPrep:['Career Prep Phase (Project 1)','Career Prep Phase (Project 2)','💼 Job Searching'],
  CareerSkills:['Cover Letter, Resume, LinkedIn','Technical Interviews - 2','Non-Technical Interviews','Vue','Java + OOP','Spring Boot','travel explorer Project Setup Workshop','💥Demo Day Rehearsal💥','💥Demo Day 💥','🎓Graduation Ceremony'],
  Softskill:['Communications','Giving and Receiving Feedback','Growth Mindset + Skills Map','Get Together #1','Get Together #2','Norm Setting','Learning How to Learn (Recall & Test) + Present HTML CSS Mini Project','Imposter Syndrome','Learning How to Learn 1 (focused & diffuse mode)','Learning How to Learn 2 (focused & diffuse mode)','Learning How to Learn 3 (focused & diffuse mode)'],
  Speaker:['Speaker #1 Succeeding in TechUp Bootcamp (Alumni)','Speaker #3 Switching into Dev Career (Alumni)'],
};

// ── Default color ─────────────────────────────────────────────────────────────
const DEFAULT_COLOR = {
  l: { bg:"#F5F5F5", bd:"#DDD", tx:"#555", dot:"#AAA" },
  d: { bg:"#1E2035", bd:"#3A3E5A", tx:"#9090B8", dot:"#6060A0" },
};

// ── Day palette ───────────────────────────────────────────────────────────────
const DAY_L = {
  Mon: { bg:"#FFFDF0", ac:"#FFE566", hd:"#FFF7BB", txt:"#5A4800" },
  Tue: { bg:"#FFF5F8", ac:"#FFB3CC", hd:"#FFD6E7", txt:"#7A1A35" },
  Wed: { bg:"#F2FFF9", ac:"#90E0B0", hd:"#C5F0D8", txt:"#0D5C30" },
  Thu: { bg:"#FFF7ED", ac:"#FDBA74", hd:"#FED7AA", txt:"#9A3412" },
  Fri: { bg:"#EFF7FF", ac:"#A8D4FF", hd:"#CCE7FF", txt:"#1A4D8C" },
};
const DAY_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const DAY_KEY  = ["Mon","Tue","Wed","Thu","Fri"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
function isWeekend(d){return d.getDay()===0||d.getDay()===6;}
function getWeekdays(s,e){const a=[];let c=new Date(s);while(c<=e){if(!isWeekend(c))a.push(new Date(c));c=addDays(c,1);}return a;}
function groupByWeek(days){const w=[];for(let i=0;i<days.length;i+=5)w.push(days.slice(i,i+5));return w;}
function dkey(d){return d.toISOString().slice(0,10);}
function shortDate(d){const dd=String(d.getDate()).padStart(2,"0"),mm=String(d.getMonth()+1).padStart(2,"0"),yy=String(d.getFullYear()).slice(2);return `${dd}/${mm}/${yy}`;}
function shortDateLMS(d){const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return `${String(d.getDate()).padStart(2,'0')} ${M[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;}
function fmtFull(d){return d.toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"});}

// ── CSV ───────────────────────────────────────────────────────────────────────
function buildCSV(wdays, getSessFn) {
  const rows=[["Week","Date","Day","Start Time","End Time","Session","Module","Topic","Category","Note","Check"]];
  groupByWeek(wdays).forEach((week,wi)=>{
    week.forEach(date=>{
      const dayIdx=date.getDay()-1,dateKey=dkey(date);
      getSessFn(dateKey).forEach((sess,si)=>{
        if(!sess.module&&!sess.topic)return;
        rows.push([`Week ${wi+1}`,fmtFull(date),DAY_FULL[dayIdx]||"",sess.start_time||"",sess.end_time||"",`Session ${si+1}`,sess.module||"",sess.topic||"",sess.module||"","",""]);
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
  // ── DB State ─────────────────────────────────────────────────────────────
  const [dbModules, setDbModules]       = useState([]);
  const [dbTopics, setDbTopics]         = useState([]);
  const [dbCohort, setDbCohort]         = useState(null);
  const [schedEntries, setSchedEntries] = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [page,setPage]           = useState("schedule");
  const [cohort,setCohort]       = useState("FSD11");
  const [sd,setSd]               = useState("2026-05-18");
  const [ed,setEd]               = useState("2026-10-09");
  const [newMod,setNewMod]       = useState("");
  const [newTopics,setNewTopics] = useState({});
  const [openMod,setOpenMod]     = useState(null);
  const [csvFlash,setCsvFlash]   = useState(false);
  const [editingModule,setEditingModule] = useState(null);
  const [editingTopic,setEditingTopic]   = useState(null);
  const [editDraft,setEditDraft]         = useState("");
  const [editStartTime,setEditStartTime] = useState("");
  const [editEndTime,setEditEndTime]     = useState("");
  // subjects page extra
  const [modFilter,setModFilter]       = useState("");
  const [showAddMod,setShowAddMod]     = useState(false);
  const [confirmModal,setConfirmModal] = useState(null);
  const [editingSession,setEditingSession] = useState(null); // {dateKey, si}
  const [modMenuOpen,setModMenuOpen]   = useState(null); // module name for action menu

  const isFirstRender = useRef(true);

  // ── Derived ───────────────────────────────────────────────────────────────
  const modules = useMemo(() => {
    const r={};
    dbModules.forEach(m=>{
      r[m.name]=dbTopics.filter(t=>t.module_id===m.id).sort((a,b)=>a.position-b.position).map(t=>t.text);
    });
    return r;
  },[dbModules,dbTopics]);

  const filteredModules = useMemo(()=>{
    const e=Object.entries(modules).filter(([m])=>!m.toLowerCase().includes('holiday'));
    if(!modFilter)return e;
    const q=modFilter.toLowerCase();
    return e.filter(([m])=>m.toLowerCase().includes(q));
  },[modules,modFilter]);

  const start  = useMemo(()=>sd?new Date(sd):null,[sd]);
  const end    = useMemo(()=>ed?new Date(ed):null,[ed]);
  const wdays  = useMemo(()=>start&&end&&end>=start?getWeekdays(start,end):[],[start,end]);
  const weeks  = useMemo(()=>groupByWeek(wdays),[wdays]);
  const totalDays      = wdays.length;
  const totalTopics    = useMemo(()=>Object.values(modules).reduce((s,t)=>s+t.length,0),[modules]);
  const scheduledTopics= useMemo(()=>schedEntries.filter(e=>e.module_id||e.topic_id).length,[schedEntries]);
  const progressPct    = totalTopics>0?Math.round(scheduledTopics/totalTopics*100):0;
  const missingCount   = SEED_MODULES.length - dbModules.length;

  // ── Theme ─────────────────────────────────────────────────────────────────
  const ACCENT="#1A237E", ACCENT_DIM="#151B60";
  const T={
    bg:"#FFFFFF",surf:"#FFFFFF",surf2:"#F9FAFB",
    brd:"#E5E7EB",brd2:"#D1D5DB",txt:"#111827",txtSub:"#4B5563",
    txtMuted:"#9CA3AF",inBg:"#FFFFFF",accent:ACCENT,accentDim:ACCENT_DIM,accentTx:"#FFFFFF",
  };

  function mc(modName){
    const c=dbModules.find(m=>m.name===modName)?.color_config;
    return c?.l||DEFAULT_COLOR.l;
  }

  // helper: get full topic DB object at index
  function getTopicObjAt(mod,index){
    const modObj=dbModules.find(m=>m.name===mod);
    if(!modObj)return null;
    return dbTopics.filter(t=>t.module_id===modObj.id).sort((a,b)=>a.position-b.position)[index]||null;
  }

  function askConfirm(title,desc,onConfirm){setConfirmModal({title,desc,onConfirm});}

  // ── Load helpers ──────────────────────────────────────────────────────────
  const loadModules = useCallback(async()=>{
    const [{data:mods},{data:tops}]=await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('topics').select('*').order('position'),
    ]);
    if(mods)setDbModules(mods);
    if(tops)setDbTopics(tops);
  },[]);

  const syncCohort = useCallback(async(name,startDate,endDate)=>{
    const{data:ex}=await supabase.from('cohorts').select('*').eq('name',name).maybeSingle();
    if(ex){
      await supabase.from('cohorts').update({start_date:startDate,end_date:endDate}).eq('id',ex.id);
      const u={...ex,start_date:startDate,end_date:endDate};setDbCohort(u);return u;
    }else{
      const{data:n}=await supabase.from('cohorts').insert({name,start_date:startDate,end_date:endDate}).select().single();
      setDbCohort(n);return n;
    }
  },[]);

  const loadSchedule = useCallback(async(cohortId)=>{
    if(!cohortId)return;
    const{data}=await supabase.from('schedule_entries').select('*').eq('cohort_id',cohortId).order('date').order('session_index');
    if(data)setSchedEntries(data);
  },[]);

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    async function init(){
      setLoading(true);
      // Ensure Holiday module exists in DB
      await supabase.from('modules').upsert(
        {name:'Holiday',color_config:{l:{bg:"#F9FAFB",bd:"#D1D5DB",tx:"#9CA3AF",dot:"#9CA3AF"},d:{bg:"#1E2030",bd:"#3A3E5A",tx:"#6B7280",dot:"#4B5563"}}},
        {onConflict:'name'}
      );
      await loadModules();
      const c=await syncCohort("FSD11","2026-05-18","2026-10-09");
      if(c)await loadSchedule(c.id);
      setLoading(false);
    }
    init();
  },[]);// eslint-disable-line

  useEffect(()=>{
    if(isFirstRender.current){isFirstRender.current=false;return;}
    if(!sd||!ed)return;
    async function sync(){const c=await syncCohort(cohort,sd,ed);if(c)await loadSchedule(c.id);}
    sync();
  },[cohort,sd,ed]);// eslint-disable-line

  // ── getSess: times come from schedule_entries (with topic fallback) ──────
  function getSess(dk){
    const entries=schedEntries.filter(e=>e.date===dk).sort((a,b)=>a.session_index-b.session_index);
    if(entries.length===0)return[
      {id:null,module:'',topic:'',start_time:'',end_time:'',note:''},
      {id:null,module:'',topic:'',start_time:'',end_time:'',note:''},
    ];
    return entries.map(e=>{
      const topicObj=e.topic_id?dbTopics.find(t=>t.id===e.topic_id):null;
      return{
        id:e.id,
        module:dbModules.find(m=>m.id===e.module_id)?.name||'',
        topic:topicObj?.text||'',
        start_time:(e.start_time?.slice(0,5))||(topicObj?.start_time?.slice(0,5))||'',
        end_time:(e.end_time?.slice(0,5))||(topicObj?.end_time?.slice(0,5))||'',
      note:e.note||'',
      };
    });
  }

  // ── Session CRUD ──────────────────────────────────────────────────────────
  async function setSess(dateKey,idx,field,val){
    if(!dbCohort)return;
    const si=idx+1;
    const ex=schedEntries.find(e=>e.date===dateKey&&e.session_index===si);
    let updates={};
    if(field==='module'){const m=val?dbModules.find(m=>m.name===val):null;updates={module_id:m?.id||null,topic_id:null,start_time:null,end_time:null};}
    else if(field==='topic'){
      const mid=ex?.module_id;
      const t=val?dbTopics.find(t=>t.text===val&&t.module_id===mid):null;
      updates={topic_id:t?.id||null};
      // auto-fill times from topic defaults if topic has them and session doesn't yet
      if(t?.start_time&&!ex?.start_time)updates.start_time=t.start_time;
      if(t?.end_time&&!ex?.end_time)updates.end_time=t.end_time;
    }
    else if(field==='start_time'){updates={start_time:val||null};}
    else if(field==='end_time'){updates={end_time:val||null};}
    else if(field==='note'){updates={note:val||null};}
    await supabase.from('schedule_entries').upsert(
      {cohort_id:dbCohort.id,date:dateKey,session_index:si,...updates},
      {onConflict:'cohort_id,date,session_index'}
    );
    await loadSchedule(dbCohort.id);
  }

  async function addSess(dk){
    if(!dbCohort)return;
    const dbe=schedEntries.filter(e=>e.date===dk);
    const cur=dbe.length===0?2:dbe.length;
    if(cur>=4)return;
    await supabase.from('schedule_entries').insert({cohort_id:dbCohort.id,date:dk,session_index:cur+1});
    await loadSchedule(dbCohort.id);
  }

  async function rmSess(dk,idx){
    if(!dbCohort)return;
    const e=schedEntries.find(e=>e.date===dk&&e.session_index===idx+1);
    if(!e)return;
    await supabase.from('schedule_entries').delete().eq('id',e.id);
    const tor=schedEntries.filter(e=>e.date===dk&&e.session_index>idx+1).sort((a,b)=>a.session_index-b.session_index);
    for(const r of tor)await supabase.from('schedule_entries').update({session_index:r.session_index-1}).eq('id',r.id);
    await loadSchedule(dbCohort.id);
  }

  // ── Module CRUD ───────────────────────────────────────────────────────────
  async function addModule(name){
    const n=(name||newMod).trim();
    if(!n||dbModules.find(m=>m.name===n))return;
    const{data}=await supabase.from('modules').insert({name:n,color_config:DEFAULT_COLOR}).select().single();
    if(data)setDbModules(p=>[...p,data]);
    setNewMod("");
  }
  async function rmModule(mod){
    const o=dbModules.find(m=>m.name===mod);if(!o)return;
    await supabase.from('modules').delete().eq('id',o.id);
    setDbModules(p=>p.filter(m=>m.id!==o.id));
    setDbTopics(p=>p.filter(t=>t.module_id!==o.id));
  }
  async function updateModuleName(oldName,newName){
    const n=(newName||"").trim();
    if(!n||n===oldName||dbModules.find(m=>m.name===n))return;
    const o=dbModules.find(m=>m.name===oldName);if(!o)return;
    await supabase.from('modules').update({name:n}).eq('id',o.id);
    setDbModules(p=>p.map(m=>m.id===o.id?{...m,name:n}:m));
    setEditingModule(null);setEditDraft("");
    if(openMod===oldName)setOpenMod(n);
  }

  // ── Topic CRUD (now includes start_time, end_time) ────────────────────────
  async function addTopic(mod,text){
    const t=(text||newTopics[mod]||"").trim();if(!t)return;
    const o=dbModules.find(m=>m.name===mod);if(!o)return;
    const pos=dbTopics.filter(tp=>tp.module_id===o.id).length+1;
    const{data}=await supabase.from('topics').insert({module_id:o.id,text:t,position:pos}).select().single();
    if(data)setDbTopics(p=>[...p,data]);
    setNewTopics(p=>({...p,[mod]:""}));
  }

  async function rmTopic(mod,i){
    const o=dbModules.find(m=>m.name===mod);if(!o)return;
    const tops=dbTopics.filter(t=>t.module_id===o.id).sort((a,b)=>a.position-b.position);
    const tr=tops[i];if(!tr)return;
    await supabase.from('topics').delete().eq('id',tr.id);
    setDbTopics(p=>p.filter(t=>t.id!==tr.id));
  }

  async function updateTopic(mod,index,newText,startTime,endTime){
    const t=(newText||"").trim();if(!t)return;
    const o=dbModules.find(m=>m.name===mod);if(!o)return;
    const tops=dbTopics.filter(tp=>tp.module_id===o.id).sort((a,b)=>a.position-b.position);
    const tr=tops[index];if(!tr)return;
    const updates={text:t,start_time:startTime||null,end_time:endTime||null};
    await supabase.from('topics').update(updates).eq('id',tr.id);
    setDbTopics(p=>p.map(tp=>tp.id===tr.id?{...tp,...updates}:tp));
    setEditingTopic(null);setEditDraft("");setEditStartTime("");setEditEndTime("");
  }

  // ── Restore defaults ──────────────────────────────────────────────────────
  async function restoreDefaults(){
    setLoading(true);
    try{
      await supabase.from('modules').upsert(SEED_MODULES,{onConflict:'name'});
      const{data:allMods}=await supabase.from('modules').select('*');
      const{data:allTops}=await supabase.from('topics').select('*');
      if(!allMods)return;
      const byMid={};(allTops||[]).forEach(t=>{if(!byMid[t.module_id])byMid[t.module_id]=new Set();byMid[t.module_id].add(t.text);});
      const ins=[];
      for(const mod of allMods){
        const st=SEED_TOPICS[mod.name];if(!st)continue;
        const ex=byMid[mod.id]||new Set();
        st.forEach((text,i)=>{if(!ex.has(text))ins.push({module_id:mod.id,text,position:ex.size+i+1});});
      }
      if(ins.length>0)await supabase.from('topics').insert(ins);
      await loadModules();
    }finally{setLoading(false);}
  }

  // ── Confirm-wrapped handlers ───────────────────────────────────────────────
  function handleAddModuleRequest(){
    const n=newMod.trim();if(!n||dbModules.find(m=>m.name===n))return;
    askConfirm("Add new Module?",`Name: "${n}"`,async()=>{await addModule(n);setShowAddMod(false);});
  }
  function handleRmModuleRequest(mod){
    const tc=(modules[mod]||[]).length;
    askConfirm(`Delete Module "${mod}"?`,`This module has ${tc} topics — all will be permanently deleted`,()=>rmModule(mod));
  }
  function handleSaveModuleName(oldName,newName){
    const n=(newName||"").trim();if(!n||n===oldName||dbModules.find(m=>m.name===n))return;
    askConfirm("Rename Module?",`"${oldName}"  →  "${n}"`,()=>updateModuleName(oldName,n));
  }
  function handleAddTopicRequest(mod){
    const t=(newTopics[mod]||"").trim();if(!t)return;
    askConfirm("Add new topic?",`"${t}" in Module ${mod}`,()=>addTopic(mod,t));
  }
  function handleRmTopicRequest(mod,ti){
    const txt=(modules[mod]||[])[ti]||"";
    askConfirm("Delete this topic?",`"${txt}"`,()=>rmTopic(mod,ti));
  }
  function handleSaveTopicRequest(mod,ti,newText){
    const t=(newText||"").trim();if(!t)return;
    const old=(modules[mod]||[])[ti]||"";
    // capture current editStartTime/editEndTime in closure
    const st=editStartTime,et=editEndTime;
    const timeLabel=st||et?`\n⏰ ${st||'--:--'} – ${et||'--:--'}`:'';
    askConfirm("Edit topic?",`"${old}" → "${t}"${timeLabel}`,()=>updateTopic(mod,ti,t,st,et));
  }
  function handleRestoreRequest(){
    const miss=SEED_MODULES.filter(sm=>!dbModules.find(m=>m.name===sm.name));
    askConfirm("Restore missing Modules?",`Found ${miss.length} missing modules:\n${miss.map(m=>`• ${m.name}`).join("\n")}\n\nRestore with all topics?`,restoreDefaults);
  }

  function handleExportCSV(){
    downloadCSV(buildCSV(wdays,getSess),`Bootcamp_Schedule_${cohort}_${sd}_to_${ed}.csv`);
    setCsvFlash(true);setTimeout(()=>setCsvFlash(false),2200);
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const cardStyle={background:T.surf,borderRadius:16,border:`1px solid ${T.brd}`,padding:"16px 18px"};
  const inputStyle={width:"100%",padding:"9px 13px",borderRadius:10,border:`1.5px solid ${T.brd2}`,fontSize:13,color:T.txt,background:T.inBg,outline:"none"};
  const labelStyle={fontSize:9,color:T.txtSub,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:7,display:"block"};

  // ── Loading ───────────────────────────────────────────────────────────────
  if(loading)return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",fontFamily:"'Inter','Sarabun',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <div style={{color:ACCENT,fontWeight:700,fontSize:18}}>Loading...</div>
        <div style={{color:"#9CA3AF",fontSize:13,marginTop:8}}>Connecting to Supabase</div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",width:"100%",background:T.bg,color:T.txt,fontFamily:"'Inter','Sarabun','Noto Sans Thai',sans-serif"}}>
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

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header style={{background:"rgba(255,255,255,.96)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${T.brd}`,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 16px rgba(0,0,0,.06)"}}>
        <div style={{width:"100%",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:62}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16}}>🚀</span></div>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:T.txt,letterSpacing:"-.4px",lineHeight:1.1}}>Bootcamp Schedule</div>
              <div style={{fontSize:10,color:T.txtSub,fontWeight:500,marginTop:1}}>TechUp · {cohort}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <nav style={{display:"flex",gap:4,background:T.surf2,borderRadius:12,padding:4,border:`1px solid ${T.brd}`}}>
              {[{id:"schedule",label:"📅 Schedule"},{id:"subjects",label:"📚 Subjects"}].map(p=>(
                <button key={p.id} className="btn-ghost" onClick={()=>setPage(p.id)} style={{padding:"6px 16px",borderRadius:9,fontWeight:600,fontSize:12,background:page===p.id?T.accent:"transparent",color:page===p.id?T.accentTx:T.txtSub}}>{p.label}</button>
              ))}
            </nav>
            {wdays.length>0&&(
              <button className={`btn-accent ${csvFlash?"pop":""}`} onClick={handleExportCSV} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:10,background:csvFlash?ACCENT_DIM:T.accent,color:T.accentTx,fontWeight:700,fontSize:12,boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}>
                <span>{csvFlash?"✅":"⬇"}</span>{csvFlash?"Downloaded!":"Export CSV"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══ SCHEDULE PAGE ════════════════════════════════════════════════════ */}
      {page==="schedule"?(
        <main style={{width:"100%",padding:"24px",boxSizing:"border-box"}}>
          {/* Dashboard */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:12,marginBottom:24}}>
            <div style={cardStyle}>
              <label style={labelStyle}>🎓 Cohort</label>
              <select value={cohort} onChange={e=>setCohort(e.target.value)} style={{...inputStyle,fontSize:16,fontWeight:700}}>
                {["FSD11","FSD12","FSD13"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={cardStyle}>
              <label style={labelStyle}>📌 Start date</label>
              <input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{...inputStyle,borderColor:"#FFE566"}}/>
            </div>
            <div style={cardStyle}>
              <label style={labelStyle}>🏁 End date</label>
              <input type="date" value={ed} onChange={e=>setEd(e.target.value)} style={{...inputStyle,borderColor:"#90E0B0"}}/>
            </div>
            <div style={{...cardStyle,background:"linear-gradient(135deg,#FFF4ED,#FFE1D2)",borderColor:"#FED7C3"}}>
              <label style={{...labelStyle,color:T.accent}}>📊 Total school days</label>
              <div style={{fontSize:38,fontWeight:800,color:T.accent,lineHeight:1}}>{totalDays}</div>
              <div style={{fontSize:10,color:"#9A3412",marginTop:4}}>days (excl. weekends)</div>
            </div>
            <div style={cardStyle}>
              <label style={labelStyle}>📚 Total topics</label>
              <div style={{fontSize:36,fontWeight:800,color:"#006699",lineHeight:1}}>{totalTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>topics in {Object.keys(modules).length} modules</div>
            </div>
            <div style={cardStyle}>
              <label style={labelStyle}>✅ Scheduled</label>
              <div style={{fontSize:36,fontWeight:800,color:"#0D6035",lineHeight:1}}>{scheduledTopics}</div>
              <div style={{fontSize:10,color:T.txtSub,marginTop:4}}>of {totalTopics} topics total</div>
            </div>
            <div style={cardStyle}>
              <label style={labelStyle}>📈 Progress</label>
              <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                <span style={{fontSize:34,fontWeight:800,color:"#9B1A3A",lineHeight:1}}>{progressPct}</span>
                <span style={{fontSize:14,fontWeight:700,color:"#9B1A3A"}}>%</span>
              </div>
              <div style={{marginTop:10,height:5,borderRadius:3,background:T.brd2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,borderRadius:3,background:`linear-gradient(90deg,#FDBA74,${T.accent})`,transition:"width .6s ease"}}/>
              </div>
              <div style={{fontSize:9,color:T.txtMuted,marginTop:5}}>{scheduledTopics} / {totalTopics} topics</div>
            </div>
          </div>

          {/* Calendar */}
          {weeks.length===0&&(
            <div style={{textAlign:"center",color:T.txtMuted,padding:"80px 20px",fontSize:15}}>
              <div style={{fontSize:40,marginBottom:12}}>🗓</div>Select start and end dates
            </div>
          )}

          {weeks.map((week,wi)=>{
            const rangeStr=`${shortDate(week[0])} – ${shortDate(week[week.length-1])}`;
            return(
              <div key={wi} style={{marginBottom:20}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,background:"white",border:`1px solid ${T.brd}`,borderRadius:12,padding:"5px 14px 5px 10px",flexShrink:0}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:T.accent,flexShrink:0}}/>
                    <span style={{fontWeight:800,fontSize:13,color:T.txt}}>Week {wi+1}</span>
                    <span style={{fontSize:11,color:T.txtSub,fontWeight:500,borderLeft:`1px solid ${T.brd}`,paddingLeft:9,marginLeft:1}}>{rangeStr}</span>
                  </div>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,${T.brd},transparent)`}}/>
                </div>

                <div style={{display:"grid",gridTemplateColumns:`repeat(${week.length},1fr)`,gap:10}}>
                  {week.map((date,di)=>{
                    const dayIdx=date.getDay()-1;
                    const dc=DAY_L[DAY_KEY[dayIdx]||"Mon"];
                    const dateKey=dkey(date);
                    const sessions=getSess(dateKey);
                    const dayHasHoliday=sessions.some(s=>s.module?.toLowerCase().includes('holiday'));
                    return(
                      <div key={di} style={{background:dayHasHoliday?"#F5F5F5":dc.bg,borderRadius:14,border:`1.5px solid ${dayHasHoliday?"#D1D5DB":dc.ac+"66"}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                        {/* Day header */}
                        <div style={{background:dayHasHoliday?"#EBEBEB":dc.hd,padding:"8px 12px",borderBottom:`1px solid ${dayHasHoliday?"#D1D5DB":dc.ac+"55"}`}}>
                          <div style={{fontSize:9,fontWeight:700,color:dayHasHoliday?"#9CA3AF":dc.txt,textTransform:"uppercase",letterSpacing:.8,opacity:.7}}>{DAY_FULL[dayIdx]}</div>
                          <div style={{fontSize:14,fontWeight:800,color:dayHasHoliday?"#9CA3AF":dc.txt}}>{date.toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit"})}</div>
                          {dayHasHoliday&&<div style={{fontSize:9,color:"#9CA3AF",fontWeight:600,marginTop:1,letterSpacing:.3}}>🏖 Holiday</div>}
                        </div>

                        {/* Sessions */}
                        <div style={{padding:"7px 7px 9px"}}>
                          {dayHasHoliday?(
                            /* ── Holiday display ── */
                            <div style={{textAlign:"center",padding:"20px 8px"}}>
                              <div style={{fontSize:30,marginBottom:6}}>🏖</div>
                              <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",marginBottom:2}}>Holiday</div>
                              <div style={{fontSize:9,color:"#D1D5DB",marginBottom:10}}>Holiday</div>
                              <button onClick={()=>{
                                const hi=sessions.findIndex(s=>s.module?.toLowerCase().includes('holiday'));
                                if(hi>=0)setSess(dateKey,hi,'module','');
                              }} style={{padding:"4px 14px",borderRadius:7,border:"1px solid #D1D5DB",background:"#fff",color:"#6B7280",fontSize:10,fontWeight:500}}>🔓 Edit</button>
                            </div>
                          ):(
                            sessions.map((sess,si)=>{
                              const isEditing=editingSession?.dateKey===dateKey&&editingSession?.si===si;
                              const dateLabel=shortDateLMS(date);
                              const isHol=sess.module?.toLowerCase().includes('holiday');
                              const pillCol = mc(sess.module||"");
                              return(
                                <div key={si} className="hov-lift" style={{background:"#FFFFFF",borderRadius:10,border:`1.5px solid ${isEditing?"#6366F1":"#E5E7EB"}`,padding:"8px 9px",marginBottom:si<sessions.length-1?6:0,position:"relative",cursor:isEditing?"default":"pointer",transition:"border-color .15s"}}
                                  onClick={()=>{if(!isEditing)setEditingSession({dateKey,si});}}>

                                  {isEditing?(
                                    /* ── Edit mode ── */
                                    <div onClick={e=>e.stopPropagation()}>
                                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                                        <span style={{fontSize:8,fontWeight:700,color:"#6366F1",textTransform:"uppercase",letterSpacing:.8}}>S{si+1} · Edit</span>
                                        <button onClick={()=>setEditingSession(null)} style={{background:"none",fontSize:11,color:"#9CA3AF",padding:"0 2px",border:"none"}}>✕</button>
                                      </div>
                                      <select value={sess.module} onChange={e=>setSess(dateKey,si,"module",e.target.value)} style={{width:"100%",padding:"4px 6px",borderRadius:7,border:"1.5px solid #E5E7EB",fontSize:10,fontWeight:600,color:sess.module?T.txt:T.txtMuted,background:"#FAFAFA",outline:"none",marginBottom:4}}>
                                        <option value="">— Module —</option>
                                        <optgroup label="── Special ──">
                                          <option value="Holiday">🏖 Holiday</option>
                                        </optgroup>
                                        <optgroup label="── Modules ──">
                                          {Object.keys(modules).filter(m=>!m.toLowerCase().includes('holiday')).map(m=><option key={m} value={m}>{m}</option>)}
                                        </optgroup>
                                      </select>
                                      {sess.module&&!isHol&&(
                                        <select value={sess.topic} onChange={e=>setSess(dateKey,si,"topic",e.target.value)} style={{width:"100%",padding:"4px 6px",borderRadius:7,border:"1.5px solid #E5E7EB",fontSize:9,color:T.txtSub,background:"#FAFAFA",outline:"none",marginBottom:4}}>
                                          <option value="">— Topic —</option>
                                          {(modules[sess.module]||[]).map((t,ti)=><option key={ti} value={t}>{t}</option>)}
                                        </select>
                                      )}
                                      {sess.module&&!isHol&&(
                                        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:4}}>
                                          <span style={{fontSize:9,color:T.txtMuted,flexShrink:0}}>⏰</span>
                                          <input type="time" value={sess.start_time} onChange={e=>setSess(dateKey,si,"start_time",e.target.value)} style={{flex:1,padding:"2px 5px",borderRadius:5,border:"1px solid #E5E7EB",fontSize:9,background:"#FAFAFA",outline:"none",color:"#374151",minWidth:0}}/>
                                          <span style={{fontSize:9,color:T.txtMuted,flexShrink:0}}>–</span>
                                          <input type="time" value={sess.end_time} onChange={e=>setSess(dateKey,si,"end_time",e.target.value)} style={{flex:1,padding:"2px 5px",borderRadius:5,border:"1px solid #E5E7EB",fontSize:9,background:"#FAFAFA",outline:"none",color:"#374151",minWidth:0}}/>
                                        </div>
                                      )}
                                      {sess.module&&(
                                        <textarea
                                          value={sess.note||""}
                                          onChange={e=>setSess(dateKey,si,"note",e.target.value)}
                                          placeholder="Note for this session (e.g. need more time, add quiz)"
                                          rows={2}
                                          style={{width:"100%",marginTop:2,padding:"3px 6px",borderRadius:6,border:"1px solid #E5E7EB",fontSize:9,background:"#FFFFFF",outline:"none",color:"#374151",resize:"vertical"}}
                                        />
                                      )}
                                      {sess.id&&sessions.length>1&&(
                                        <button onClick={()=>{rmSess(dateKey,si);setEditingSession(null);}} style={{marginTop:6,width:"100%",padding:"3px",borderRadius:6,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:9,fontWeight:500,cursor:"pointer"}}>🗑 Delete session</button>
                                      )}
                                    </div>
                                  ):(
                                    /* ── View mode ── */
                                    <>
                                      <div style={{fontSize:10,fontWeight:500,color:sess.module?pillCol.tx:T.txtMuted,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"inline-block",background:sess.module?pillCol.bg:"transparent",borderRadius:9999,padding:"2px 8px",border:sess.module?`1px solid ${pillCol.bd}`:"none"}}>
                                        {sess.module || "Select Module"}
                                      </div>
                                      <div style={{fontSize:11.5,color:sess.topic?"#111827":"#C0C0C8",fontWeight:sess.topic?500:400,lineHeight:1.5,marginBottom:4,minHeight:18}}>
                                        {sess.topic||(sess.module?"— Select topic —":"+ Click to add")}
                                      </div>
                                      {sess.module&&!isHol&&(
                                        <>
                                          <div style={{marginTop:2,paddingTop:4,borderTop:"1px dotted #E5E7EB",fontSize:10,color:"#374151",display:"flex",alignItems:"center",gap:6}}>
                                            <span style={{fontSize:12}}>⏰</span>
                                            <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                              {sess.start_time||"--:--"} — {sess.end_time||"--:--"}
                                            </span>
                                          </div>
                                          {sess.note&&(
                                            <div style={{marginTop:3,fontSize:9,color:"#6B7280",lineHeight:1.5,whiteSpace:"pre-line"}}>
                                              {sess.note}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })
                          )}
                          {!dayHasHoliday&&sessions.length<4&&(
                            <button className="btn-ghost" onClick={()=>addSess(dateKey)} style={{width:"100%",marginTop:6,padding:"4px",borderRadius:8,border:`1.5px dashed ${dc.ac}`,background:"transparent",fontSize:10,color:"#AAA",fontWeight:500}}>+ Session</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {scheduledTopics>0&&(
            <div style={{position:"fixed",bottom:28,right:28,zIndex:300}}>
              <button className={`btn-accent ${csvFlash?"pop":""}`} onClick={handleExportCSV} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 22px",borderRadius:14,background:csvFlash?ACCENT_DIM:T.accent,color:T.accentTx,fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,.18)",border:"none"}}>
                <span style={{fontSize:15}}>{csvFlash?"✅":"⬇"}</span>{csvFlash?"Downloaded!":"Export CSV"}
              </button>
            </div>
          )}
        </main>

      ):(
        /* ══ SUBJECTS PAGE ════════════════════════════════════════════════════ */
        <main style={{width:"100%",padding:"24px",boxSizing:"border-box",background:"#F4F5F7",minHeight:"calc(100vh - 62px)"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,gap:12,flexWrap:"wrap"}}>
            <div>
              <h2 style={{fontWeight:800,fontSize:22,color:"#111827",marginBottom:3,letterSpacing:"-.4px"}}>📚 All subjects</h2>
              <p style={{fontSize:12,color:"#6B7280"}}>{Object.keys(modules).length} modules · {totalTopics} topics</p>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {missingCount>0&&(
                <button onClick={handleRestoreRequest} style={{padding:"7px 14px",borderRadius:9,background:"#FEF3C7",color:"#92400E",border:"1px solid #FDE68A",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                  🔄 Restore <span style={{background:"#FDE68A",borderRadius:20,padding:"1px 7px",fontSize:11}}>{missingCount}</span>
                </button>
              )}
              {!showAddMod&&(
                <button onClick={()=>setShowAddMod(true)} style={{padding:"7px 14px",borderRadius:9,background:"#111827",color:"#fff",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:15,lineHeight:1}}>+</span> Add Module
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[{l:"Total modules",v:Object.keys(modules).length,icon:"📦"},{l:"Total topics",v:totalTopics,icon:"📝"},{l:"Scheduled",v:scheduledTopics,icon:"✅"}].map((s,i)=>(
              <div key={i} style={{flex:1,background:"#fff",borderRadius:12,padding:"12px 16px",border:"1px solid #E5E7EB"}}>
                <div style={{fontSize:9,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{s.icon} {s.l}</div>
                <div style={{fontSize:24,fontWeight:800,color:"#111827"}}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Add module inline form */}
          {showAddMod&&(
            <div style={{background:"#fff",border:"1.5px dashed #D1D5DB",borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",gap:8,alignItems:"center"}}>
              <input value={newMod} onChange={e=>setNewMod(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")handleAddModuleRequest();if(e.key==="Escape"){setShowAddMod(false);setNewMod("");}}}
                placeholder="New module name…"
                style={{flex:1,padding:"8px 12px",borderRadius:9,border:"1.5px solid #E5E7EB",fontSize:13,outline:"none",color:"#111827"}} autoFocus/>
              <button onClick={handleAddModuleRequest} style={{padding:"8px 18px",borderRadius:9,background:"#111827",color:"#fff",fontSize:13,fontWeight:600}}>Add</button>
              <button onClick={()=>{setShowAddMod(false);setNewMod("");}} style={{padding:"8px 12px",borderRadius:9,background:"#F3F4F6",color:"#6B7280",fontSize:13}}>Cancel</button>
            </div>
          )}

          {/* Search */}
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#9CA3AF",pointerEvents:"none"}}>🔍</span>
            <input value={modFilter} onChange={e=>setModFilter(e.target.value)} placeholder="Search modules…"
              style={{width:"100%",padding:"9px 36px 9px 36px",borderRadius:10,border:"1.5px solid #E5E7EB",fontSize:13,background:"#fff",outline:"none",color:"#111827"}}/>
            {modFilter&&<button onClick={()=>setModFilter("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",fontSize:13,color:"#9CA3AF",padding:"2px 4px"}}>✕</button>}
          </div>

          {filteredModules.length===0&&(
            <div style={{textAlign:"center",padding:"48px 20px",color:"#9CA3AF",fontSize:14,background:"#fff",borderRadius:14,border:"1px solid #E5E7EB"}}>
              {modFilter?`No module found "${modFilter}"`:"No modules yet"}
            </div>
          )}

          {filteredModules.map(([mod,topics])=>{
            const isOpen=openMod===mod, isEditingThis=editingModule===mod;
            const allScheduled = topics.length>0 && topics.every((_,ti)=>{
              const topicObj = getTopicObjAt(mod,ti);
              return topicObj && schedEntries.some(e=>e.topic_id===topicObj.id);
            });
            return(
              <div key={mod} className="modc" style={{background:"#fff",borderRadius:12,border:`1px solid ${isOpen?"#D1D5DB":"#E5E7EB"}`,marginBottom:6,overflow:"hidden",boxShadow:isOpen?"0 2px 12px rgba(0,0,0,.07)":"none"}}>

                {/* Module row */}
                <div className="mod-row" style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,transition:"background .12s",position:"relative"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:allScheduled?"#16A34A":"#9CA3AF",flexShrink:0}}/>
                  {isEditingThis?(
                    <>
                      <input value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                        onKeyDown={e=>{e.stopPropagation();if(e.key==="Enter")handleSaveModuleName(mod,editDraft);if(e.key==="Escape"){setEditingModule(null);setEditDraft("");}}}
                        onClick={e=>e.stopPropagation()}
                        style={{flex:1,padding:"5px 10px",borderRadius:8,border:"1.5px solid #D1D5DB",fontSize:13,fontWeight:600,outline:"none",color:"#111827"}} autoFocus/>
                      <button onClick={e=>{e.stopPropagation();handleSaveModuleName(mod,editDraft);}} style={{padding:"5px 12px",borderRadius:8,background:"#111827",color:"#fff",fontSize:12,fontWeight:600}}>Save</button>
                      <button onClick={e=>{e.stopPropagation();setEditingModule(null);setEditDraft("");}} style={{padding:"5px 10px",borderRadius:8,background:"#F3F4F6",color:"#6B7280",fontSize:12}}>Cancel</button>
                    </>
                  ):(
                    <>
                      <span style={{fontWeight:600,fontSize:14,color:"#111827",flex:1,cursor:"pointer"}} onClick={()=>setOpenMod(isOpen?null:mod)}>{mod}</span>
                      <span style={{fontSize:11,color:"#6B7280",background:"#F3F4F6",borderRadius:20,padding:"2px 9px",flexShrink:0,fontWeight:500}}>{topics.length} topics</span>
                      <div style={{display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
                        <button className="mod-row-btn"
                          onClick={e=>{e.stopPropagation();setModMenuOpen(modMenuOpen===mod?null:mod);}}
                          style={{padding:"4px 10px",borderRadius:999,background:"#F9FAFB",border:"1px solid #E5E7EB",color:"#6B7280",fontSize:13,lineHeight:1,display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:0}}
                        >
                          ⋯
                        </button>
                        <button className="mod-row-btn"
                          onClick={e=>{e.stopPropagation();setOpenMod(isOpen?null:mod);setModMenuOpen(null);}}
                          style={{padding:"4px 10px",borderRadius:999,background:"#F9FAFB",border:"1px solid #E5E7EB",color:"#9CA3AF",fontSize:11,display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:0}}
                        >
                          {isOpen?"▲":"▼"}
                        </button>
                      </div>

                      {modMenuOpen===mod&&(
                        <div style={{position:"absolute",right:16,top:40,background:"#fff",borderRadius:10,boxShadow:"0 8px 24px rgba(15,23,42,.18)",border:"1px solid #E5E7EB",padding:"6px 0",zIndex:10,minWidth:120}}>
                          <button
                            onClick={e=>{e.stopPropagation();setEditingModule(mod);setEditDraft(mod);setOpenMod(mod);setModMenuOpen(null);}}
                            style={{width:"100%",textAlign:"left",padding:"6px 12px",fontSize:12,color:"#111827",background:"none",border:"none",cursor:"pointer"}}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={e=>{e.stopPropagation();setModMenuOpen(null);handleRmModuleRequest(mod);}}
                            style={{width:"100%",textAlign:"left",padding:"6px 12px",fontSize:12,color:"#DC2626",background:"none",border:"none",cursor:"pointer"}}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Topics */}
                {isOpen&&(
                  <div style={{borderTop:"1px solid #F3F4F6",padding:"10px 16px 14px",background:"#FAFAFA"}}>
                    {topics.length===0&&<div style={{fontSize:12,color:"#9CA3AF",textAlign:"center",padding:"10px 0"}}>No topics — add below</div>}

                    {topics.map((t,ti)=>{
                      const topicObj=getTopicObjAt(mod,ti);
                      const hasTime=topicObj?.start_time||topicObj?.end_time;
                      const isScheduled=topicObj?schedEntries.some(e=>e.topic_id===topicObj.id):false;
                      return(
                        <div key={ti} className="topic-row" style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>
                          <span style={{fontSize:10,color:isScheduled?"#16A34A":"#D1D5DB",fontWeight:700,width:20,textAlign:"right",flexShrink:0}}>{ti+1}</span>

                          {editingTopic?.mod===mod&&editingTopic?.index===ti?(
                            /* ── Edit mode ── */
                            <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                              {/* Text */}
                              <input value={editDraft} onChange={e=>setEditDraft(e.target.value)}
                                onKeyDown={e=>{if(e.key==="Escape"){setEditingTopic(null);setEditDraft("");setEditStartTime("");setEditEndTime("");}}}
                                style={{width:"100%",padding:"5px 9px",borderRadius:7,border:"1.5px solid #D1D5DB",fontSize:12,outline:"none",background:"#fff"}} autoFocus/>
                              {/* Times */}
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{fontSize:11,color:"#9CA3AF"}}>⏰</span>
                                <input type="time" value={editStartTime} onChange={e=>setEditStartTime(e.target.value)}
                                  style={{flex:1,padding:"4px 7px",borderRadius:6,border:"1.5px solid #E5E7EB",fontSize:11,outline:"none",background:"#fff",color:"#374151"}}/>
                                <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>–</span>
                                <input type="time" value={editEndTime} onChange={e=>setEditEndTime(e.target.value)}
                                  style={{flex:1,padding:"4px 7px",borderRadius:6,border:"1.5px solid #E5E7EB",fontSize:11,outline:"none",background:"#fff",color:"#374151"}}/>
                                <button onClick={()=>handleSaveTopicRequest(mod,ti,editDraft)} style={{padding:"4px 12px",borderRadius:7,background:"#111827",color:"#fff",fontSize:11,fontWeight:600,flexShrink:0}}>Save</button>
                                <button onClick={()=>{setEditingTopic(null);setEditDraft("");setEditStartTime("");setEditEndTime("");}} style={{padding:"4px 9px",borderRadius:7,background:"#F3F4F6",color:"#6B7280",fontSize:11,flexShrink:0}}>Cancel</button>
                              </div>
                            </div>
                          ):(
                            /* ── View mode ── */
                            <>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{t}</div>
                              </div>
                              {hasTime&&(
                                <span style={{fontSize:10,color:"#6B7280",display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:0}}>
                                  <span style={{fontSize:11}}>⏰</span>
                                  <span style={{fontFamily:"monospace",whiteSpace:"nowrap"}}>
                                    {topicObj.start_time?.slice(0,5)||'--:--'} – {topicObj.end_time?.slice(0,5)||'--:--'}
                                  </span>
                                </span>
                              )}
                              <span className="topic-actions" style={{display:"flex",gap:4,opacity:0,transition:"opacity .15s",flexShrink:0,marginLeft:4}}>
                                <button onClick={()=>{
                                  setEditingTopic({mod,index:ti});
                                  setEditDraft(t);
                                  setEditStartTime(topicObj?.start_time?.slice(0,5)||'');
                                  setEditEndTime(topicObj?.end_time?.slice(0,5)||'');
                                }} style={{padding:"2px 8px",borderRadius:5,background:"#F9FAFB",border:"1px solid #E5E7EB",color:"#6B7280",fontSize:11}}>✏️</button>
                                <button onClick={()=>handleRmTopicRequest(mod,ti)} style={{padding:"2px 8px",borderRadius:5,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:11}}>✕</button>
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Add topic */}
                    <div style={{display:"flex",gap:7,marginTop:10}}>
                      <input value={newTopics[mod]||""} onChange={e=>setNewTopics(p=>({...p,[mod]:e.target.value}))}
                        onKeyDown={e=>e.key==="Enter"&&handleAddTopicRequest(mod)}
                        placeholder="Add new topic…"
                        style={{flex:1,padding:"7px 11px",borderRadius:8,border:"1.5px solid #E5E7EB",fontSize:12,outline:"none",background:"#fff",color:"#111827"}}/>
                      <button onClick={()=>handleAddTopicRequest(mod)} style={{padding:"7px 16px",borderRadius:8,background:"#111827",color:"#fff",fontWeight:700,fontSize:13}}>+</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </main>
      )}

      {/* ══ CONFIRM MODAL ═══════════════════════════════════════════════════ */}
      {confirmModal&&(
        <div onClick={()=>setConfirmModal(null)} style={{position:"fixed",inset:0,background:"rgba(17,24,39,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:"24px 28px",width:360,maxWidth:"90vw",boxShadow:"0 8px 40px rgba(0,0,0,.22)"}}>
            <div style={{fontWeight:700,fontSize:16,color:"#111827",marginBottom:confirmModal.desc?8:20}}>{confirmModal.title}</div>
            {confirmModal.desc&&<div style={{fontSize:13,color:"#6B7280",marginBottom:20,lineHeight:1.7,whiteSpace:"pre-line"}}>{confirmModal.desc}</div>}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>setConfirmModal(null)} style={{padding:"8px 18px",borderRadius:9,background:"#F3F4F6",color:"#374151",fontSize:13,fontWeight:500}}>Cancel</button>
              <button onClick={()=>{confirmModal.onConfirm();setConfirmModal(null);}} style={{padding:"8px 20px",borderRadius:9,background:"#111827",color:"#fff",fontSize:13,fontWeight:700}}>Confirm ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
