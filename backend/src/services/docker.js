const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

const docker = new Docker();
const CONFIG_FILE = path.join(__dirname, '../../../projects.json');

class DockerService {
  loadConfig() {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error reading config file:', error);
      return { projects: [] };
    }
  }

  async getRunningProjects() {
    try {
      const config = this.loadConfig();
      const containers = await docker.listContainers();

      const projectMap = new Map();

      for (const container of containers) {
        // Get project name from labels or directory name
        const labels = container.Labels || {};
        const projectLabel = labels['com.docker.compose.project'];

        if (!projectLabel) continue;

        if (!projectMap.has(projectLabel)) {
          projectMap.set(projectLabel, {
            name: projectLabel,
            containers: [],
            ports: [],
            status: 'running'
          });
        }

        const project = projectMap.get(projectLabel);

        // Extract container info
        const containerInfo = {
          id: container.Id.substring(0, 12),
          name: container.Names[0].replace('/', ''),
          image: container.Image,
          status: container.State,
          created: container.Created
        };

        // Extract ports
        const ports = container.Ports.map(port => {
          if (port.PublicPort) {
            return {
              container: port.PrivatePort,
              host: port.PublicPort,
              protocol: port.Type,
              url: `http://localhost:${port.PublicPort}`
            };
          }
          return null;
        }).filter(p => p !== null);

        containerInfo.ports = ports;
        project.containers.push(containerInfo);

        // Add unique ports to project
        ports.forEach(port => {
          if (!project.ports.find(p => p.host === port.host)) {
            project.ports.push(port);
          }
        });
      }

      // Convert map to array and add config info
      const projects = Array.from(projectMap.values());

      // Add repository info from config
      projects.forEach(project => {
        const configProject = config.projects.find(
          p => p.name.toLowerCase() === project.name.toLowerCase()
        );
        if (configProject) {
          project.repository = configProject.repository;
        }
      });

      return projects;
    } catch (error) {
      console.error('Error getting running projects:', error);
      throw error;
    }
  }

  async getContainerStats(containerId) {
    try {
      const container = docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });
      return stats;
    } catch (error) {
      console.error('Error getting container stats:', error);
      throw error;
    }
  }
}

module.exports = new DockerService();
