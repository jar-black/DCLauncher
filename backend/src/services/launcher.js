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
      console.log(`Running docker-compose for ${projectName}...`);
      const { stdout, stderr } = await execPromise(
        'docker-compose up --build -d',
        { cwd: projectPath }
      );

      if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
        console.error(`Docker compose stderr for ${projectName}:`, stderr);
      }

      return { success: true, output: stdout };
    } catch (error) {
      console.error(`Error running docker-compose for ${projectName}:`, error);
      return { success: false, error: error.message };
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
