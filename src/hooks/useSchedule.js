import { useState, useCallback } from "react";
import { supabase } from "../supabase";

export function useSchedule(dbModules, dbTopics) {
  const [schedEntries, setSchedEntries] = useState([]);

  const loadSchedule = useCallback(async (cohortId) => {
    if (!cohortId) return;
    const { data } = await supabase
      .from('schedule_entries')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('date')
      .order('session_index');
    if (data) setSchedEntries(data);
  }, []);

  // ── getSess: build display objects from raw DB entries ─────────────────────
  function getSess(dk) {
    const entries = schedEntries
      .filter(e => e.date === dk)
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

  // ── Session CRUD ───────────────────────────────────────────────────────────
  async function setSess(cohortId, dateKey, idx, field, val) {
    if (!cohortId) return;
    const si = idx + 1;
    const ex = schedEntries.find(e => e.date === dateKey && e.session_index === si);
    let updates = {};

    if (field === 'module') {
      const m = val ? dbModules.find(m => m.name === val) : null;
      updates = { module_id: m?.id || null, topic_id: null, start_time: null, end_time: null };
    } else if (field === 'topic') {
      const mid = ex?.module_id;
      const t = val ? dbTopics.find(t => t.text === val && t.module_id === mid) : null;
      updates = { topic_id: t?.id || null };
      if (t?.start_time && !ex?.start_time) updates.start_time = t.start_time;
      if (t?.end_time && !ex?.end_time) updates.end_time = t.end_time;
    } else if (field === 'start_time') {
      updates = { start_time: val || null };
    } else if (field === 'end_time') {
      updates = { end_time: val || null };
    } else if (field === 'note') {
      updates = { note: val || null };
    }

    await supabase
      .from('schedule_entries')
      .upsert(
        { cohort_id: cohortId, date: dateKey, session_index: si, ...updates },
        { onConflict: 'cohort_id,date,session_index' }
      );
    await loadSchedule(cohortId);
  }

  async function addSess(cohortId, dk) {
    if (!cohortId) return;
    const dbe = schedEntries.filter(e => e.date === dk);
    const cur = dbe.length === 0 ? 2 : dbe.length;
    if (cur >= 4) return;
    await supabase
      .from('schedule_entries')
      .insert({ cohort_id: cohortId, date: dk, session_index: cur + 1 });
    await loadSchedule(cohortId);
  }

  async function rmSess(cohortId, dk, idx) {
    if (!cohortId) return;
    const e = schedEntries.find(e => e.date === dk && e.session_index === idx + 1);
    if (!e) return;
    await supabase.from('schedule_entries').delete().eq('id', e.id);
    const toReorder = schedEntries
      .filter(e => e.date === dk && e.session_index > idx + 1)
      .sort((a, b) => a.session_index - b.session_index);
    for (const r of toReorder) {
      await supabase
        .from('schedule_entries')
        .update({ session_index: r.session_index - 1 })
        .eq('id', r.id);
    }
    await loadSchedule(cohortId);
  }

  return { schedEntries, loadSchedule, getSess, setSess, addSess, rmSess };
}
