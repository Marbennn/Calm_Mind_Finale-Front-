// src/pages/ChatBot.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import Sidebar from "../components/Sidebar";
import api from "../api/client";
import useStressStore from "../store/useStressStore";
import {
  calculateDailyStress,
  buildChatbotReply,
} from "../utils/stressUtils";

/* ======================== Constants ======================== */
const LS_MSGS = "cm_messages_v1"; // legacy single-thread key (still read once)
const LS_THREADS = "cm_threads_v1"; // [{id,title,createdAt,updatedAt,messages:[...]}]
const USER_ID = "69008a1fd3c8660f1ff28779";

/* ======================== AI Response Engine ======================== */
async function getBotResponse(userInput, currentTasks) {
  // Build light context from currentTasks (used for fallbacks and chat hints)
  const daily = calculateDailyStress(currentTasks || []);
  const percent = Math.round(daily.percent || 0);
  // counts available if needed later
  // const due48hCount = (currentTasks || []).filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date(Date.now() + 48 * 3600 * 1000) && new Date(t.due_date) >= new Date()).length;
  // const overdueCount = (currentTasks || []).filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;

  // Context-focused queries: prefer structured, data-driven reply
  const askContext = /how stressed am i|reminders|what tasks do i have|summary|overview|due|overdue|next deadlines/i.test(
    userInput
  );
  if (askContext) {
    try {
      const { data } = await api.get(`/coach/context?user_id=${USER_ID}`);
      const ctx = data || {};
      const pctFromCtx = Number.isFinite(+ctx.stress?.percentage) ? Math.round(+ctx.stress.percentage) : percent;
      const reply = buildChatbotReply(currentTasks || [], daily);
      return `📊 Current Stress: ${pctFromCtx}%.\n${reply}`;
    } catch {
      // Fall back to data-driven local reply
      return buildChatbotReply(currentTasks || [], daily);
    }
  }

  // Generic chat: send to coach LLM but include a data-driven fallback
  try {
    const { data } = await api.post("/coach/chat", {
      user_id: USER_ID,
      message: userInput,
    });
    const coachData = data || {};
    let replyText = coachData.response || coachData.response?.response || "";
    let stepsText = "";
    if (Array.isArray(coachData.steps) && coachData.steps.length) {
      stepsText = "\n\nSteps:\n" + coachData.steps.slice(0, 5).map((s) => `- ${s}`).join("\n");
    }
    if (!replyText || !replyText.trim()) {
      return buildChatbotReply(currentTasks || [], daily);
    }
    return `📊 Current Stress: ${percent}%.\n${replyText}${stepsText}`;
  } catch {
    // Robust local fallback if LLM endpoint errors
    return buildChatbotReply(currentTasks || [], daily);
  }
}

/* ======================== Main Component ======================== */
export default function ChatBot() {
  /* ---------- Tasks & analytics from centralized store ---------- */
  const {
    tasks,
    fetchTasks,
    updateTask,
    getDailyStressSummary,
    getMostStressfulTasks,
  } = useStressStore();

  // Add ref to track last daily stress
  const lastStressRef = useRef(null);
  const [liveBanner, setLiveBanner] = useState(null);

  useEffect(() => {
    // ensure store has tasks
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Listen for store stress updates (custom event dispatched by store)
  useEffect(() => {
    const onStressUpdated = (e) => {
      const d = e?.detail;
      if (d && typeof d.averageStress === "number") {
        lastStressRef.current = d.averageStress;
        setLiveBanner(`Live stress: ${Math.round(d.averageStress * 100)}% • updated just now`);
      }
    };
    window.addEventListener("stress-updated", onStressUpdated);
    return () => window.removeEventListener("stress-updated", onStressUpdated);
  }, []);

  /* ---------- Chat Threads (localStorage) ---------- */
  const defaultGreetingMsg = () => ({
    id: `greet-${Date.now()}`,
    role: "assistant",
    text: "Hi! I’m your CalmMind Stress AI Coach. Ask me about your tasks, stress levels, or how to reduce stress.",
    ts: new Date().toISOString(),
  });

  const createThread = (title = "New chat") => ({
    id: `t-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [defaultGreetingMsg()],
  });

  const deriveTitle = (text) => {
    const clean = String(text || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean) return "Untitled";
    const words = clean.split(" ").slice(0, 8).join(" ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  };
  const isDefaultTitle = (t) =>
    !t || ["New chat", "Welcome", "Imported chat", "Untitled"].includes(t);

  const [threads, setThreads] = useState(() => {
    // migrate from legacy LS_MSGS once
    const savedThreads = localStorage.getItem(LS_THREADS);
    if (savedThreads) return JSON.parse(savedThreads);
    const legacy = localStorage.getItem(LS_MSGS);
    if (legacy) {
      const t = createThread("Imported chat");
      t.messages = JSON.parse(legacy);
      t.updatedAt = new Date().toISOString();
      return [t];
    }
    return [createThread("Welcome")];
  });

  const [currentId, setCurrentId] = useState(() => threads[0]?.id);
  const currentThread = threads.find((t) => t.id === currentId) || threads[0];
  const [messages, setMessages] = useState(
    currentThread?.messages || [defaultGreetingMsg()]
  );
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const [note, setNote] = useState("");

  // New Chat / Delete History
  const handleNewChat = () => {
    const t = createThread("New chat");
    setThreads((prev) => {
      const list = [t, ...prev];
      localStorage.setItem(LS_THREADS, JSON.stringify(list));
      return list;
    });
    setCurrentId(t.id);
    setMessages(t.messages);
  };
  const handleDeleteHistory = () => {
    // Delete current thread
    setThreads((prev) => {
      const list = prev.filter((t) => t.id !== currentThread?.id);
      const final = list.length ? list : [createThread("Welcome")];
      localStorage.setItem(LS_THREADS, JSON.stringify(final));
      const newCurrent = final[0];
      setCurrentId(newCurrent.id);
      setMessages(newCurrent.messages);
      return final;
    });
  };

  // Persist: keep current thread messages in threads and save all
  useEffect(() => {
    setThreads((prev) => {
      const list = prev.map((t) =>
        t.id === currentThread?.id
          ? { ...t, messages, updatedAt: new Date().toISOString() }
          : t
      );
      localStorage.setItem(LS_THREADS, JSON.stringify(list));
      return list;
    });
  }, [messages, currentThread?.id]);

  // When switching current thread id, sync messages
  useEffect(() => {
    if (!currentThread) return;
    setMessages(currentThread.messages);
  }, [currentThread?.id]);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const pushMessage = (role, text) =>
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${role}`, role, text, ts: new Date().toISOString() },
    ]);

  /* ---------- Command processor (quick local commands) ---------- */
  const processCommand = async (text) => {
    const t = text.trim();
    // mark task N as complete
    const m1 = t.match(/mark task (\d+) as complete/i);
    if (m1) {
      const idx = parseInt(m1[1], 10) - 1;
      const active = tasks.filter((x) => !x.completed);
      const target = active[idx];
      if (!target) {
        pushMessage("assistant", `I couldn't find task #${idx + 1}.`);
        return true;
      }
      await updateTask(target.id || target._id, { status: "completed" });
  pushMessage("assistant", `Marked "${target.title}" as complete. Nice work!`);
      return true;
    }

    // complete by id: "complete TASK_ID"
    const m2 = t.match(/(?:complete|mark) ([\w-]{6,})/i);
    if (m2) {
      const id = m2[1];
      const found = tasks.find((x) => x.id === id || x._id === id);
      if (!found) {
        pushMessage("assistant", `I couldn't find a task with id ${id}.`);
        return true;
      }
      await updateTask(found.id || found._id, { status: "completed" });
  pushMessage("assistant", `Marked "${found.title}" as complete.`);
      return true;
    }

    // show due today
    if (/due today|what's due today|show me what's due today/i.test(t)) {
      const todayIso = dayjs().format("YYYY-MM-DD");
      const due = tasks.filter((x) => x.due_date && x.due_date.startsWith(todayIso) && !x.completed);
      if (!due.length) {
        pushMessage("assistant", "You have no tasks due today.");
      } else {
        const list = due.map((d, i) => `${i + 1}. ${d.title} (${d.priority})`).join("\n");
        pushMessage("assistant", `Tasks due today:\n${list}`);
      }
      return true;
    }

    // list overdue
    if (/overdue tasks|list my overdue tasks|show overdue/i.test(t)) {
      const now = new Date();
      const overdue = tasks.filter((x) => !x.completed && x.due_date && new Date(x.due_date) < now);
      if (!overdue.length) {
        pushMessage("assistant", "No overdue tasks — nice!");
      } else {
        const list = overdue.map((d, i) => `${i + 1}. ${d.title} — due ${dayjs(d.due_date).fromNow()}`).join("\n");
        pushMessage("assistant", `Overdue tasks:\n${list}`);
      }
      return true;
    }

    // top stressors
    if (/most stress|top stressors|causing me the most stress/i.test(t)) {
      const top = getMostStressfulTasks ? getMostStressfulTasks(5) : [];
      if (!top.length) {
        pushMessage("assistant", "I can't find any stressful tasks right now.");
      } else {
        const list = top.map((x, i) => `${i + 1}. ${x.title} — ${Math.round((x.stress || 0) * 100)}%`).join("\n");
        pushMessage("assistant", `Top stressors:\n${list}`);
      }
      return true;
    }

    // suggestion: what to do first
    if (/what should i do first|what should I do first|what to do first/i.test(t)) {
      const top = getMostStressfulTasks ? getMostStressfulTasks(1) : [];
      if (!top.length) {
        pushMessage("assistant", "No tasks to suggest right now — you're in a good spot.");
      } else {
        const s = top[0];
        const due = s.due_date ? `due ${dayjs(s.due_date).fromNow()}` : "no deadline";
  pushMessage("assistant", `Focus on "${s.title}" — ${s.priority} priority, ${due}. Stress: ${Math.round((s.stress||0)*100)}%`);
      }
      return true;
    }

    return false;
  };

  const handleSend = async () => {
    const trimmed = note.trim();
    if (!trimmed || sending) return;
    // If this is the first user input or title is default, auto-title the thread
    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentId && isDefaultTitle(t.title)
          ? {
              ...t,
              title: deriveTitle(trimmed),
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
    pushMessage("user", trimmed);
    setNote("");
    setSending(true);

    try {
      // First, try to handle local quick-commands that operate on tasks
      const handled = await processCommand(trimmed);
      if (handled) {
        setSending(false);
        return;
      }

      // Calculate real-time stress delta using lastStressRef (which is fed by store events)
      const live = typeof lastStressRef.current === "number" ? lastStressRef.current : getDailyStressSummary().average;
      const response = await getBotResponse(trimmed, tasks);
      // After getting response, recompute and compare
      const after = getDailyStressSummary().average;
      let finalResp = response;
      if (typeof live === "number" && typeof after === "number") {
        const diff = +(after - live).toFixed(4);
        if (diff < -0.05 && Math.abs(live) > 0) {
          const dropPct = Math.abs(Math.round((diff / (live || 0.0001)) * 100));
          finalResp = `Stress dropped ${dropPct}%! Great job.\n` + finalResp;
        } else if (diff > 0.05) {
          finalResp = `Stress increased. Overwhelmed? Let's reprioritize.\n` + finalResp;
        }
        lastStressRef.current = after;
      }
      pushMessage("assistant", finalResp);
    } catch {
      pushMessage("assistant", "Sorry—something went wrong. Try again.");
    } finally {
      setSending(false);
    }
  };

  /* ---------- Mini-dashboard data & quick actions ---------- */
  const dashboard = useMemo(() => {
    const daily = getDailyStressSummary ? getDailyStressSummary() : { average: 0, normalized: 0, total: 0 };
    const total = (tasks || []).length;
    const overdue = (tasks || []).filter((x) => !x.completed && x.due_date && new Date(x.due_date) < new Date()).length;
    const top = getMostStressfulTasks ? getMostStressfulTasks(3) : [];
    return { daily, total, overdue, top };
  }, [tasks, getDailyStressSummary, getMostStressfulTasks]);

  const handleQuickComplete = async (task) => {
    if (!task) return;
    try {
      await updateTask(task.id || task._id, { status: "completed" });
      pushMessage("assistant", `Quick action: marked "${task.title}" as complete.`);
    } catch {
      pushMessage("assistant", `Could not complete "${task.title}". Try again.`);
    }
  };

  /* ======================== UI ======================== */
  return (
    <div className="min-h-screen h-screen flex">
      <Sidebar active="Chat Bot" />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 h-[68px] w-full bg-card/50 border-b border-gray-200 px-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Chatbot
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              New Chat
            </button>
            <button
              type="button"
              onClick={handleDeleteHistory}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
            >
              Delete History
            </button>
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 min-h-0 flex">
          <div className="flex-1 flex">
            {/* LEFT: Chat Section */}
            <aside className="w-64 hidden lg:block border-r border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Conversations</div>
                <span className="text-xs text-gray-500">{threads.length}</span>
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                {threads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCurrentId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${
                      t.id === currentId
                        ? "border-amber-300 bg-amber-50"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate text-sm font-medium">
                      {t.title || "Untitled"}
                    </div>
                    <div className="truncate text-[11px] text-gray-500">
                      {dayjs(t.updatedAt).fromNow()}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
            <section className="flex-1 flex flex-col gap-3 p-2">
              {liveBanner && (
                <div className="mx-2 mb-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2">
                  {liveBanner}
                </div>
              )}
              {/* Chat */}
              <div className="w-full rounded-2xl bg-[#F3EFE0] border border-gray-200 flex-1 relative flex flex-col overflow-x-hidden">
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-4 py-4 overflow-x-hidden"
                >
                  <div className="max-w-3xl mx-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`mb-3 flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[78%] shadow-sm ${
                            m.role === "user"
                              ? "bg-[#1F1F1D] text-white"
                              : "bg-white text-[#111] border border-gray-200"
                          }`}
                          style={{
                            boxShadow:
                              m.role === "user"
                                ? "0 8px 22px rgba(0,0,0,0.12)"
                                : "0 6px 12px rgba(0,0,0,0.06)",
                          }}
                        >
                          {m.text}
                          <div className="mt-2 text-[11px] opacity-60">
                            {dayjs(m.ts).format("h:mm A")}
                          </div>
                        </div>
                      </div>
                    ))}
                    {sending && (
                      <div className="mb-3 flex justify-start">
                        <div className="rounded-2xl px-4 py-3 text-sm bg-white border border-gray-200 shadow-sm">
                          Typing…
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div
                className="rounded-2xl bg-white border border-gray-100 p-5"
                style={{ boxShadow: "0 6px 18px rgba(11,18,40,0.04)" }}
              >
                <div className="mb-4">
                  <div className="text-lg font-bold">Chat with your Coach</div>
                  <div className="text-xs text-gray-500">
                    Type below to chat (Enter).
                  </div>
                </div>

                {/* Input + Button */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    className="px-4 py-3 rounded-xl bg-[#222322] text-white disabled:opacity-50"
                    style={{ boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>

            {/* RIGHT: Mini-dashboard */}
            <aside className="w-72 hidden xl:block border-l border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold mb-2">Today</div>
              <div className="mb-3">
                <div className="text-xs text-gray-500">Estimated stress</div>
                <div className="text-2xl font-bold">
                  {(() => {
                    const d = dashboard.daily || {};
                    const pct = d.average != null ? Math.round(d.average * 100) : d.normalized ? Math.round((d.normalized / 5) * 100) : 0;
                    return `${pct}%`;
                  })()}
                </div>
                <div className="text-xs text-gray-500">~{(dashboard.daily && dashboard.daily.normalized) || 0}/5</div>
              </div>
              <div className="mb-3 text-sm">Tasks: {dashboard.total}</div>
              <div className="mb-3 text-sm">Overdue: {dashboard.overdue}</div>
              <div className="mb-3">
                <div className="text-sm font-semibold">Top stressors</div>
                {dashboard.top && dashboard.top.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {dashboard.top.map((t) => (
                      <li key={t.id || t._id} className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="truncate">{t.title}</div>
                          <div className="text-xs text-gray-500">{t.due_date ? dayjs(t.due_date).format("MMM D") : "No due"}</div>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <button
                            onClick={() => handleQuickComplete(t)}
                            className="text-xs px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900"
                          >
                            Complete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-gray-500 mt-2">No active stressors.</div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
