// Simple Express mock backend for signup
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.post('/api/users/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  // Simulate user creation and token
  return res.status(201).json({
    user: { id: Date.now(), name, email },
    token: 'mock-token-123',
    message: 'Registration successful (mock)'
  });
});

// Mock admin analytics endpoint
app.post('/api/admin/analytics', (req, res) => {
  const { start, end } = req.body || {};
  // Return simple mock analytics data; in a real backend this would aggregate DB records
  const tasks = [
    { id: 1, title: 'Task 1', priority: 'High', status: 'completed', date: start || new Date().toISOString() },
    { id: 2, title: 'Task 2', priority: 'Medium', status: 'in_progress', date: start || new Date().toISOString() },
    { id: 3, title: 'Task 3', priority: 'Low', status: 'todo', date: end || new Date().toISOString() },
  ];
  const stressLogs = [
    { ts: start || new Date().toISOString(), level: 3, tags: ['Time Pressure'] },
    { ts: end || new Date().toISOString(), level: 2, tags: ['Workload'] },
  ];

  return res.status(200).json({ tasks, stressLogs });
});

app.get('/', (req, res) => res.send('Mock backend running'));

app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});
