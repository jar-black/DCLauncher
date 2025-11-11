const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const execPromise = promisify(exec);

const PROJECTS_DIR = path.join(__dirname, '../../../projects');
const CONFIG_FILE = path.join(__dirname, '../../../projects.json');

class AndroidService {
  constructor() {
    this.ensureProjectsDir();
  }

  ensureProjectsDir() {
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    }
  }

  // Get all Android projects from config
  getAndroidProjects() {
    if (!fs.existsSync(CONFIG_FILE)) {
      return [];
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return config.projects.filter(p => p.type === 'android' && p.enabled);
  }

  // Clone or update Android repository
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
      console.error(`Error cloning/updating ${project.name}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Get last modified date for an Android project
  async getLastModified(projectName) {
    const projectPath = path.join(PROJECTS_DIR, projectName);

    if (!fs.existsSync(projectPath)) {
      return null;
    }

    try {
      const git = simpleGit(projectPath);
      const log = await git.log({ maxCount: 1 });
      return log.latest ? new Date(log.latest.date) : null;
    } catch (error) {
      console.error(`Error getting last modified for ${projectName}:`, error.message);
      return null;
    }
  }

  // Get all Android projects with their status
  async getAndroidProjectsStatus() {
    const projects = this.getAndroidProjects();
    const projectsStatus = [];

    for (const project of projects) {
      const projectPath = path.join(PROJECTS_DIR, project.name);
      const exists = fs.existsSync(projectPath);
      const lastModified = await this.getLastModified(project.name);

      projectsStatus.push({
        name: project.name,
        repository: project.repository,
        exists,
        lastModified,
        path: projectPath
      });
    }

    return projectsStatus;
  }

  // Get connected ADB devices
  async getAdbDevices() {
    try {
      // Check if adb is available
      try {
        await execPromise('adb version');
      } catch (error) {
        return {
          success: false,
          error: 'ADB is not installed or not in PATH',
          devices: []
        };
      }

      const { stdout } = await execPromise('adb devices -l');
      const lines = stdout.split('\n').slice(1); // Skip header line
      const devices = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === '') continue;

        // Parse device line: serial_number status [properties]
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2 && parts[1] === 'device') {
          const serial = parts[0];

          // Extract model and product info if available
          const modelMatch = line.match(/model:(\S+)/);
          const productMatch = line.match(/product:(\S+)/);

          devices.push({
            serial,
            model: modelMatch ? modelMatch[1] : 'Unknown',
            product: productMatch ? productMatch[1] : 'Unknown',
            status: 'connected'
          });
        }
      }

      return { success: true, devices };
    } catch (error) {
      console.error('Error getting ADB devices:', error.message);
      return { success: false, error: error.message, devices: [] };
    }
  }

  // Build and install Android app on specified device
  async buildAndInstall(projectName, deviceSerial) {
    const projectPath = path.join(PROJECTS_DIR, projectName);

    if (!fs.existsSync(projectPath)) {
      return {
        success: false,
        error: `Project ${projectName} does not exist. Clone it first.`
      };
    }

    try {
      console.log(`Building ${projectName}...`);

      // Check if gradlew exists
      const gradlewPath = path.join(projectPath, 'gradlew');
      if (!fs.existsSync(gradlewPath)) {
        return {
          success: false,
          error: 'gradlew not found. This might not be a valid Android project.'
        };
      }

      // Make gradlew executable
      await execPromise(`chmod +x ${gradlewPath}`);

      // Build the APK
      console.log('Building APK...');
      const buildCommand = deviceSerial
        ? `ANDROID_SERIAL=${deviceSerial} ./gradlew installDebug`
        : './gradlew assembleDebug';

      const { stdout, stderr } = await execPromise(buildCommand, {
        cwd: projectPath,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for build output
      });

      console.log('Build output:', stdout);

      if (deviceSerial) {
        // If we used installDebug, it's already installed
        return {
          success: true,
          message: `Successfully built and installed ${projectName} on device ${deviceSerial}`,
          output: stdout
        };
      } else {
        // Find the generated APK
        const apkPath = await this.findApk(projectPath);
        if (!apkPath) {
          return {
            success: false,
            error: 'APK built but could not be found in build output'
          };
        }

        // Install on device
        console.log(`Installing APK on device ${deviceSerial}...`);
        const installCmd = `adb -s ${deviceSerial} install -r "${apkPath}"`;
        const installResult = await execPromise(installCmd);

        return {
          success: true,
          message: `Successfully built and installed ${projectName} on device ${deviceSerial}`,
          output: stdout,
          apkPath
        };
      }
    } catch (error) {
      console.error(`Error building/installing ${projectName}:`, error);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr
      };
    }
  }

  // Find the built APK file
  async findApk(projectPath) {
    try {
      const { stdout } = await execPromise(
        `find "${projectPath}" -name "*.apk" -path "*/build/outputs/apk/*" | grep -v "unaligned" | head -1`
      );
      return stdout.trim() || null;
    } catch (error) {
      return null;
    }
  }

  // Clone all Android projects
  async cloneAllAndroidProjects() {
    const projects = this.getAndroidProjects();
    const results = [];

    for (const project of projects) {
      const result = await this.cloneOrUpdateRepo(project);
      results.push({
        name: project.name,
        ...result
      });
    }

    return results;
  }
}

module.exports = new AndroidService();
