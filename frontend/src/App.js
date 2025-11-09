import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [launching, setLaunching] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const launchProjects = async () => {
    try {
      setLaunching(true);
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to launch projects');
      }

      const result = await response.json();
      console.log('Launch result:', result);

      // Refresh projects after a short delay to allow containers to start
      setTimeout(() => {
        fetchProjects();
      }, 3000);
    } catch (err) {
      console.error('Error launching projects:', err);
      setError(err.message);
    } finally {
      setLaunching(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Refresh every 10 seconds
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <Dashboard
        projects={projects}
        loading={loading}
        error={error}
        launching={launching}
        onRefresh={fetchProjects}
        onLaunch={launchProjects}
      />
    </div>
  );
}

export default App;
