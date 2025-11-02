import React, { useEffect, useRef, useState, useMemo, useContext } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import Sidebar from "../components/Sidebar";
import api from "../api/client";
import useStressStore from "../store/useStressStore";
import { calculateDailyStress, buildChatbotReply } from "../utils/stressUtils";
import { ThemeContext } from "../context/ThemeContext";

/* ======================== Constants ======================== */
const LS_MSGS = "cm_messages_v1"; // legacy single-thread key (still read once)
const LS_THREADS = "cm_threads_v1"; // [{id,title,createdAt,updatedAt,messages:[...]}]
const USER_ID = "69008a1fd3c8660f1ff28779";

/* ======================== AI Response Engine ======================== */
async function getBotResponse(userInput, currentTasks) {
  const daily = calculateDailyStress(currentTasks || []);
  const percent = Math.round(daily.percent || 0);

  const askContext = /how stressed am i|reminders|what tasks do i have|summary|overview|due|overdue|next deadlines/i.test(
    userInput
  );
  if (askContext) {
    try {
      const { data } = await api.get(`/coach/context?user_id=${USER_ID}`);
      const ctx = data || {};
      const pctFromCtx = Number.isFinite(+ctx.stress?.percentage)
        ? Math.round(+ctx.stress.percentage)
        : percent;
      const reply = buildChatbotReply(currentTasks || [], daily);
      return `📊 Current Stress: ${pctFromCtx}%.\n${reply}`;
    } catch {
      return buildChatbotReply(currentTasks || [], daily);
    }
  }

  try {
    const { data } = await api.post("/coach/chat", {
      user_id: USER_ID,
      message: userInput,
    });
    const coachData = data || {};
    let replyText = coachData.response || coachData.response?.response || "";
    let stepsText = "";
    if (Array.isArray(coachData.steps) && coachData.steps.length) {
      stepsText =
        "\n\nSteps:\n" + coachData.steps.slice(0, 5).map((s) => `- ${s}`).join("\n");
    }
    if (!replyText || !replyText.trim()) {
      return buildChatbotReply(currentTasks || [], daily);
    }
    return `📊 Current Stress: ${percent}%.\n${replyText}${stepsText}`;
  } catch {
    return buildChatbotReply(currentTasks || [], daily);
  }
}

/* ======================== Main Component ======================== */
export default function ChatBot() {
  const { theme, setTheme } = useContext(ThemeContext);

  /* ---------- Tasks & analytics from centralized store ---------- */
  const {
    tasks,
    fetchTasks,
    updateTask,
    getDailyStressSummary,
    getMostStressfulTasks,
  } = useStressStore();

  const lastStressRef = useRef(null);
  const [liveBanner, setLiveBanner] = useState(null);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    const onStressUpdated = (e) => {
      const d = e?.detail;
      if (d && typeof d.averageStress === "number") {
        lastStressRef.current = d.averageStress;
        setLiveBanner(
          `Live stress: ${Math.round(d.averageStress * 100)}% • updated just now`
        );
      }
    };
    window.addEventListener("stress-updated", onStressUpdated);
    return () => window.removeEventListener("stress-updated", onStressUpdated);
  }, []);

  /* ---------------------- Notifications ---------------------- */
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  /* ---------- Chat Threads (localStorage) ---------- */
  const defaultGreetingMsg = () => ({
    id: `greet-${Date.now()}`,
    role: "assistant",
    text:
      "Hi! I’m your CalmMind Stress AI Coach. Ask me about your tasks, stress levels, or how to reduce stress.",
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
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "Untitled";
    const words = clean.split(" ").slice(0, 8).join(" ");
    return words.charAt(0).toUpperCase() + words.slice(1);
  };
  const isDefaultTitle = (t) =>
    !t || ["New chat", "Welcome", "Imported chat", "Untitled"].includes(t);

  const [threads, setThreads] = useState(() => {
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

  // Panels state
  const [isThreadsOpen, setIsThreadsOpen] = useState(true);    // mobile drawer
  const [isThreadsVisible, setIsThreadsVisible] = useState(true); // desktop show/hide

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

  // Persist current thread
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

  // Sync messages on thread change
  useEffect(() => {
    if (!currentThread) return;
    setMessages(currentThread.messages);
  }, [currentThread?.id]);

  // Auto-scroll chat
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  const pushMessage = (role, text) =>
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${role}`, role, text, ts: new Date().toISOString() },
    ]);

  /* ---------- Command processor (quick local commands) ---------- */
  const processCommand = async (text) => {
    const t = text.trim();
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

    if (/due today|what's due today|show me what's due today/i.test(t)) {
      const todayIso = dayjs().format("YYYY-MM-DD");
      const due = tasks.filter(
        (x) => x.due_date && x.due_date.startsWith(todayIso) && !x.completed
      );
      if (!due.length) {
        pushMessage("assistant", "You have no tasks due today.");
      } else {
        const list = due.map((d, i) => `${i + 1}. ${d.title} (${d.priority})`).join("\n");
        pushMessage("assistant", `Tasks due today:\n${list}`);
      }
      return true;
    }

    if (/overdue tasks|list my overdue tasks|show overdue/i.test(t)) {
      const now = new Date();
      const overdue = tasks.filter(
        (x) => !x.completed && x.due_date && new Date(x.due_date) < now
      );
      if (!overdue.length) {
        pushMessage("assistant", "No overdue tasks — nice!");
      } else {
        const list = overdue
          .map((d, i) => `${i + 1}. ${d.title} — due ${dayjs(d.due_date).fromNow()}`)
          .join("\n");
        pushMessage("assistant", `Overdue tasks:\n${list}`);
      }
      return true;
    }

    if (/most stress|top stressors|causing me the most stress/i.test(t)) {
      const top = getMostStressfulTasks ? getMostStressfulTasks(5) : [];
      if (!top.length) {
        pushMessage("assistant", "I can't find any stressful tasks right now.");
      } else {
        const list = top
          .map((x, i) => `${i + 1}. ${x.title} — ${Math.round((x.stress || 0) * 100)}%`)
          .join("\n");
        pushMessage("assistant", `Top stressors:\n${list}`);
      }
      return true;
    }

    if (/what should i do first|what should I do first|what to do first/i.test(t)) {
      const top = getMostStressfulTasks ? getMostStressfulTasks(1) : [];
      if (!top.length) {
        pushMessage("assistant", "No tasks to suggest right now — you're in a good spot.");
      } else {
        const s = top[0];
        const due = s.due_date ? `due ${dayjs(s.due_date).fromNow()}` : "no deadline";
        pushMessage(
          "assistant",
          `Focus on "${s.title}" — ${s.priority} priority, ${due}. Stress: ${Math.round(
            (s.stress || 0) * 100
          )}%`
        );
      }
      return true;
    }

    return false;
  };

  const handleSend = async () => {
    const trimmed = note.trim();
    if (!trimmed || sending) return;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === currentId && isDefaultTitle(t.title)
          ? { ...t, title: deriveTitle(trimmed), updatedAt: new Date().toISOString() }
          : t
      )
    );
    pushMessage("user", trimmed);
    setNote("");
    setSending(true);

    try {
      const handled = await processCommand(trimmed);
      if (handled) {
        setSending(false);
        return;
      }

      const live =
        typeof lastStressRef.current === "number"
          ? lastStressRef.current
          : getDailyStressSummary().average;
      const response = await getBotResponse(trimmed, tasks);
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
    const daily = getDailyStressSummary
      ? getDailyStressSummary()
      : { average: 0, normalized: 0, total: 0 };
    const total = (tasks || []).length;
    const overdue = (tasks || []).filter(
      (x) => !x.completed && x.due_date && new Date(x.due_date) < new Date()
    ).length;
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
    // Lock the viewport: only inner areas can scroll
    <div className="h-screen overflow-hidden">
      <div className="h-full w-full flex">
        <Sidebar active="Chat Bot" />
        <div className="flex-1 flex flex-col min-h-0 px-2 pt-2">
          {/* Header */}
          <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chatbot</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile: open conversations drawer */}
              <button
                className="block lg:hidden relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
                onClick={() => setIsThreadsOpen(true)}
                aria-label="Open conversations"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 5h18M3 12h18M3 19h18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  className="relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
                  onClick={() => {
                    setIsNotifOpen((prev) => !prev);
                    fetchNotifications();
                  }}
                  aria-label="Toggle notifications"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 top-14 w-80 bg-card rounded-xl shadow-xl overflow-hidden z-50 max-h-96">
                    {loadingNotifs ? (
                      <p className="p-4 text-gray-500 text-sm">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm">You have no notifications.</p>
                    ) : (
                      <ul className="overflow-y-auto max-h-80">
                        {notifications.map((n) => (
                          <li
                            key={n._id}
                            className={`p-4 border-b border-gray-100 last:border-0 ${
                              n.read ? "bg-white text-gray-600" : "bg-yellow-50 text-gray-800"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{n.message}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(n.created_at).toLocaleString()}
                                </div>
                              </div>
                              {!n.read && (
                                <button
                                  onClick={() => markNotificationAsRead(n._id)}
                                  className="text-xs text-accent hover:underline whitespace-nowrap"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button
                className="h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
                aria-label="Account"
              >
                <span className="text-base">👤</span>
              </button>
            </div>
          </div>

          {/* Main */}
          <main className="flex-1 min-h-0 flex">
            {/* Chat (left column) */}
            <section className="flex-1 flex flex-col min-h-0">
              {liveBanner && (
                <div className="mx-4 mt-4 rounded-xl bg-gray-100 border-gray-500 text-black text-sm px-4 py-2 shadow-sm">
                  {liveBanner}
                </div>
              )}

              {/* Chat area (only this scrolls) */}
              <div className="flex-1 relative flex flex-col overflow-hidden bg-gray-50 min-h-0">
                <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-start gap-3 ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        
                        <div
                          className={`rounded-xl p-4 text-base leading-relaxed max-w-xl shadow-md ${
                            m.role === "user"
                              ? "bg-black text-white"
                              : "bg-white text-gray-900 border border-gray-100"
                          }`}
                        >
                          {m.text.split("\n").map((line, i) => (
                            <p key={i} className={i > 0 ? "mt-3" : ""}>
                              {line}
                            </p>
                          ))}
                          <div className="mt-3 text-xs opacity-50 text-right">
                            {dayjs(m.ts).format("h:mm A")}
                          </div>
                        </div>
                        
                      </div>
                    ))}
                    {sending && (
                      <div className="flex items-start gap-3 justify-start">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                          🤖
                        </div>
                        <div className="rounded-xl p-4 text-base bg-white border border-gray-100 shadow-md animate-pulse">
                          Typing...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Input (doesn't trigger page scroll) */}
              <div className="bg-white border-t border-gray-100 p-6 shadow-lg">
                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-800">Chat with your Coach</div>
                  <div className="text-sm text-gray-500">
                    Type your message below and press Enter to send.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-amber-300 transition-shadow resize-none overflow-auto max-h-40"
                    rows={1}
                  />
                  {/* Modern Send Button with Icon */}
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    title={sending ? "Sending…" : "Send message"}
                    aria-label={sending ? "Sending" : "Send"}
                    className={[
                      "group relative inline-flex items-center justify-center gap-2",
                      "px-4 py-4 rounded-xl font-semibold",
                      "bg-gradient-to-r from-black to-black text-white",
                      "shadow-2xl hover:shadow-3xl active:scale-[0.98]",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    ].join(" ")}
                  >
                    <span className="hidden sm:inline">
                      {sending ? "Sending…" : "Send"}
                    </span>
                    {/* Paper plane icon */}
                    <svg
                      className={[
                        "h-5 w-5 flex-shrink-0",
                        sending ? "animate-pulse" : "transform -rotate-45 group-hover:translate-x-1"
                      ].join(" ")}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      {/* paper plane path */}
                      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                    </svg>
                    {/* subtle glow on hover */}
                    <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity bg-white" />
                  </button>
                </div>
              </div>
            </section>

            {/* Mobile overlay for drawer */}
            {isThreadsOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setIsThreadsOpen(false)}
              />
            )}

            {/* Conversations (right column) */}
            {isThreadsVisible ? (
              <aside 
                className={[
                  "w-72 mt-4 pt-3 border-l border-gray-200 bg-white p-4 transition-transform duration-300 flex-shrink-0",
                  // Mobile drawer from right
                  isThreadsOpen
                    ? "fixed right-0 top-0 h-full z-50 translate-x-0"
                    : "fixed right-0 top-0 h-full z-50 translate-x-full",
                  // Desktop: static right column
                  "lg:static lg:h-auto lg:translate-x-0 lg:z-auto",
                ].join(" ")}
              >
                {/* Mobile close (X) */}
                <button
                  className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 lg:hidden"
                  onClick={() => setIsThreadsOpen(false)}
                  aria-label="Close conversations"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Conversations</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{threads.length}</span>
                    {/* Desktop hide chevron */}
                    <button
                      className="text-gray-500 hover:text-gray-700 hidden lg:inline-flex"
                      onClick={() => setIsThreadsVisible(false)}
                      aria-label="Hide conversations"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      handleNewChat();
                      setIsThreadsOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                  >
                    New Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteHistory();
                      setIsThreadsOpen(false);
                    }}
                    className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                  >
                    Delete Chat
                  </button>
                </div>

                {/* Keep conversations non-scrollable to satisfy "only chat scrolls" */}
                <div className="space-y-2 overflow-hidden h-[calc(100vh-200px)] pr-2 lg:h-[calc(100vh-180px)]">
                  {threads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setCurrentId(t.id);
                        setIsThreadsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                        t.id === currentId
                          ? "bg-gray-200 border border-gray-300"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="truncate text-sm font-medium text-gray-800">
                        {t.title || "Untitled"}
                      </div>
                      <div className="truncate text-xs text-gray-500 mt-1">
                        {dayjs(t.updatedAt).fromNow()}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>
            ) : (
              // Desktop show button (when hidden)
              <button
                className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 h-12 w-8 bg-white border border-gray-200 rounded-l-lg shadow-md items-center justify-center text-gray-500 hover:text-gray-700"
                onClick={() => setIsThreadsVisible(true)}
                aria-label="Show conversations"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </main>
        </div>
      </div>

      {/* Mobile theme toggle */}
      <div className="block lg:hidden fixed bottom-4 left-4 z-50">
        <div
          className={`theme-switch ${theme === "dark" ? "dark" : ""}`}
          role="group"
          aria-label="Theme toggle"
        >
          <button
            type="button"
            className="sun-button"
            aria-pressed={theme === "light"}
            aria-label="Switch to light mode"
            onClick={() => setTheme("light")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setTheme("light");
            }}
          >
            <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M4.93 19.07l1.41-1.41" />
                <path d="M17.66 6.34l1.41-1.41" />
              </g>
            </svg>
          </button>

          <button type="button" className="knob-button" aria-hidden="true" tabIndex={-1} />

          <button
            type="button"
            className="moon-button"
            aria-pressed={theme === "dark"}
            aria-label="Switch to dark mode"
            onClick={() => setTheme("dark")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setTheme("dark");
            }}
          >
            <svg className="moon moon-icon" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
