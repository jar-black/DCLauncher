import React, { useState, useEffect } from 'react';
import './AndroidInstallationTable.css';

function AndroidInstallationTable() {
  const [androidProjects, setAndroidProjects] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState({});
  const [installing, setInstalling] = useState({});
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Android projects
  const fetchAndroidProjects = async () => {
    try {
      const response = await fetch('/api/android/projects');
      const data = await response.json();
      setAndroidProjects(data);
    } catch (error) {
      console.error('Error fetching Android projects:', error);
      setError('Failed to fetch Android projects');
    }
  };

  // Fetch ADB devices
  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/android/devices');
      const data = await response.json();

      if (data.success) {
        setDevices(data.devices);
      } else {
        setDevices([]);
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError('Failed to fetch ADB devices');
    }
  };

  // Clone Android projects
  const cloneProjects = async () => {
    setCloning(true);
    setError(null);
    try {
      const response = await fetch('/api/android/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const results = await response.json();
      console.log('Clone results:', results);

      // Refresh the projects list
      await fetchAndroidProjects();
    } catch (error) {
      console.error('Error cloning projects:', error);
      setError('Failed to clone Android projects');
    } finally {
      setCloning(false);
    }
  };

  // Install Android app on selected device
  const installApp = async (projectName) => {
    const deviceSerial = selectedDevices[projectName];

    if (!deviceSerial) {
      alert('Please select a device first');
      return;
    }

    setInstalling({ ...installing, [projectName]: true });
    setError(null);

    try {
      const response = await fetch('/api/android/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName,
          deviceSerial,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'App installed successfully');
      } else {
        alert(`Installation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error installing app:', error);
      alert('Failed to install app');
    } finally {
      setInstalling({ ...installing, [projectName]: false });
    }
  };

  // Handle device selection
  const handleDeviceSelect = (projectName, deviceSerial) => {
    setSelectedDevices({
      ...selectedDevices,
      [projectName]: deviceSerial,
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not cloned yet';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  useEffect(() => {
    fetchAndroidProjects();
    fetchDevices();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchAndroidProjects();
      fetchDevices();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (androidProjects.length === 0) {
    return null; // Don't show the table if there are no Android projects
  }

  return (
    <div className="android-installation-section">
      <div className="android-header">
        <h2>Android Applications</h2>
        <button
          className="clone-button"
          onClick={cloneProjects}
          disabled={cloning}
        >
          {cloning ? 'Cloning...' : 'Clone/Update All'}
        </button>
      </div>

      {error && (
        <div className="android-error">
          ⚠️ {error}
        </div>
      )}

      <div className="devices-info">
        <strong>Connected Devices:</strong>{' '}
        {devices.length > 0 ? (
          devices.map((d) => `${d.model} (${d.serial})`).join(', ')
        ) : (
          <span className="no-devices">
            No devices connected. Please connect a device via USB and enable USB debugging.
          </span>
        )}
      </div>

      <table className="android-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last Changed</th>
            <th>Device</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {androidProjects.map((project) => (
            <tr key={project.name}>
              <td>
                <div className="project-name">{project.name}</div>
                {project.repository && (
                  <div className="project-repo-link">
                    <a
                      href={project.repository.replace(
                        'git@github.com:',
                        'https://github.com/'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Repository
                    </a>
                  </div>
                )}
              </td>
              <td>{formatDate(project.lastModified)}</td>
              <td>
                <select
                  className="device-select"
                  value={selectedDevices[project.name] || ''}
                  onChange={(e) =>
                    handleDeviceSelect(project.name, e.target.value)
                  }
                  disabled={devices.length === 0}
                >
                  <option value="">Select device</option>
                  {devices.map((device) => (
                    <option key={device.serial} value={device.serial}>
                      {device.model} ({device.serial})
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="install-button"
                  onClick={() => installApp(project.name)}
                  disabled={
                    installing[project.name] ||
                    !selectedDevices[project.name] ||
                    !project.exists
                  }
                >
                  {installing[project.name]
                    ? 'Installing...'
                    : project.exists
                    ? 'Install'
                    : 'Clone first'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AndroidInstallationTable;
