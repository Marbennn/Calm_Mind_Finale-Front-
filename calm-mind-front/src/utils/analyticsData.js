// src/utils/analyticsData.js

/* ---------------- storage ---------------- */
export function readTasksFromStorage() {
  try {
    const raw = localStorage.getItem("tasks") ?? localStorage.getItem("cm-tasks") ?? "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function readStressFromStorage() {
  // accept both earlier keys
  try {
    const raw = localStorage.getItem("cm_stress_logs_v1") ?? localStorage.getItem("cm-stress") ?? "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/* ---------------- task helpers ---------------- */
export function normalizeStatus(s) {
  const v = String(s || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (["completed","complete","done","finished"].includes(v)) return "completed";
  if (["in_progress","in-progress","progress","doing"].includes(v)) return "in_progress";
  if (["missing","overdue"].includes(v)) return "missing";
  if (["todo","to_do","to-do",""].includes(v)) return "todo";
  return "todo";
}

export function deriveStatus(t) {
  const base = normalizeStatus(t.status);
  if (base === "completed") return "completed";
  if (isPast(t.dueDate))   return "missing";
  if (base === "missing")  return "todo";
  return base; // 'todo' | 'in_progress'
}

export function isPast(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return false;
  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
  const t = new Date(`${yyyy_mm_dd}T00:00:00`).getTime();
  return t < startOfToday.getTime();
}

export function taskDateYMD(t) {
  if (t.dueDate) return t.dueDate;
  if (t.startDate) return t.startDate;
  const idNum = Number(t.id);
  if (Number.isFinite(idNum)) return new Date(idNum).toISOString().slice(0,10);
  return null;
}

/* ---------------- KPI / aggregations ---------------- */
export function getTaskCounts(tasks, derive = deriveStatus) {
  const res = { todo: 0, in_progress: 0, missing: 0, completed: 0 };
  tasks.forEach((t) => { res[derive(t)]++; });
  return res;
}

export function getPriorityDistribution(tasks) {
  const base = { High: 0, Medium: 0, Low: 0 };
  tasks.forEach((t) => {
    const key = t.priority || "Medium";
    if (base[key] !== undefined) base[key]++;
  });
  return [
    { name: "High", value: base.High },
    { name: "Medium", value: base.Medium },
    { name: "Low", value: base.Low },
  ];
}

/* ---------------- stress aggregations ---------------- */
export function aggregateStressLogs(logs, periods) {
  const bucket = new Map(periods.map((p) => [p.key, []]));
  logs.forEach((l) => {
    const d = new Date(l.ts || l.date);
    d.setHours(0,0,0,0);
    const match = periods.find((p) => d >= p.start && d <= p.end);
    if (match) bucket.get(match.key).push(Number(l.stress || l.level || 0));
  });
  return periods.map((p) => {
    const arr = bucket.get(p.key);
    const avg = arr && arr.length ? +(arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(2) : 0;
    return { label: p.label, stress: avg };
  });
}

/* ---------------- workload vs stress ---------------- */
export function buildWorkloadVsStress(tasks, stressSeries, periods, derive = deriveStatus, getDate = taskDateYMD) {
  const taskBucket = new Map(periods.map((p) => [p.key, 0]));
  tasks.forEach((t) => {
    const s = derive(t);
    if (s === "todo" || s === "in_progress") {
      const ymd = getDate(t); if (!ymd) return;
      const d = new Date(ymd); d.setHours(0,0,0,0);
      const match = periods.find((p) => d >= p.start && d <= p.end);
      if (match) taskBucket.set(match.key, (taskBucket.get(match.key) || 0) + 1);
    }
  });
  const stressMap = new Map(stressSeries.map((s) => [s.label, s.stress]));
  return periods.map((p) => ({
    label: p.label,
    workload: taskBucket.get(p.key) || 0,
    stress: stressMap.get(p.label) || 0,
  }));
}

/* ---------------- simple linear regression ---------------- */
/** computeRegression: returns { a, b } minimizing SSE for y = a + b x */
export function computeRegression(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) return { a: 0, b: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(xs[i] || 0);
    const y = Number(ys[i] || 0);
    sx += x; sy += y; sxx += x*x; sxy += x*y;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { a: sy / n || 0, b: 0 };
  const b = (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  return { a, b };
}
