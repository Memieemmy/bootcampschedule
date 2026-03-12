import { useState, useCallback } from "react";
import { supabase } from "../supabase";
import { DEFAULT_COLOR } from "../constants/theme";
import { SEED_MODULES, SEED_TOPICS } from "../constants/seedData";

export function useModules() {
  const [dbModules, setDbModules] = useState([]);
  const [dbTopics, setDbTopics]   = useState([]);

  const loadModules = useCallback(async () => {
    const [{ data: mods }, { data: tops }] = await Promise.all([
      supabase.from('modules').select('*').order('name'),
      supabase.from('topics').select('*').order('position'),
    ]);
    if (mods) setDbModules(mods);
    if (tops) setDbTopics(tops);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getTopicObjAt(mod, index, modules) {
    const modObj = dbModules.find(m => m.name === mod);
    if (!modObj) return null;
    return dbTopics
      .filter(t => t.module_id === modObj.id)
      .sort((a, b) => a.position - b.position)[index] || null;
  }

  function getModuleColor(modName) {
    const c = dbModules.find(m => m.name === modName)?.color_config;
    return c?.l || DEFAULT_COLOR.l;
  }

  // ── Module CRUD ────────────────────────────────────────────────────────────
  async function addModule(name) {
    const n = name.trim();
    if (!n || dbModules.find(m => m.name === n)) return;
    const { data } = await supabase
      .from('modules')
      .insert({ name: n, color_config: DEFAULT_COLOR })
      .select()
      .single();
    if (data) setDbModules(p => [...p, data]);
  }

  async function removeModule(mod) {
    const o = dbModules.find(m => m.name === mod);
    if (!o) return;
    await supabase.from('modules').delete().eq('id', o.id);
    setDbModules(p => p.filter(m => m.id !== o.id));
    setDbTopics(p => p.filter(t => t.module_id !== o.id));
  }

  async function updateModuleName(oldName, newName) {
    const n = newName.trim();
    if (!n || n === oldName || dbModules.find(m => m.name === n)) return;
    const o = dbModules.find(m => m.name === oldName);
    if (!o) return;
    await supabase.from('modules').update({ name: n }).eq('id', o.id);
    setDbModules(p => p.map(m => m.id === o.id ? { ...m, name: n } : m));
  }

  // ── Topic CRUD ─────────────────────────────────────────────────────────────
  async function addTopic(mod, text) {
    const t = text.trim();
    if (!t) return;
    const o = dbModules.find(m => m.name === mod);
    if (!o) return;
    const pos = dbTopics.filter(tp => tp.module_id === o.id).length + 1;
    const { data } = await supabase
      .from('topics')
      .insert({ module_id: o.id, text: t, position: pos })
      .select()
      .single();
    if (data) setDbTopics(p => [...p, data]);
  }

  async function removeTopic(mod, i) {
    const o = dbModules.find(m => m.name === mod);
    if (!o) return;
    const tops = dbTopics
      .filter(t => t.module_id === o.id)
      .sort((a, b) => a.position - b.position);
    const tr = tops[i];
    if (!tr) return;
    await supabase.from('topics').delete().eq('id', tr.id);
    setDbTopics(p => p.filter(t => t.id !== tr.id));
  }

  async function updateTopic(mod, index, newText, startTime, endTime) {
    const t = newText.trim();
    if (!t) return;
    const o = dbModules.find(m => m.name === mod);
    if (!o) return;
    const tops = dbTopics
      .filter(tp => tp.module_id === o.id)
      .sort((a, b) => a.position - b.position);
    const tr = tops[index];
    if (!tr) return;
    const updates = { text: t, start_time: startTime || null, end_time: endTime || null };
    await supabase.from('topics').update(updates).eq('id', tr.id);
    setDbTopics(p => p.map(tp => tp.id === tr.id ? { ...tp, ...updates } : tp));
  }

  // ── Restore defaults ───────────────────────────────────────────────────────
  async function restoreDefaults(onStart, onEnd) {
    onStart?.();
    try {
      await supabase.from('modules').upsert(SEED_MODULES, { onConflict: 'name' });
      const { data: allMods } = await supabase.from('modules').select('*');
      const { data: allTops } = await supabase.from('topics').select('*');
      if (!allMods) return;
      const byMid = {};
      (allTops || []).forEach(t => {
        if (!byMid[t.module_id]) byMid[t.module_id] = new Set();
        byMid[t.module_id].add(t.text);
      });
      const ins = [];
      for (const mod of allMods) {
        const st = SEED_TOPICS[mod.name];
        if (!st) continue;
        const ex = byMid[mod.id] || new Set();
        st.forEach((text, i) => {
          if (!ex.has(text)) ins.push({ module_id: mod.id, text, position: ex.size + i + 1 });
        });
      }
      if (ins.length > 0) await supabase.from('topics').insert(ins);
      await loadModules();
    } finally {
      onEnd?.();
    }
  }

  return {
    dbModules, dbTopics,
    loadModules,
    getTopicObjAt, getModuleColor,
    addModule, removeModule, updateModuleName,
    addTopic, removeTopic, updateTopic,
    restoreDefaults,
  };
}
