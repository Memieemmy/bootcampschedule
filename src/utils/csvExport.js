import { groupByWeek, dkey, fmtFull } from "./dateHelpers";
import { DAY_FULL } from "../constants/theme";

export function buildCSV(wdays, getSessFn) {
  const rows = [["Week","Date","Day","Start Time","End Time","Session","Module","Topic","Category","Note","Check"]];
  groupByWeek(wdays).forEach((week, wi) => {
    week.forEach(date => {
      const dayIdx = date.getDay() - 1;
      const dateKey = dkey(date);
      getSessFn(dateKey).forEach((sess, si) => {
        if (!sess.module && !sess.topic) return;
        rows.push([
          `Week ${wi + 1}`,
          fmtFull(date),
          DAY_FULL[dayIdx] || "",
          sess.start_time || "",
          sess.end_time || "",
          `Session ${si + 1}`,
          sess.module || "",
          sess.topic || "",
          sess.module || "",
          "",
          "",
        ]);
      });
    });
  });
  return rows
    .map(r => r.map(c => {
      const s = String(c);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : `${s}`;
    }).join(","))
    .join("\n");
}

export function downloadCSV(content, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
