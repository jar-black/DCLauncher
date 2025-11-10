const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const PROJECTS_DIR = path.join(__dirname, '../../../projects');
const CONFIG_FILE = path.join(__dirname, '../../../projects.json');

class LauncherService {
  constructor() {
    this.ensureProjectsDirectory();
  }

  ensureProjectsDirectory() {
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    }
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error reading config file:', error);
      throw new Error('Failed to load projects configuration');
    }
  }

  async cloneOrUpdateRepo(project) {
    const projectPath = path.join(PROJECTS_DIR, project.name);

    try {
      if (fs.existsSync(projectPath)) {
        console.log(`Updating ${project.name}...`);
        const git = simpleGit(projectPath);
        await git.pull();
      } else {
        console.log(`Cloning ${project.name}...`);
        await simpleGit().clone(project.repository, projectPath);
      }
      return { success: true, path: projectPath };
    } catch (error) {
      console.error(`Error with repository ${project.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  async runDockerCompose(projectPath, projectName) {
    try {
      console.log(`Running docker compose for ${projectName}...`);
      const { stdout, stderr } = await execPromise(
        'docker compose up --build -d',
        { cwd: projectPath }
      );

      if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
        console.error(`Docker compose stderr for ${projectName}:`, stderr);
      }

      return { success: true, output: stdout };
    } catch (error) {
      console.error(`Error running docker compose for ${projectName}:`, error);

      // Provide helpful error messages for common issues
      let helpfulMessage = error.message;
      const errorOutput = error.message + (error.stderr || '') + (error.stdout || '');

      // Detect deprecated/missing Docker images
      if (errorOutput.includes('not found')) {
        const imageMatch = errorOutput.match(/docker\.io\/library\/([^:]+):([^\s]+)/);
        if (imageMatch) {
          const imageName = imageMatch[1];
          const imageTag = imageMatch[2];

          // Provide specific guidance for common deprecated images
          const suggestions = {
            'openjdk': `The openjdk image is deprecated. Try updating the Dockerfile to use:\n  - eclipse-temurin:${imageTag}\n  - amazoncorretto:${imageTag}\n  - adoptopenjdk:${imageTag}`,
            'python': imageTag.startsWith('2') ? 'Python 2 is EOL. Update to python:3.x' : `Try using python:${imageTag}-slim or python:${imageTag}-alpine`,
            'node': parseInt(imageTag) < 14 ? 'This Node.js version is EOL. Use node:18 or node:20 (LTS versions)' : null
          };

          const suggestion = suggestions[imageName];
          if (suggestion) {
            helpfulMessage = `Docker image ${imageName}:${imageTag} not found.\n\n${suggestion}\n\nTo fix:\n1. Edit the Dockerfile in projects/${projectName}/\n2. Update the FROM line to use a supported image\n3. Re-run docker compose up --build -d`;
          } else {
            helpfulMessage = `Docker image ${imageName}:${imageTag} not found.\n\nThe base image may be deprecated or the tag doesn't exist.\nCheck Docker Hub for available tags: https://hub.docker.com/_/${imageName}\n\nTo fix:\n1. Edit the Dockerfile in projects/${projectName}/\n2. Update the FROM line to use a valid image tag\n3. Re-run docker compose up --build -d`;
          }
        }
      }

      // Detect port conflicts
      if (errorOutput.includes('port is already allocated') || errorOutput.includes('address already in use')) {
        helpfulMessage = `Port conflict detected.\n\nAnother service is already using one of the ports required by ${projectName}.\n\nTo fix:\n1. Stop the conflicting service, or\n2. Edit projects/${projectName}/docker-compose.yaml to use different ports`;
      }

      return { success: false, error: helpfulMessage };
    }
  }

  async launchProjects() {
    const config = this.loadConfig();
    const enabledProjects = config.projects.filter(p => p.enabled !== false);

    const results = [];

    for (const project of enabledProjects) {
      console.log(`\n=== Processing ${project.name} ===`);

      const cloneResult = await this.cloneOrUpdateRepo(project);
      if (!cloneResult.success) {
        results.push({
          name: project.name,
          status: 'failed',
          stage: 'clone',
          error: cloneResult.error
        });
        continue;
      }

      const composeResult = await this.runDockerCompose(cloneResult.path, project.name);
      results.push({
        name: project.name,
        status: composeResult.success ? 'success' : 'failed',
        stage: composeResult.success ? 'completed' : 'docker-compose',
        error: composeResult.error,
        output: composeResult.output
      });
    }

    return {
      total: enabledProjects.length,
      results
    };
  }
}

module.exports = new LauncherService();
