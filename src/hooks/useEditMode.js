import { useState } from "react";

export function useEditMode() {
  // ── เปิด/ปิด Edit Mode ──────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);

  // ── เก็บการเปลี่ยนแปลงชั่วคราว (ยังไม่ส่ง Supabase) ────────────────────
  // รูปแบบ: { "2026-06-02": [...sessions], "2026-06-03": [...sessions] }
  const [pendingChanges, setPendingChanges] = useState({});

  // ── เก็บ snapshot ของเดิมไว้ กรณีกด Cancel ──────────────────────────────
  const [originalSnapshot, setOriginalSnapshot] = useState({});

  // เริ่ม Edit Mode → เก็บ snapshot ของ state ปัจจุบันไว้ก่อน
  function startEdit(currentSessions) {
    setOriginalSnapshot(currentSessions);
    setPendingChanges(currentSessions);
    setIsEditMode(true);
  }

  // ยกเลิก → คืนค่ากลับเป็นของเดิม
  function cancelEdit() {
    setPendingChanges(originalSnapshot);
    setIsEditMode(false);
  }

  // อัปเดต pending เมื่อลากการ์ด (ยังไม่ส่ง Supabase)
  function moveCard(fromDate, toDate, sessionData) {
    setPendingChanges(prev => {
      const fromSessions = (prev[fromDate] || []).filter(s => s.id !== sessionData.id);
      const toSessions   = [...(prev[toDate] || []), sessionData];
      return { ...prev, [fromDate]: fromSessions, [toDate]: toSessions };
    });
  }

  return {
    isEditMode,
    pendingChanges,
    startEdit,
    cancelEdit,
    moveCard,
    setPendingChanges,
  };
}
