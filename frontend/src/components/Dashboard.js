import React from 'react';
import './Dashboard.css';
import ProjectCard from './ProjectCard';
import AndroidInstallationTable from './AndroidInstallationTable';

function Dashboard({ projects, loading, error, launching, onRefresh, onLaunch }) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>DCLauncher Dashboard</h1>
        <p className="subtitle">Docker Compose Project Manager</p>
      </header>

      <div className="dashboard-controls">
        <button
          className="btn btn-primary"
          onClick={onLaunch}
          disabled={launching}
        >
          {launching ? 'Launching...' : 'Launch All Projects'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>{projects.length} Projects Running</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="projects-grid">
        {loading && projects.length === 0 ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h2>No Running Projects</h2>
            <p>Click "Launch All Projects" to start your configured projects</p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))
        )}
      </div>

      <AndroidInstallationTable />
    </div>
  );
}

export default Dashboard;
