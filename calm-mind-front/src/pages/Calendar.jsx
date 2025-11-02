import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { ThemeContext } from "../context/ThemeContext";
import Card from "../components/HoverCard";
import TaskForm from "../components/TaskForm";
import api from "../api/client";

const USER_ID = "69008a1fd3c8660f1ff28779";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <h2>Something went wrong in the Calendar component.</h2>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <p>Please check the console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Dropdown Component */
const Dropdown = React.memo(function Dropdown({
  label,
  options,
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-gray-200"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm">
          {label}: {value}
        </span>
        <svg
          className="h-4 w-4 text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={`Select ${label}`}
          className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {options.map((o) => (
            <li
              key={o}
              role="option"
              aria-selected={value === o}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                value === o ? "bg-gray-100 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const STORAGE_KEY = "tasks";

export default function Calendar() {
  const context = useContext(ThemeContext);
  const { theme = "light", setTheme = () => {} } = context || {};

  const [view, setView] = useState("Month");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("calendarView", view);
      } catch (error) {
        console.error("Failed to save calendarView to localStorage:", error);
      }
    }
  }, [view]);

  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedYear, setSelectedYear] = useState(selectedDate.getFullYear());

  const prevViewRef = useRef(view);
  useEffect(() => {
    if (view === "Year" && prevViewRef.current !== "Year") {
      setSelectedYear(selectedDate.getFullYear());
    }
    prevViewRef.current = view;
  }, [view, selectedDate]);

  const monthName = useMemo(
    () =>
      selectedDate.toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [selectedDate]
  );
  const fullDateName = useMemo(
    () =>
      selectedDate.toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [selectedDate]
  );

  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    const sunday = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() - base.getDay()
    );
    return Array.from({ length: 7 }).map(
      (_, i) =>
        new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i)
    );
  }, [selectedDate]);

  const weekHeader = useMemo(() => {
    if (view !== "Week" && view !== "Schedule") return monthName;
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    const firstMonth = firstDay.toLocaleString(undefined, { month: "long" });
    const lastMonth = lastDay.toLocaleString(undefined, { month: "long" });
    const year = selectedDate.getFullYear();
    return firstMonth !== lastMonth
      ? `${firstMonth} - ${lastMonth} ${year}`
      : `${firstMonth} ${year}`;
  }, [view, selectedDate, weekDays, monthName]);

  const daysGrid = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const leading = firstOfMonth.getDay();
    const totalDays = lastOfMonth.getDate();

    const arr = [];
    for (let i = 0; i < leading; i++) arr.push(null);
    for (let d = 1; d <= totalDays; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [selectedDate]);

  const realToday = useMemo(() => new Date(), []);
  const todayYMD = useMemo(
    () => ({
      y: realToday.getFullYear(),
      m: realToday.getMonth(),
      d: realToday.getDate(),
    }),
    [realToday]
  );

  const selectedYMD = useMemo(
    () => ({
      y: selectedDate.getFullYear(),
      m: selectedDate.getMonth(),
      d: selectedDate.getDate(),
    }),
    [selectedDate]
  );

  const gmtOffset = useMemo(() => {
    const offsetMin = -liveTime.getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const absMin = Math.abs(offsetMin);
    const hh = String(Math.floor(absMin / 60)).padStart(2, "0");
    const mm = String(absMin % 60).padStart(2, "0");
    return `GMT${sign}${hh}:${mm}`;
  }, [liveTime]);

  const tzName = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  const weekContainerRef = useRef(null);
  const weekGutterRef = useRef(null);
  const dayContainerRef = useRef(null);
  const yearScheduleContainerRef = useRef(null);

  useEffect(() => {
    if (view === "Day" && dayContainerRef.current) {
      dayContainerRef.current.scrollTop = 0;
    } else if (view === "Week" && weekContainerRef.current) {
      weekContainerRef.current.scrollTop = 0;
    } else if (
      (view === "Year" || view === "Schedule") &&
      yearScheduleContainerRef.current
    ) {
      yearScheduleContainerRef.current.scrollTop = 0;
    }
  }, [view]);

  // ← UPDATE: Loading & error state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ← UPDATE: Load tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/tasks?user_id=${USER_ID}`);
        setTasks(
          res.data.map((t) => ({
            id: t._id,
            title: t.title,
            description: t.description || "",
            priority: t.priority,
            dueDate: t.due_date,
            status: t.status,
            completed: t.completed,
          }))
        );
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setError("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // ← UPDATE: Real-time sync
  useEffect(() => {
    const handler = () => {
      const fetchTasks = async () => {
        try {
          const res = await api.get(`/tasks?user_id=${USER_ID}`);
          setTasks(
            res.data.map((t) => ({
              id: t._id,
              title: t.title,
              description: t.description || "",
              priority: t.priority,
              dueDate: t.due_date,
              status: t.status,
              completed: t.completed,
            }))
          );
        } catch (err) {
          console.error(err);
        }
      };
      fetchTasks();
    };
    window.addEventListener("task-updated", handler);
    return () => window.removeEventListener("task-updated", handler);
  }, []);

  // Update event mapping: always parse dueDate as Date, never append T00:00:00. Use Date everywhere.
  const exampleEvents = useMemo(() => {
    return tasks
      .map((task) => {
        // Parse dueDate: always parse as Date, regardless of format
        const due = task.dueDate ? new Date(task.dueDate) : null;
        const dueDate = due && !isNaN(due.getTime()) ? due : new Date();
        const endDate = new Date(dueDate);
        endDate.setHours(dueDate.getHours() + 1);
        // Compare for overdue flag
        const startOfToday = new Date(liveTime);
        startOfToday.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < startOfToday && !task.completed;
        const status = isOverdue
          ? "missing"
          : task.status === "done_late"
          ? "done_late"
          : task.status;
        const statusColor =
          status === "done_late"
            ? "bg-orange-500"
            : status === "todo"
            ? "bg-gray-500"
            : status === "in_progress"
            ? "bg-blue-500"
            : status === "missing"
            ? "bg-red-500"
            : status === "completed"
            ? "bg-green-500"
            : "bg-gray-500";
        const now = Date.now();
        const dueMs = dueDate.getTime();
        const is48h = dueMs > now && dueMs <= now + 48 * 60 * 60 * 1000;
        return {
          id: task.id,
          title: task.title,
          start: dueDate,
          end: endDate,
          color:
            task.priority === "Low"
              ? "bg-green-500"
              : task.priority === "Medium"
              ? "bg-yellow-500"
              : task.priority === "High"
              ? "bg-red-500"
              : "bg-gray-500",
          statusColor,
          status,
          description: task.description || "",
          priority: task.priority,
          startDate: dueDate,
          dueDate: dueDate,
          is48h,
          isOverdue,
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [tasks, liveTime]);

  const currentHour = liveTime.getHours();
  const currentMinute = liveTime.getMinutes();
  const currentSecond = liveTime.getSeconds();
  const minutePercent = (currentMinute + currentSecond / 60) / 60;

  const dayIndicatorFraction = useMemo(() => {
    return (currentHour + minutePercent) / 24;
  }, [currentHour, minutePercent]);

  const cssVars = {
    "--gutter-width": "80px",
    "--row-height": "48px",
    "--separator-color": "rgba(0,0,0,0.06)",
    "--accent-color": "#e5c93a",
  };

  const HourIndicator = ({ minutePercent = 0, styleOverride = {} }) => (
    <div
      className="absolute"
      style={{
        left: 0,
        right: 0,
        top: `${minutePercent * 100}%`,
        transform: "translateY(-50%)",
        pointerEvents: "none",
        zIndex: 10,
        ...styleOverride,
      }}
      aria-hidden
    >
      <div
        style={{ height: 2, background: "var(--accent-color)", opacity: 0.95 }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, -50%)",
          top: 0,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 9999,
            background: "var(--accent-color)",
            border: "3px solid white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          }}
        />
      </div>
    </div>
  );

  const renderCellEventsCompact = (eventsForCell, openAllForDay) => {
    const maxVisible = 1;
    const visible = eventsForCell.slice(0, maxVisible);
    const extra = Math.max(0, eventsForCell.length - maxVisible);

    return (
      <div className="flex flex-col items-start gap-1">
        {visible.map((ev, ei) => (
          <div key={ei} className="flex items-center gap-2 w-full">
            <button
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${ev.color} hover:brightness-90 text-left`}
              title={ev.title}
              onClick={() => openAllForDay()}
              style={{ maxWidth: '70%' }}
            >
              <span
                className={`w-2 h-2 rounded-full ${ev.statusColor} border border-white`}
              />
              <span className="truncate">{ev.title}</span>
            </button>
            {extra > 0 && (
              <button
                type="button"
                className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={() => openAllForDay()}
                aria-label={`Show ${extra} more tasks`}
              >
                +{extra}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const [taskModal, setTaskModal] = useState(null);

  const openTaskModal = (data) => {
    // Normalize input to shape: { dateStr: 'YYYY-MM-DD', events: Event[] }
    try {
      if (!data) return;
      // Already in correct shape
      if (data && Array.isArray(data.events) && typeof data.dateStr === 'string') {
        setTaskModal({ dateStr: data.dateStr, events: data.events });
        return;
      }
      // If an array of events is provided
      if (Array.isArray(data)) {
        const first = data[0];
        const d = first?.dueDate || first?.start || first?.end;
        const date = d instanceof Date ? d : (d ? new Date(d) : new Date());
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        setTaskModal({ dateStr: `${y}-${m}-${dd}`, events: data });
        return;
      }
      // Single event object
      const ev = data;
      const d = ev?.dueDate || ev?.start || ev?.end;
      const date = d instanceof Date ? d : (d ? new Date(d) : new Date());
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      setTaskModal({ dateStr: `${y}-${m}-${dd}`, events: [ev] });
    } catch {
      // Fallback: close modal on any unexpected input
      setTaskModal(null);
    }
  };

  const closeTaskModal = () => {
    setTaskModal(null);
  };

  // Programmatic API: open modals from outside via events or global API
  useEffect(() => {
    const openDayHandler = (e) => {
      try {
        const d = e?.detail?.date;
        const date = d instanceof Date ? d : (d ? new Date(d) : new Date());
        if (isNaN(date)) return;
        const y = date.getFullYear();
        const m = date.getMonth();
        const dd = date.getDate();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        const eventsForDay = exampleEvents.filter(ev =>
          ev.dueDate.getFullYear() === y &&
          ev.dueDate.getMonth() === m &&
          ev.dueDate.getDate() === dd
        );
        setTaskModal({ dateStr, events: eventsForDay });
      } catch (err) {
        console.error('open-calendar-day failed:', err);
      }
    };

    const openTaskHandler = (e) => {
      try {
        const taskId = e?.detail?.taskId;
        if (!taskId) return;
        const ev = exampleEvents.find(ev => ev.id === taskId);
        if (ev) {
          setSelectedEvent(ev);
        }
      } catch (err) {
        console.error('open-calendar-task failed:', err);
      }
    };

    const openTaskDayHandler = (e) => {
      try {
        const taskId = e?.detail?.taskId;
        if (!taskId) return;
        const ev = exampleEvents.find(ev => ev.id === taskId);
        if (!ev) return;
        const d = ev.dueDate instanceof Date ? ev.dueDate : new Date(ev.dueDate || ev.start);
        const y = d.getFullYear();
        const m = d.getMonth();
        const dd = d.getDate();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        const eventsForDay = exampleEvents.filter(x =>
          x.dueDate.getFullYear() === y && x.dueDate.getMonth() === m && x.dueDate.getDate() === dd
        );
        setTaskModal({ dateStr, events: eventsForDay });
      } catch (err) {
        console.error('open-calendar-task-day failed:', err);
      }
    };

    window.addEventListener('open-calendar-day', openDayHandler);
    window.addEventListener('open-calendar-task', openTaskHandler);
    window.addEventListener('open-calendar-task-day', openTaskDayHandler);

    // Expose a simple global API as well
    window.CalendarAPI = {
      openDay: (date) => openDayHandler({ detail: { date } }),
      openTask: (taskId) => openTaskHandler({ detail: { taskId } }),
      openTaskDay: (taskId) => openTaskDayHandler({ detail: { taskId } }),
    };

    return () => {
      window.removeEventListener('open-calendar-day', openDayHandler);
      window.removeEventListener('open-calendar-task', openTaskHandler);
      window.removeEventListener('open-calendar-task-day', openTaskDayHandler);
      if (window.CalendarAPI) delete window.CalendarAPI;
    };
  }, [exampleEvents]);

  const scheduleEvents = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return exampleEvents.filter((event) => {
      if (!event.dueDate) return false;
      const dueDate = new Date(event.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    });
  }, [exampleEvents, selectedDate]);

  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const filteredEvents = useMemo(() => {
    return scheduleEvents.filter((event) => {
      const priorityMatch =
        selectedPriority === "All" || event.priority === selectedPriority;
      const statusMatch =
        selectedStatus === "All" ||
        (selectedStatus === "Done Late"
          ? event.status === "done_late"
          : event.status === selectedStatus.toLowerCase().replace(" ", "_"));
      return priorityMatch && statusMatch;
    });
  }, [scheduleEvents, selectedPriority, selectedStatus]);

  const handlePrevSchedule = () => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7)
    );
  };

  const handleNextSchedule = () => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7)
    );
  };

  const [selectedEvent, setSelectedEvent] = useState(null);

  const openEventDetails = (event) => {
    setSelectedEvent(event);
  };

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  const monthLabels = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevYear = () => setSelectedYear((y) => y - 1);
  const handleNextYear = () => setSelectedYear((y) => y + 1);

  const handleMonthClick = (monthIndex) => {
    setSelectedDate(new Date(selectedYear, monthIndex, 1));
    setView("Month");
  };

  const [hoveredDate, setHoveredDate] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (dateStr, events) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredDate({ dateStr, events });
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredDate(null);
  };

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  const handlePrevWeek = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const handlePrevMonth = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const t = new Date();
    if (view === "Year") {
      setSelectedYear(t.getFullYear());
    } else {
      setSelectedDate(t);
    }
  };

  const isToday =
    selectedYMD.y === todayYMD.y &&
    selectedYMD.m === todayYMD.m &&
    selectedYMD.d === todayYMD.d;

  const scheduleHeader = useMemo(() => {
    if (view !== "Schedule" && view !== "Week") return monthName;
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} - ${endOfWeek.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  }, [view, selectedDate, monthName]);

  const viewHeader = useMemo(() => {
    if (view === "Day") return monthName;
    if (view === "Week" || view === "Schedule") return scheduleHeader;
    return monthName;
  }, [view, monthName, scheduleHeader]);

  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    status: "todo",
    priority: "Medium",
    startDate: "",
    dueDate: "",
    description: "",
  });

  const resetForm = () => {
    setFormError("");
    setFormData({
      title: "",
      status: "todo",
      priority: "Medium",
      startDate: "",
      dueDate: "",
      description: "",
    });
  };

  const validate = (data = formData) => {
    const errs = [];
    if (!data.title?.trim()) errs.push("Title is required.");
    if (data.startDate && data.dueDate && data.startDate > data.dueDate) {
      errs.push("Due date must be on/after start date.");
    }
    setFormError(errs.join(" "));
    return errs.length === 0;
  };

  const addTask = async () => {
    if (!validate()) return;
    const newTask = {
      title: formData.title.trim(),
      status:
        formData.status === "missing" || formData.status === "done_late"
          ? "todo"
          : formData.status,
      priority: formData.priority,
      start_date: formData.startDate || "",
      due_date: formData.dueDate || "",
      description: formData.description || "",
      user_id: USER_ID,
    };
    try {
      await api.post("/tasks", newTask);
      window.dispatchEvent(new CustomEvent("task-updated"));
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Failed to add task:", err);
      setFormError("Failed to add task. Please try again.");
    }
  };

  const handleAddTaskClick = (dayNum) => {
    if (!dayNum) return;
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const dueDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      dayNum
    ).padStart(2, "0")}`;
    const today = new Date();
    const startDateStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setFormData({
      title: "",
      status: "todo",
      priority: "Medium",
      startDate: startDateStr,
      dueDate: dueDateStr,
      description: "",
    });
    setFormError("");
    setShowForm(true);
  };

  // Format status for display
  const formatStatus = (status) => {
    if (status === "done_late") return "Done Late";
    return status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <ErrorBoundary>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center text-xl">
          Loading tasks...
        </div>
      ) : error ? (
        <div className="min-h-screen flex flex-col items-center justify-center text-xl gap-4">
          <div className="text-red-600">{error}</div>
          <button
            onClick={() => window.location.reload()} // reload for full retry
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="h-screen overflow-hidden" style={cssVars}>
          <div className="h-full w-full flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-shrink-0 z-20 bg-transparent">
                <div className="mb-3 mt-2 px-2">
                  <Card className="h-[80px] w-full px-4 flex items-center justify-between hover:shadow-none hover:-translate-y-0 hover:bg-inherit cursor-default">
                    <h1 className="text-3xl font-bold tracking-tight">
                      Schedule
                    </h1>
                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2 bg-card rounded-full px-4 py-2 border border-gray-200">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                          placeholder="Search"
                          className="outline-none text-sm placeholder:text-gray-400 bg-transparent"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="flex-1 px-2 pb-2 pt-2 overflow-hidden">
                <div className="h-full">
                  <Card className="h-full pt-3 pr-6 pl-6 flex flex-col border-4 border-[#63a8ff] shadow-[0_0_0_6px_rgba(99,168,255,0.08)] overflow-hidden">
                    <div className="-mt-2 flex items-center justify-between px-2 mb-4">
                      {view === "Year" ? (
                        <div className="pt-3 font-extrabold text-center text-xl flex items-center gap-3">
                          <div className="flex gap-2">
                            <button
                              onClick={handlePrevYear}
                              className="px-4 py-2 bg-white/80 border border-gray-300 rounded-full hover:bg-gray-100 active:bg-gray-200 shadow-sm transition-colors duration-150"
                              aria-label="Previous year"
                              title="Previous year"
                              type="button"
                            >
                              &lt;
                            </button>
                            <button
                              onClick={handleNextYear}
                              className="px-4 py-2 bg-white/80 border border-gray-300 rounded-full hover:bg-gray-100 active:bg-gray-200 shadow-sm transition-colors duration-150"
                              aria-label="Next year"
                              title="Next year"
                              type="button"
                            >
                              &gt;
                            </button>
                          </div>
                          <div
                            className="cursor-pointer select-none"
                            onClick={() => setView("Year")}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) =>
                              e.key === "Enter" && setView("Year")
                            }
                          >
                            {selectedYear}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 font-extrabold text-center text-xl flex items-center gap-3">
                          <div className="flex gap-2">
                            <button
                              onClick={
                                view === "Day"
                                  ? handlePrevDay
                                  : view === "Week" || view === "Schedule"
                                  ? handlePrevWeek
                                  : handlePrevMonth
                              }
                              className="px-4 py-2 bg-white/80 border border-gray-300 rounded-full hover:bg-gray-100 active:bg-gray-200 shadow-sm transition-colors duration-150"
                              aria-label="Previous"
                              title="Previous"
                              type="button"
                            >
                              &lt;
                            </button>
                            <button
                              onClick={
                                view === "Day"
                                  ? handleNextDay
                                  : view === "Week" || view === "Schedule"
                                  ? handleNextWeek
                                  : handleNextMonth
                              }
                              className="px-4 py-2 bg-white/80 border border-gray-300 rounded-full hover:bg-gray-100 active:bg-gray-200 shadow-sm transition-colors duration-150"
                              aria-label="Next"
                              title="Next"
                              type="button"
                            >
                              &gt;
                            </button>
                          </div>
                          <div
                            className="cursor-pointer select-none"
                            onClick={() => setView(view)}
                            role="button"
                            tabIndex={0}
                            onKeyPress={(e) =>
                              e.key === "Enter" && setView(view)
                            }
                          >
                            {viewHeader}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleToday}
                          className="px-4 py-2 bg-white/80 border border-gray-300 rounded-full hover:bg-gray-100 active:bg-gray-200 shadow-sm transition-colors duration-150"
                          aria-label="Today"
                          title="Today"
                          type="button"
                        >
                          Today
                        </button>
                        <Dropdown
                          label="View"
                          options={["Day", "Week", "Month", "Year", "Schedule"]}
                          value={view}
                          onChange={setView}
                        />
                        {view === "Schedule" && (
                          <>
                            <Dropdown
                              label="Priority"
                              options={["All", "Low", "Medium", "High"]}
                              value={selectedPriority}
                              onChange={setSelectedPriority}
                            />
                            <Dropdown
                              label="Status"
                              options={[
                                "All",
                                "To Do",
                                "In Progress",
                                "Missing",
                                "Completed",
                                "Done Late",
                              ]}
                              value={selectedStatus}
                              onChange={setSelectedStatus}
                            />
                          </>
                        )}
                      </div>
                    </div>
                    {view === "Day" ? (
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="rounded-full bg-accent text-on-accent w-12 h-12 grid place-items-center font-bold shadow-sm">
                              {String(selectedDate.getDate())}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-primary">
                                {selectedDate.toLocaleDateString(undefined, {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {gmtOffset}
                                {tzName ? ` · ${tzName}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {liveTime.toLocaleTimeString()}
                          </div>
                        </div>
                        <div
                          ref={dayContainerRef}
                          className="relative border rounded-lg overflow-y-auto h-[520px]"
                        >
                          <div className="relative">
                            {isToday && (
                              <HourIndicator
                                minutePercent={dayIndicatorFraction}
                                styleOverride={{
                                  left: "var(--gutter-width)",
                                  right: 0,
                                  zIndex: 30,
                                }}
                              />
                            )}
                            {Array.from({ length: 24 }).map((_, hr) => {
                              const labelHour = hr % 12 === 0 ? 12 : hr % 12;
                              const ampm = hr < 12 ? "AM" : "PM";
                              const isCurrentHour = hr === currentHour;
                              return (
                                <div
                                  key={hr}
                                  data-hour={hr}
                                  className={`relative flex items-center gap-4 px-3 ${
                                    isCurrentHour && isToday
                                      ? "bg-white/5 ring-1 ring-accent"
                                      : ""
                                  }`}
                                  style={{
                                    height: "var(--row-height)",
                                    minHeight: "var(--row-height)",
                                    borderTop: `1px solid var(--separator-color)`,
                                  }}
                                >
                                  <div
                                    className="text-right text-sm text-gray-500 pr-4"
                                    style={{ width: "var(--gutter-width)" }}
                                  >
                                    <div className="inline-block">
                                      {labelHour} {ampm}
                                    </div>
                                  </div>
                                  <div className="flex-1 relative overflow-hidden">
                                    {isCurrentHour && isToday && (
                                      <HourIndicator
                                        minutePercent={minutePercent}
                                        styleOverride={{
                                          zIndex: 20,
                                          left: "var(--gutter-width)",
                                          right: 0,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : view === "Week" ? (
                      <div className="w-full">
                        <div
                          ref={weekContainerRef}
                          className="relative overflow-y-auto h-[520px] mt-3 bg-white"
                        >
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns:
                                "var(--gutter-width) repeat(7, 1fr)",
                            }}
                          >
                            <div className="pl-3 pt-2 text-sm text-gray-500 border-b border-gray-200 sticky top-0 bg-white z-20">
                              {gmtOffset}
                              {tzName ? ` (${tzName})` : ""}
                            </div>
                            {weekDays.map((d, i) => {
                              const isToday =
                                d.getFullYear() === todayYMD.y &&
                                d.getMonth() === todayYMD.m &&
                                d.getDate() === todayYMD.d;
                              return (
                                <div
                                  key={i}
                                  className="py-3 text-center border-b border-gray-200 sticky top-0 bg-white z-20"
                                >
                                  <div className="text-xs font-medium text-gray-500 uppercase">
                                    {d.toLocaleDateString(undefined, {
                                      weekday: "short",
                                    })}
                                  </div>
                                  <div className="mt-1">
                                    {isToday ? (
                                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-on-accent font-bold">
                                        {d.getDate()}
                                      </div>
                                    ) : (
                                      <div className="text-lg font-semibold text-gray-800">
                                        {d.getDate()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {Array.from({ length: 24 }).map((_, hr) => {
                              const labelHour = hr % 12 === 0 ? 12 : hr % 12;
                              const ampm = hr < 12 ? "AM" : "PM";
                              const isCurrentHour = hr === currentHour;
                              return (
                                <React.Fragment key={hr}>
                                  <div
                                    ref={hr === 0 ? weekGutterRef : undefined}
                                    data-hour={hr}
                                    className={`flex items-center justify-end pr-3 text-sm text-gray-500 px-3 border-t ${
                                      isCurrentHour
                                        ? "bg-white/5 ring-1 ring-accent"
                                        : ""
                                    }`}
                                    style={{
                                      minHeight: "var(--row-height)",
                                      height: "var(--row-height)",
                                    }}
                                  >
                                    <div>
                                      {labelHour} {ampm}
                                    </div>
                                  </div>
                                  {weekDays.map((d, ci) => {
                                    const eventsForCell = exampleEvents.filter(
                                      (ev) =>
                                        ev.start.getDate() === d.getDate() &&
                                        ev.start.getMonth() === d.getMonth() &&
                                        ev.start.getFullYear() === d.getFullYear() &&
                                        ev.start.getHours() === hr
                                    );
                                    const eventsForDay = exampleEvents.filter(ev =>
                                      ev.start.getDate() === d.getDate() &&
                                      ev.start.getMonth() === d.getMonth() &&
                                      ev.start.getFullYear() === d.getFullYear()
                                    );
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                    const dd = String(d.getDate()).padStart(2, '0');
                                    const showIndicator = isCurrentHour && d.getFullYear() === todayYMD.y && d.getMonth() === todayYMD.m && d.getDate() === todayYMD.d;
                                    return (
                                      <div
                                        key={`${hr}-${ci}`}
                                        className={`relative px-2 border-t border-gray-200 ${
                                          ci > 0
                                            ? "border-l border-gray-200"
                                            : ""
                                        } ${isCurrentHour ? "bg-white/5" : ""}`}
                                        style={{
                                          minHeight: "var(--row-height)",
                                          height: "var(--row-height)",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {showIndicator && (
                                          <HourIndicator
                                            minutePercent={minutePercent}
                                            styleOverride={{
                                              left: 0,
                                              right: 0,
                                              zIndex: 10,
                                            }}
                                          />
                                        )}
                                        {eventsForCell.length > 0 && (
                                          <div className="absolute inset-0 p-1 flex flex-col gap-1 items-start overflow-hidden">
                                            {renderCellEventsCompact(eventsForCell, () => openTaskModal({ dateStr: `${y}-${m}-${dd}`, events: eventsForDay }))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : view === "Year" ? (
                      <div className="w-full flex flex-col">
                        <div
                          ref={yearScheduleContainerRef}
                          className="overflow-y-auto"
                          style={{
                            maxHeight: "520px",
                            paddingTop: 6,
                            paddingBottom: 12,
                          }}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center px-2">
                            {monthLabels.map((m, idx) => {
                              const firstOfMonth = new Date(
                                selectedYear,
                                idx,
                                1
                              );
                              const lastDate = new Date(
                                selectedYear,
                                idx + 1,
                                0
                              ).getDate();
                              const leading = firstOfMonth.getDay();
                              const totalCells = 42;
                              const cells = Array.from(
                                { length: totalCells },
                                (_, i) => {
                                  const dayNum = i - leading + 1;
                                  return dayNum > 0 && dayNum <= lastDate
                                    ? dayNum
                                    : null;
                                }
                              );
                              return (
                                <div
                                  key={m}
                                  className="text-left border border-gray-100 rounded-lg p-3 bg-white hover:shadow-md transition-shadow flex flex-col"
                                  style={{ width: "240px", minHeight: "220px" }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-semibold">{m}</div>
                                    <div className="text-sm text-gray-500">
                                      {selectedYear}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-7 gap-1 text-[12px] text-center flex-1">
                                    {cells.map((day, ci) => {
                                      const isToday =
                                        day &&
                                        selectedYear === todayYMD.y &&
                                        idx === todayYMD.m &&
                                        day === todayYMD.d;
                                      const dateStr = day
                                        ? `${selectedYear}-${String(
                                            idx + 1
                                          ).padStart(2, "0")}-${String(
                                            day
                                          ).padStart(2, "0")}`
                                        : null;
                                      const eventsForDay = dateStr
                                        ? exampleEvents.filter(
                                            (ev) =>
                                              ev.dueDate.getFullYear() ===
                                                selectedYear &&
                                              ev.dueDate.getMonth() === idx &&
                                              ev.dueDate.getDate() === day
                                          )
                                        : [];
                                      const priorityDots = eventsForDay.map(
                                        (ev) => ev.color
                                      );
                                      return (
                                        <div
                                          key={ci}
                                          className="py-[2px] relative group"
                                          onMouseEnter={() =>
                                            eventsForDay.length > 0 &&
                                            handleMouseEnter(
                                              dateStr,
                                              eventsForDay
                                            )
                                          }
                                          onMouseLeave={handleMouseLeave}
                                          onFocus={() =>
                                            eventsForDay.length > 0 &&
                                            handleMouseEnter(
                                              dateStr,
                                              eventsForDay
                                            )
                                          }
                                          onBlur={handleMouseLeave}
                                          role={day ? "button" : undefined}
                                          tabIndex={day ? 0 : undefined}
                                          onKeyPress={(e) =>
                                            day &&
                                            e.key === "Enter" &&
                                            handleMonthClick(idx)
                                          }
                                          aria-label={
                                            day
                                              ? `View tasks for ${m} ${day}, ${selectedYear}`
                                              : undefined
                                          }
                                        >
                                          {day ? (
                                            <div>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleMonthClick(idx)
                                                }
                                                className={`w-full inline-flex items-center justify-center h-6 rounded-full transition-colors ${
                                                  isToday
                                                    ? "bg-accent text-on-accent font-bold shadow-sm"
                                                    : "text-gray-700 hover:bg-gray-100"
                                                }`}
                                                style={{
                                                  border: "none",
                                                  background: "transparent",
                                                  padding: "2px",
                                                }}
                                              >
                                                <div className="text-[12px] leading-4">
                                                  {day}
                                                </div>
                                              </button>
                                              {priorityDots.length > 0 && (
                                                <div className="flex justify-center gap-1 mt-1">
                                                  {priorityDots
                                                    .slice(0, 3)
                                                    .map((color, di) => (
                                                      <div
                                                        key={di}
                                                        className={`w-1.5 h-1.5 rounded-full ${color}`}
                                                      />
                                                    ))}
                                                </div>
                                              )}
                                              {hoveredDate?.dateStr ===
                                                dateStr &&
                                                hoveredDate.events.length >
                                                  0 && (
                                                  <div
                                                    className="absolute z-20 bottom-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-72 max-h-64 overflow-y-auto transition-opacity duration-200 opacity-100"
                                                    role="dialog"
                                                    aria-label={`Tasks for ${m} ${day}, ${selectedYear}`}
                                                  >
                                                    <div className="flex justify-between items-center mb-3">
                                                      <h3 className="text-sm font-semibold text-gray-900">
                                                        {m} {day},{" "}
                                                        {selectedYear}
                                                      </h3>
                                                      <span className="text-xs text-gray-500">
                                                        {
                                                          hoveredDate.events
                                                            .length
                                                        }{" "}
                                                        {hoveredDate.events
                                                          .length === 1
                                                          ? "Task"
                                                          : "Tasks"}
                                                      </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                      {hoveredDate.events
                                                        .slice(0, 3)
                                                        .map((ev, ei) => (
                                                          <div
                                                            key={ei}
                                                            className="flex items-start gap-2"
                                                          >
                                                            <div
                                                              className={`w-2 h-2 rounded-full ${ev.color} mt-1.5`}
                                                            />
                                                            <div>
                                                              <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                                {ev.title}
                                                              </div>
                                                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                                                <svg
                                                                  className="w-3 h-3"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  viewBox="0 0 24 24"
                                                                >
                                                                  <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                                  />
                                                                </svg>
                                                                Priority:{" "}
                                                                {ev.priority}
                                                              </div>
                                                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                                                <svg
                                                                  className="w-3 h-3"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  viewBox="0 0 24 24"
                                                                >
                                                                  <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth="2"
                                                                    d="M5 13l4 4L19 7"
                                                                  />
                                                                </svg>
                                                                Status:{" "}
                                                                {formatStatus(
                                                                  ev.status
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        ))}
                                                      {hoveredDate.events
                                                        .length > 3 && (
                                                        <button
                                                          type="button"
                                                          className="text-xs text-blue-600 font-medium hover:underline"
                                                          onClick={() =>
                                                            openTaskModal(
                                                              hoveredDate.events
                                                            )
                                                          }
                                                          aria-label={`Show all ${hoveredDate.events.length} tasks`}
                                                        >
                                                          +
                                                          {hoveredDate.events
                                                            .length - 3}{" "}
                                                          more
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                          ) : (
                                            <div className="h-4">&nbsp;</div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : view === "Schedule" ? (
                      <div className="w-full">
                        <div
                          ref={yearScheduleContainerRef}
                          className="overflow-y-auto h-[520px] mt-3 bg-white border rounded-lg"
                        >
                          <div className="divide-y divide-gray-200">
                            {filteredEvents.length > 0 ? (
                              filteredEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${event.start < liveTime ? 'bg-blue-50' : ''}`}
                                  onClick={() => {
                                    const d = event.dueDate instanceof Date ? event.dueDate : new Date(event.dueDate || event.start);
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                    const dd = String(d.getDate()).padStart(2, '0');
                                    const sameDayEvents = filteredEvents.filter(ev => {
                                      const de = ev.dueDate instanceof Date ? ev.dueDate : new Date(ev.dueDate || ev.start);
                                      return de.getFullYear() === y && de.getMonth() === d.getMonth() && de.getDate() === d.getDate();
                                    });
                                    openTaskModal({ dateStr: `${y}-${m}-${dd}`, events: sameDayEvents });
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${event.color} mb-1`}
                                      >
                                        <span
                                          className={`w-2 h-2 rounded-full ${event.statusColor} border border-white`}
                                        />
                                        {event.title}
                                      </div>
                                      <p className="text-sm text-gray-900 mb-1 truncate">
                                        {event.description}
                                      </p>
                                      <p className="text-xs text-gray-500 mb-1">
                                        Status: {formatStatus(event.status)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Priority: {event.priority}
                                      </p>
                                    </div>
                                    <div className="ml-4 text-right">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {event.start.toLocaleDateString(
                                          undefined,
                                          {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                          }
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium mb-2">
                                  No events scheduled
                                </p>
                                <p>Create your first event to get started.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7">
                        <div className="col-span-7 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 uppercase mb-2">
                          <div>Sun</div>
                          <div>Mon</div>
                          <div>Tue</div>
                          <div>Wed</div>
                          <div>Thu</div>
                          <div>Fri</div>
                          <div>Sat</div>
                        </div>
                        {daysGrid.map((dayNum, i) => {
                          const isToday =
                            dayNum &&
                            dayNum === todayYMD.d &&
                            selectedDate.getMonth() === todayYMD.m &&
                            selectedDate.getFullYear() === todayYMD.y;
                          const dateStr = dayNum
                            ? `${selectedDate.getFullYear()}-${String(
                                selectedDate.getMonth() + 1
                              ).padStart(2, "0")}-${String(dayNum).padStart(
                                2,
                                "0"
                              )}`
                            : null;
                          // Find ALL events for this day
                          const eventsForDay = exampleEvents.filter(
                            (ev) =>
                              ev.dueDate.getFullYear() ===
                                selectedDate.getFullYear() &&
                              ev.dueDate.getMonth() ===
                                selectedDate.getMonth() &&
                              ev.dueDate.getDate() === dayNum
                          );
                          // Render cell
                          return (
                            <div
                              key={i}
                              className={`relative group border border-gray-100 p-2 min-h-[100px] text-sm rounded-lg ${
                                isToday
                                  ? "bg-accent text-on-accent"
                                  : "bg-white text-gray-700"
                              } ${
                                eventsForDay.length > 0
                                  ? "cursor-pointer hover:ring-2 hover:ring-blue-300"
                                  : ""
                              }`}
                              onClick={
                                eventsForDay.length > 0
                                  ? () =>
                                      setTaskModal({
                                        dateStr,
                                        events: eventsForDay,
                                      })
                                  : undefined
                              }
                              tabIndex={eventsForDay.length > 0 ? 0 : undefined}
                              aria-label={
                                dayNum && eventsForDay.length > 0
                                  ? `View tasks for ${
                                      monthLabels[selectedDate.getMonth()]
                                    } ${dayNum}`
                                  : undefined
                              }
                            >
                              {dayNum && (
                                <div
                                  className={`font-semibold mb-1 ${
                                    isToday ? "text-on-accent" : ""
                                  }`}
                                >
                                  {dayNum}
                                </div>
                              )}
                              {eventsForDay.length > 0 && (
                                <div className="flex gap-1 mt-1 mb-0.5 items-center">
                                  {eventsForDay.slice(0, 3).map((ev, di) => (
                                    <div
                                      key={di}
                                      className={`w-2 h-2 rounded-full ${
                                        ev.status === "completed" ||
                                        ev.completed
                                          ? "bg-gray-400 opacity-60"
                                          : ev.color
                                      }`}
                                    ></div>
                                  ))}
                                  {eventsForDay.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setTaskModal({ dateStr, events: eventsForDay }); }}
                                      className="text-[10px] align-middle text-gray-600 font-semibold hover:underline"
                                      aria-label={`Show all ${eventsForDay.length} tasks for ${dateStr}`}
                                    >
                                      +{eventsForDay.length - 3}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
            {taskModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
                <div className="bg-white rounded-lg max-w-md w-full border shadow-2xl p-7 relative">
                  <button
                    onClick={closeTaskModal}
                    className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-800"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                  <h2 className="text-lg font-bold mb-3">
                    Tasks on {taskModal.dateStr}
                  </h2>
                  <div className="divide-y divide-gray-200">
                    {taskModal.events.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`py-3 flex gap-3 items-center ${
                          ev.status === "completed" || ev.completed
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            ev.status === "completed" || ev.completed
                              ? "bg-gray-400"
                              : ev.color
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold ${
                              ev.status === "completed" || ev.completed
                                ? "line-through"
                                : ""
                            }`}
                          >
                            {ev.title}
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                            <span className="capitalize">
                              {ev.status || "unknown status"}
                            </span>
                            <span>|</span>
                            <span>Priority: {ev.priority}</span>
                            {ev.description && <span>| {ev.description}</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Due: {ev.dueDate?.toLocaleDateString()}
                          </div>
                        </div>
                        {/* Optionally add more info/actions here... */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {selectedEvent && (
              <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden border border-gray-200 shadow-2xl">
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Tasks for{" "}
                      {selectedEvent?.dueDate
                        ? new Date(selectedEvent.dueDate).toLocaleDateString(
                            undefined,
                            { month: "long", day: "numeric", year: "numeric" }
                          )
                        : "Unknown Date"}
                    </h2>
                    <button
                      onClick={closeEventDetails}
                      className="text-gray-500 hover:text-gray-700 text-lg font-medium"
                      aria-label="Close event modal"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)]">
                    <div className="space-y-3">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white ${selectedEvent.color}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${selectedEvent.statusColor} border border-white`}
                        />
                        <span className="truncate">{selectedEvent.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Priority: {selectedEvent.priority}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Status: {formatStatus(selectedEvent.status)}
                      </div>
                      {selectedEvent.description && (
                        <div className="text-sm text-gray-600">
                          Description: {selectedEvent.description}
                        </div>
                      )}
                      {selectedEvent.startDate && (
                        <div className="text-sm text-gray-600">
                          Start Date: {(() => {
                            const d = selectedEvent.startDate;
                            const dt = d instanceof Date ? d : (d ? new Date(d) : null);
                            return dt && !isNaN(dt) ? dt.toLocaleDateString() : String(d);
                          })()}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        Due Date: {(() => {
                          const d = selectedEvent.dueDate;
                          const dt = d instanceof Date ? d : (d ? new Date(d) : null);
                          return dt && !isNaN(dt) ? dt.toLocaleDateString() : String(d);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                <div
                  className="absolute inset-0 bg-black/10"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                />
                <div className="relative rounded-xl w-[920px] shadow-lg border border-gray-200 bg-white overflow-hidden">
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-[#f5eed6]">
                    <h3 className="text-lg font-semibold">Add New Task</h3>
                    <button
                      className="text-gray-500"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <TaskForm
                    data={formData}
                    setData={setFormData}
                    error={formError}
                    onSubmit={addTask}
                    onCancel={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    isEditing={false}
                  />
                </div>
              </div>
            )}
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
                >
                  ☀️
                </button>
                <button
                  type="button"
                  className="knob-button"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <button
                  type="button"
                  className="moon-button"
                  aria-pressed={theme === "dark"}
                  aria-label="Switch to dark mode"
                  onClick={() => setTheme("dark")}
                >
                  🌙
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
