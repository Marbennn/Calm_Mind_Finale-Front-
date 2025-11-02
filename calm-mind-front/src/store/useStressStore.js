import { create } from 'zustand';
import api from '../api/client';

const USER_ID = "69008a1fd3c8660f1ff28779";

// Stress calculation utilities
const calculateStressByPriority = (priority) => {
  switch (priority) {
    case "High": return 1.0;
    case "Medium": return 0.6;
    case "Low": return 0.3;
    default: return 0.3;
  }
};

const calculateDeadlineFactor = (dueDate) => {
  if (!dueDate) return 0.5; // Default moderate stress for no deadline
  
  const now = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = Math.max(0, (due - now) / (1000 * 60 * 60 * 24));
  
  if (dueDate < now) return 1.0; // Overdue
  if (daysUntilDue <= 1) return 0.9; // Due within 24 hours
  if (daysUntilDue <= 3) return 0.7; // Due within 3 days
  if (daysUntilDue <= 7) return 0.5; // Due within a week
  return 0.3; // Due in more than a week
};

const calculateCompletionFactor = (status, subtasks = []) => {
  if (status === "completed") return 0;
  if (status === "in_progress") return 0.7;
  
  // Consider subtasks if present
  if (subtasks.length > 0) {
    const completed = subtasks.filter(st => st.completed).length;
    const total = subtasks.length;
    return 1 - (completed / total) * 0.3; // Max reduction of 30% based on subtasks
  }
  
  return status === "missing" ? 1.0 : 0.8;
};

const calculateTaskStress = (task) => {
  if (!task) return 0;
  
  const priorityStress = calculateStressByPriority(task.priority);
  const deadlineStress = calculateDeadlineFactor(task.due_date || task.dueDate);
  const completionStress = calculateCompletionFactor(task.status, task.subtasks);
  
  // Final Stress Basis formula: Stress = Priority + Deadline Factor + Completion Factor
  const stress = (priorityStress + deadlineStress + completionStress) / 3;
  return Math.min(1, stress); // Normalize to [0,1]
};

const useStressStore = create((set, get) => ({
  // State
  tasks: [],
  loading: false,
  error: null,
  lastUpdate: null,
  analytics: {
    averageStress: 0,
    stressByCategory: {},
    weeklyTrend: [],
    predictedStress: null,
  },

  // Task Operations
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/tasks');
      // Normalize tasks so every task has a stable `id` field (use _id when present)
      const tasks = res.data.map(t => ({
        ...t,
        id: t.id || t._id,
        stress: calculateTaskStress(t),
      }));
      set({ 
        tasks,
        lastUpdate: new Date().toISOString(),
        loading: false 
      });
      get().updateAnalytics(tasks);
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTask: async (taskData) => {
    set({ loading: true });
    try {
      const res = await api.post("/tasks", taskData);
      // Normalize new task id
      const newTask = { ...res.data.task, id: res.data.task.id || res.data.task._id, stress: calculateTaskStress(res.data.task) };
      const updatedTasks = [...get().tasks, newTask];
      set({ 
        tasks: updatedTasks,
        lastUpdate: new Date().toISOString(),
        loading: false 
      });
      get().updateAnalytics(updatedTasks);
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true });
    try {
      // First update locally for immediate UI feedback
      const updatedTasks = get().tasks.map(t => 
        (t.id === id || t._id === id) ? { ...t, ...updates, id: t.id || t._id, stress: calculateTaskStress({ ...t, ...updates }) } : t
      );
      set({ tasks: updatedTasks });
      
      // Then send to backend
      await api.put(`/tasks/${id}`, updates);
      
      // Update analytics after successful save
      set({ 
        lastUpdate: new Date().toISOString(),
        loading: false 
      });
      get().updateAnalytics(updatedTasks);
    } catch (err) {
      // Only revert on actual API errors, not network timeouts
      const isApiError = err.response && err.response.status >= 400;
      if (isApiError) {
        await get().fetchTasks(); // Revert local changes
        set({ error: "Failed to save changes. Please try again.", loading: false });
      } else {
        // For timeout/network errors, keep local changes but show warning
        set({ 
          error: "Changes saved locally. Will retry sync when connection improves.",
          loading: false 
        });
        // Try to sync in background
        setTimeout(() => {
          api.put(`/tasks/${id}`, updates).catch(() => {
            // Silent catch - will try again on next fetch
          });
        }, 3000);
      }
    }
  },

  deleteTask: async (id) => {
    set({ loading: true });
    try {
      await api.delete(`/tasks/${id}`);
      // Remove task by either id or _id to be safe
      const updatedTasks = get().tasks.filter(t => (t.id !== id && t._id !== id));
      set({ 
        tasks: updatedTasks,
        lastUpdate: new Date().toISOString(),
        loading: false 
      });
      get().updateAnalytics(updatedTasks);
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Analytics Operations
  updateAnalytics: (tasks = get().tasks) => {
    // Connect averageStress to the total task stress level (percent of total vs max across active tasks)
    const activeStress = tasks
      .filter(t => !t.completed && t.status !== 'completed')
      .map(t => t.stress);
    const totalStress = activeStress.reduce((a, b) => a + b, 0);
    const maxStress = activeStress.length; // each active task maxes at 1.0 in this model
    const averageStress = maxStress > 0 ? Math.round((totalStress / maxStress) * 100) : 0; // integer 0..100

    // Task-management total stress snapshot (sum over active tasks)
    const totalStressTask = activeStress.reduce((a, b) => a + b, 0); // 0..N (since each per-task stress is 0..1)
    const maxStressTask = activeStress.length; // each active task maxes at 1.0 in this model
    const totalStressPercent = maxStressTask > 0 ? Math.round((totalStressTask / maxStressTask) * 100) : 0;

    // Calculate stress by category
    const categories = ['todo', 'in_progress', 'missing', 'completed'];
    const stressByCategory = categories.reduce((acc, cat) => {
      const catTasks = tasks.filter(t => t.status === cat);
      acc[cat] = catTasks.length 
        ? catTasks.reduce((sum, t) => sum + (t.stress || 0), 0) / catTasks.length
        : 0;
      return acc;
    }, {});

    // Calculate weekly trend (simplified)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyTasks = tasks.filter(t => {
      const taskDate = new Date(t.due_date || t.dueDate);
      return taskDate >= weekAgo && taskDate <= now;
    });
    const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekAgo.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const dayTasks = weeklyTasks.filter(t => {
        const taskDate = new Date(t.due_date || t.dueDate);
        return taskDate.toDateString() === day.toDateString();
      });
      return {
        date: day.toISOString().split('T')[0],
        stress: dayTasks.length 
          ? dayTasks.reduce((sum, t) => sum + (t.stress || 0), 0) / dayTasks.length
          : 0
      };
    });

    // Predict future stress (simple linear regression)
    const predictedStress = weeklyTrend.length >= 3 
      ? weeklyTrend.reduce((sum, day) => sum + day.stress, 0) / weeklyTrend.length * 1.1 // 10% increase projection
      : averageStress;

    set({
      analytics: {
        averageStress, // now represents total stress level as percent (0..100)
        stressByCategory,
        weeklyTrend,
        predictedStress: Math.min(1, predictedStress), // Cap at 100%
      },
      lastUpdate: new Date().toISOString(),
    });

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('stress-updated', {
      detail: {
        averageStress,
        stressByCategory,
        lastUpdate: new Date().toISOString(),
      }
    }));
  },

  // Utility getters for components
  getTaskStress: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId || t._id === taskId);
    return task ? task.stress : 0;
  },

  getActiveTaskCount: () => 
    get().tasks.filter(t => !t.completed && t.status !== 'completed').length,

  getMostStressfulTasks: (limit = 5) => 
    [...get().tasks]
      .filter(t => !t.completed && t.status !== 'completed')
      .sort((a, b) => (b.stress || 0) - (a.stress || 0))
      .slice(0, limit),

  getDailyStressSummary: () => {
    const tasks = get().tasks;
    const activeStress = tasks
      .filter(t => !t.completed && t.status !== 'completed')
      .map(t => t.stress);
    
    return {
      average: activeStress.length 
        ? activeStress.reduce((a, b) => a + b, 0) / activeStress.length
        : 0,
      total: activeStress.reduce((a, b) => a + b, 0),
      max: activeStress.length, // theoretical max when every active task is at stress=1
      percent: activeStress.length ? Number(((activeStress.reduce((a,b)=>a+b,0) / activeStress.length) * 100).toFixed(1)) : 0,
      count: activeStress.length,
      lastUpdate: get().lastUpdate,
    };
  },

  // Expose task-management totals for any consumer without UI changes
  getTaskStressTotals: () => {
    const tasks = get().tasks;
    const activeStress = tasks
      .filter(t => !t.completed && t.status !== 'completed')
      .map(t => t.stress);
    const total = activeStress.reduce((a, b) => a + b, 0);
    const max = activeStress.length;
    const percent = max > 0 ? Number(((total / max) * 100).toFixed(1)) : 0;
    return { total, max, percent, average: max ? total / max : 0 };
  },
}));

export default useStressStore;
