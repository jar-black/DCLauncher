const express = require('express');
const cors = require('cors');
const path = require('path');
const launcherService = require('./services/launcher');
const dockerService = require('./services/docker');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await dockerService.getRunningProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/launch', async (req, res) => {
  try {
    const result = await launcherService.launchProjects();
    res.json(result);
  } catch (error) {
    console.error('Error launching projects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`DCLauncher backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
