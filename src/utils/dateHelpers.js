export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isWeekend(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}

export function getWeekdays(s, e) {
  const a = [];
  let c = new Date(s);
  while (c <= e) {
    if (!isWeekend(c)) a.push(new Date(c));
    c = addDays(c, 1);
  }
  return a;
}

export function groupByWeek(days) {
  const w = [];
  for (let i = 0; i < days.length; i += 5) w.push(days.slice(i, i + 5));
  return w;
}

export function dkey(d) {
  return d.toISOString().slice(0, 10);
}

export function shortDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

export function shortDateLMS(d) {
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')} ${M[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function fmtFull(d) {
  return d.toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" });
}
