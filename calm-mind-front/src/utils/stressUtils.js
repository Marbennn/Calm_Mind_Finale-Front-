// src/utils/stressUtils.js
import { DateTime } from 'luxon';

const PRIORITY = { LOW: 1, MEDIUM: 2, HIGH: 3 };
// Approximate max per-task stress using highest priority (3) + 10% overdue = 3.3
// Used only for normalized daily scale (1..5)
const MAX_STRESS = 3.2 * 5; // assume up to 5 high-priority tasks as baseline

export function calculateTaskStress(task) {
  const priorityWeight = PRIORITY[String(task?.priority || "").toUpperCase()] || 2;

  const isCompleted = task?.status === "completed" || task?.completed;
  if (isCompleted) return +(priorityWeight).toFixed(2);

  const now = DateTime.now();
  const due = task?.due_date ? DateTime.fromISO(task.due_date) : null;
  let deadlineDelta = 0;
  if (due && due.isValid) {
    const hoursToDue = due.diff(now, "hours").hours;
    const isOverdue = hoursToDue < 0;
    const within72h = !isOverdue && hoursToDue <= 72;
    deadlineDelta = isOverdue ? 0.10 : within72h ? 0.05 : 0;
  }
  const completionDelta = 0.10;
  return +(priorityWeight + deadlineDelta + completionDelta).toFixed(2);
}

export function calculateDailyStress(tasks) {
  const taskStresses = tasks.map(t => ({
    ...t,
    stress: calculateTaskStress(t)
  }));
  const total = taskStresses.reduce((s, t) => s + t.stress, 0);
  const perTaskMax = 3 + 0.10 + 0.10;
  const max = perTaskMax * tasks.length;
  const percent = max > 0 ? Number(((total / max) * 100).toFixed(1)) : 0;
  const normalized = 1 + (total / MAX_STRESS) * 4;
  return { total, max, percent, normalized: Number(normalized.toFixed(1)), taskStresses };
}

// === NEW: AVERAGE STRESS BY STATUS ===
export function calculateAverageStressByStatus(tasks) {
  const active = tasks.filter(t => !t.completed);
  const byStatus = { todo: [], in_progress: [], missing: [] };

  active.forEach(t => {
    const stress = calculateTaskStress(t);
    if (t.status === "missing") byStatus.missing.push(stress);
    else if (t.status === "in_progress") byStatus.in_progress.push(stress);
    else byStatus.todo.push(stress);
  });

  return {
    todo: byStatus.todo.length ? Number((byStatus.todo.reduce((a,b)=>a+b,0)/byStatus.todo.length).toFixed(1)) : 0,
    in_progress: byStatus.in_progress.length ? Number((byStatus.in_progress.reduce((a,b)=>a+b,0)/byStatus.in_progress.length).toFixed(1)) : 0,
    missing: byStatus.missing.length ? Number((byStatus.missing.reduce((a,b)=>a+b,0)/byStatus.missing.length).toFixed(1)) : 0,
    completed: 0
  };
}

// === CHARTS ===
export function buildStressOverTime(tasks, days = 7) {
  const now = DateTime.now();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = now.minus({ days: i }).startOf('day');
    const dayEnd = date.endOf('day');
    const dayTasks = tasks.filter(t => {
      const due = DateTime.fromISO(t.due_date);
      return due >= date && due <= dayEnd;
    });
    const { normalized = 1 } = calculateDailyStress(dayTasks);
    data.push({ label: date.toFormat('MMM dd'), stress: normalized });
  }
  return data;
}

export function buildPriorityData(tasks) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  tasks.forEach(t => !t.completed && t.priority && counts[t.priority]++);
  return [
    { name: 'High', value: counts.High },
    { name: 'Medium', value: counts.Medium },
    { name: 'Low', value: counts.Low }
  ];
}

export function buildWorkloadVsStress(tasks, days = 7) {
  const now = DateTime.now();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = now.minus({ days: i }).startOf('day');
    const dayEnd = date.endOf('day');
    const dayTasks = tasks.filter(t => {
      const due = DateTime.fromISO(t.due_date);
      return due >= date && due <= dayEnd;
    });
    const active = dayTasks.filter(t => !t.completed).length;
    const { normalized = 1 } = calculateDailyStress(dayTasks);
    data.push({ label: date.toFormat('MMM dd'), workload: active, stress: normalized });
  }
  return data;
}

export function getTagDistributionFromLogs(logs) {
  const counts = new Map();
  logs.forEach(l => (l.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries()).map(([name, value]) => ({
    name, value, pct: total ? Math.round((value / total) * 100) : 0
  }));
}

export function generateAIRecommendation(tasks, dailyStress) {
  const active = tasks.filter(t => !t.completed);
  if (active.length === 0) return "All tasks complete. You're in zen mode!";

  const top = active.sort((a, b) => calculateTaskStress(b) - calculateTaskStress(a))[0];
  const drop = (calculateTaskStress(top) / dailyStress.total * 100).toFixed(0);

  if (dailyStress.normalized >= 3.5)
    return `High stress! Complete "${top.title}" to reduce stress by ~${drop}%.`;
  if (dailyStress.normalized >= 2.5)
    return `Focus on "${top.title}" — due ${DateTime.fromISO(top.due_date).toRelative()}.`;
  return `Good pace. Next: "${top.title}" by ${DateTime.fromISO(top.due_date).toFormat('MMM dd')}.`;
}

// Plural: return suggestions for each active task, sorted by descending stress
export function generateAIRecommendations(tasks, dailyStress) {
  const active = tasks.filter(t => !t.completed);
  if (active.length === 0) return [];
  const scored = active
    .map(t => ({ task: t, stress: calculateTaskStress(t) }))
    .sort((a, b) => b.stress - a.stress);
  const total = dailyStress?.total || scored.reduce((s, x) => s + x.stress, 0) || 1;
  return scored.map(({ task, stress }) => {
    const dueTxt = task.due_date ? DateTime.fromISO(task.due_date).toRelative() : "no due date";
    const drop = Math.round((stress / total) * 100);
    return `"${task.title}" — priority ${task.priority || 'Medium'}, due ${dueTxt}. Completing this could reduce today's stress by ~${drop}%.`;
  });
}

// Overall (not per-task) recommendations based on overall stress percent
export function generateOverallRecommendations(tasks, dailyStress) {
  const percent = Number(dailyStress?.percent || 0);
  if (percent >= 75) {
    return [
      "Prioritize self-care: take a short walk, hydrate, and schedule a 10-minute reset.",
      "Tackle the top 1–2 highest-stress tasks first; break each into small steps.",
      "Reschedule or renegotiate non-urgent items to reduce load for today.",
    ];
  }
  if (percent >= 50) {
    return [
      "Focus on tasks due within 72 hours; timebox 25–30 minutes per block.",
      "Batch similar tasks to minimize context switching.",
      "Plan a short buffer after each task to avoid spillover stress.",
    ];
  }
  return [
    "Maintain momentum: plan the next 2–3 tasks for tomorrow.",
    "Wrap up loose ends or quick wins to keep stress low.",
    "Do a brief review of priorities and tidy your workspace.",
  ];
}

// === AI logic based on overall stress ===
export function deriveAIStressLevel(tasks, dailyStress) {
  const percent = Number(dailyStress?.percent || 0);
  const now = DateTime.now();
  let overdue = 0;
  let dueSoon = 0; // within 72h
  (tasks || []).forEach(t => {
    if (!t?.due_date || t.completed) return;
    const due = DateTime.fromISO(t.due_date);
    if (!due.isValid) return;
    const diffH = due.diff(now, 'hours').hours;
    if (diffH < 0) overdue += 1;
    else if (diffH <= 72) dueSoon += 1;
  });

  let label = 'Low';
  if (percent >= 75 || overdue >= 2) label = 'High';
  else if (percent >= 50 || overdue >= 1 || dueSoon >= 2) label = 'Moderate';

  return { percent, overdue, dueSoon, label };
}

export function buildChatbotReply(tasks, dailyStress) {
  const { percent, overdue, dueSoon, label } = deriveAIStressLevel(tasks, dailyStress);
  const p = Math.round(percent);

  // Next deadlines (top 3 upcoming, active tasks)
  const now = DateTime.now();
  const upcoming = (tasks || [])
    .filter(t => !t.completed && t.due_date)
    .map(t => ({
      title: t.title || 'Untitled',
      due: DateTime.fromISO(t.due_date)
    }))
    .filter(x => x.due.isValid)
    .sort((a, b) => a.due.toMillis() - b.due.toMillis())
    .slice(0, 3)
    .map(x => `${x.title} (${x.due.toFormat('MMM dd')})`);
  const nextTxt = upcoming.length ? upcoming.join(', ') : 'None';

  let guidance;
  if (label === 'High') {
    guidance = 'Pause for 3–5 minutes, then tackle the most impactful overdue task. Use a 25-minute focus block.';
  } else if (label === 'Moderate') {
    guidance = 'Prioritize items due within 72 hours. Complete one small task to build momentum.';
  } else {
    guidance = 'Maintain pace. Plan the next 2–3 steps and clear quick wins.';
  }

  return `Stress: ${p}% (${label}). Due soon: ${dueSoon}. Overdue: ${overdue}. Next deadlines: ${nextTxt}. ${guidance}`;
}