const express = require('express');
const cors = require('cors');
const path = require('path');
const launcherService = require('./services/launcher');
const dockerService = require('./services/docker');
const androidService = require('./services/android');

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

// Android API Routes
app.get('/api/android/projects', async (req, res) => {
  try {
    const projects = await androidService.getAndroidProjectsStatus();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching Android projects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/android/devices', async (req, res) => {
  try {
    const result = await androidService.getAdbDevices();
    res.json(result);
  } catch (error) {
    console.error('Error fetching ADB devices:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/android/clone', async (req, res) => {
  try {
    const results = await androidService.cloneAllAndroidProjects();
    res.json(results);
  } catch (error) {
    console.error('Error cloning Android projects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/android/install', async (req, res) => {
  try {
    const { projectName, deviceSerial } = req.body;

    if (!projectName || !deviceSerial) {
      return res.status(400).json({
        error: 'projectName and deviceSerial are required'
      });
    }

    const result = await androidService.buildAndInstall(projectName, deviceSerial);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error installing Android app:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`DCLauncher backend running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
