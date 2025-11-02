// src/utils/adminAnalytics.js
import { deriveStatus, taskDateYMD } from './analyticsData';
import { toDate } from './dateHelpers';
import api from '../api/client';

/**
 * adminAnalytics utilities
 * All functions defensively accept missing/undefined inputs and return stable shapes.
 */

// Fetch aggregated data for all users
export async function fetchGlobalAnalytics(dateRange = {}) {
  try {
    const body = {
      start: dateRange.start && dateRange.start.toISOString ? dateRange.start.toISOString() : dateRange.start,
      end: dateRange.end && dateRange.end.toISOString ? dateRange.end.toISOString() : dateRange.end,
    };
    const { data } = await api.post('/admin/analytics', body);
    return data || { tasks: [], stressLogs: [] };
  } catch (error) {
    console.error('Error in fetchGlobalAnalytics:', error?.response?.data || error?.message);
    throw error;
  }
}

// Aggregate tasks by priority across all users
export function getGlobalPriorityDistribution(tasks = []) {
  const distribution = { High: 0, Medium: 0, Low: 0 };
  tasks.forEach((task) => {
    distribution[task.priority] = (distribution[task.priority] || 0) + 1;
  });
  return Object.entries(distribution).map(([name, value]) => ({ name, value }));
}

// Calculate global status counts
export function getGlobalStatusCounts(tasks = []) {
  const statusCounts = { "To Do": 0, "In Progress": 0, "Missing": 0, "Completed": 0 };
  tasks.forEach((task) => {
    const status = deriveStatus(task);
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  return statusCounts;
}

// Calculate average stress levels over time for all users
export function calculateGlobalStressLevels(stressLogs = [], periods = []) {
  // Return an ordered array of { label, stress } where stress is the average level in that period
  if (!Array.isArray(periods) || periods.length === 0) return [];
  return periods.map((period) => {
    const logsInPeriod = (stressLogs || []).filter((log) => {
      const logDate = toDate(log.ts || log.date);
      return logDate >= period.start && logDate <= period.end;
    });

    const avg = logsInPeriod.length > 0
      ? logsInPeriod.reduce((sum, log) => sum + (Number(log.level) || 0), 0) / logsInPeriod.length
      : 0;

    return { label: period.label, stress: Math.round(avg * 10) / 10 };
  });
}

// Calculate global workload vs stress correlation
export function calculateGlobalWorkloadStressCorrelation(tasks = [], stressLogs = [], periods = []) {
  if (!Array.isArray(periods) || periods.length === 0) return [];
  return periods.map((period) => {
    const tasksInPeriod = (tasks || []).filter((task) => {
      const taskDate = toDate(taskDateYMD(task));
      return taskDate >= period.start && taskDate <= period.end;
    });

    const stressLogsInPeriod = (stressLogs || []).filter((log) => {
      const logDate = toDate(log.ts || log.date);
      return logDate >= period.start && logDate <= period.end;
    });

    const avgStress = stressLogsInPeriod.length > 0
      ? stressLogsInPeriod.reduce((sum, log) => sum + (Number(log.level) || 0), 0) / stressLogsInPeriod.length
      : 0;

    return {
      period: period.label,
      workload: tasksInPeriod.length,
      averageStress: Math.round(avgStress * 10) / 10,
    };
  });
}

// Aggregate stressor tags across all users
export function aggregateGlobalStressors(stressLogs = []) {
  const tagCounts = {};
  (stressLogs || []).forEach((log) => {
    if (log.tags) {
      log.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  return Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Calculate predictive trends based on historical data
export function calculateGlobalPredictiveTrends(tasks = [], stressLogs = [], periods = []) {
  const correlation = calculateGlobalWorkloadStressCorrelation(tasks, stressLogs, periods);

  // Simple linear regression for prediction
  const n = correlation.length;
  if (n < 2) return { historical: correlation, predicted: null };

  const sumX = correlation.reduce((sum, point) => sum + point.workload, 0);
  const sumY = correlation.reduce((sum, point) => sum + point.averageStress, 0);
  const sumXY = correlation.reduce((sum, point) => sum + (point.workload * point.averageStress), 0);
  const sumXX = correlation.reduce((sum, point) => sum + (point.workload * point.workload), 0);

  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // Add prediction for next period
  const lastWorkload = correlation[correlation.length - 1].workload;
  const predictedStress = slope * (lastWorkload + 1) + intercept;

  return {
    historical: correlation,
    predicted: {
      workload: lastWorkload + 1,
      predictedStress: Math.max(0, Math.min(5, Math.round(predictedStress * 10) / 10)),
    },
  };
}
