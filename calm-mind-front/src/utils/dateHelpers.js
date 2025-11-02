// src/utils/dateHelpers.js
export const toDate = (v) => { const d = new Date(v); d.setHours(0,0,0,0); return d; };
export const fmtYMD = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const addDays = (d,n) => toDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()+n));
export const addWeeks = (d,n) => addDays(d, n*7);
export const startOfWeek = (d) => { const nd = new Date(d); const day = nd.getDay(); const diff = (day===0?-6:1) - day; nd.setDate(nd.getDate()+diff); return toDate(nd); };
export const startOfMonth = (d) => toDate(new Date(d.getFullYear(), d.getMonth(), 1));
export const startOfYear = (d) => toDate(new Date(d.getFullYear(), 0, 1));
export const addMonths = (d,n) => toDate(new Date(d.getFullYear(), d.getMonth()+n, 1));
export const addYears = (d,n) => toDate(new Date(d.getFullYear()+n, 0, 1));

export function buildPeriods(start, end, mode) {
  const periods = [];
  if (mode === "daily") {
    let cur = toDate(start);
    while (cur <= end) { periods.push({ key: fmtYMD(cur), label: fmtYMD(cur), start: cur, end: cur }); cur = addDays(cur,1); }
  } else if (mode === "weekly") {
    let cur = startOfWeek(start);
    while (cur <= end) { const label = `Wk of ${fmtYMD(cur)}`; periods.push({ key: label, label, start: cur, end: addDays(cur,6) }); cur = addWeeks(cur,1); }
  } else if (mode === "monthly") {
    let cur = startOfMonth(start);
    while (cur <= end) {
      const label = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,"0")}`;
      periods.push({ key: label, label, start: cur, end: toDate(new Date(cur.getFullYear(), cur.getMonth()+1, 0)) });
      cur = addMonths(cur,1);
    }
  } else if (mode === "yearly") {
    let cur = startOfYear(start);
    while (cur <= end) {
      const label = String(cur.getFullYear());
      periods.push({ key: label, label, start: cur, end: toDate(new Date(cur.getFullYear(), 11, 31)) });
      cur = addYears(cur, 1);
    }
  } else {
    // fallback to monthly
    return buildPeriods(start, end, "monthly");
  }
  return periods;
}
