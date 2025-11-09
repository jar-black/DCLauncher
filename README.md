# DCLauncher

A powerful Docker Compose project launcher with a beautiful React dashboard that automatically clones GitHub repositories and manages their Docker containers.

## Features

- **Automatic Project Deployment**: Clones GitHub repositories and runs `docker-compose up --build -d` automatically
- **Real-time Dashboard**: Beautiful React dashboard showing all running projects
- **Port Monitoring**: Displays all exposed ports with direct links to access services
- **Container Management**: View all running containers per project with their status
- **Auto-refresh**: Dashboard automatically updates every 10 seconds
- **Easy Configuration**: Simple JSON configuration file for managing projects

## Prerequisites

- Node.js 16 or higher
- Docker and Docker Compose
- Git

## Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd DCLauncher-
```

2. Install dependencies:
```bash
npm run install:all
```

This will install dependencies for both backend and frontend.

## Configuration

Edit the `projects.json` file in the root directory to add your GitHub projects:

```json
{
  "projects": [
    {
      "name": "my-awesome-project",
      "repository": "https://github.com/username/my-awesome-project.git",
      "enabled": true
    },
    {
      "name": "another-project",
      "repository": "https://github.com/username/another-project.git",
      "enabled": true
    }
  ]
}
```

### Configuration Options

- `name`: Display name for the project (will be used as directory name)
- `repository`: GitHub repository URL (HTTPS or SSH)
- `enabled`: Set to `false` to skip this project during launch

## Usage

### Development Mode

Run both backend and frontend in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run backend

# Terminal 2 - Frontend
npm run frontend
```

The dashboard will be available at: http://localhost:3000

### Using the Dashboard

1. **Launch Projects**: Click the "Launch All Projects" button to clone and start all enabled projects
2. **View Running Projects**: See all running Docker containers organized by project
3. **Access Services**: Click on port links to open services in your browser
4. **Refresh**: Manually refresh the dashboard or wait for auto-refresh

### Production Deployment

Run DCLauncher itself in Docker:

```bash
docker-compose up --build -d
```

This will:
- Build and run the backend API on port 3001
- Build and run the frontend dashboard on port 3000
- Mount the Docker socket for container management
- Persist projects in the `./projects` directory

## Project Structure

```
DCLauncher-/
├── backend/                 # Node.js/Express backend
│   ├── src/
│   │   ├── index.js        # Main server file
│   │   └── services/
│   │       ├── launcher.js # Project launching logic
│   │       └── docker.js   # Docker monitoring logic
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React dashboard
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   └── ProjectCard.js
│   │   ├── App.js
│   │   └── index.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── projects/               # Cloned repositories (auto-created)
├── projects.json           # Configuration file
├── docker-compose.yml      # DCLauncher deployment
├── launcher.js             # Development launcher script
└── package.json           # Root package file
```

## API Endpoints

### GET /api/projects
Returns all running Docker Compose projects with their containers and ports.

**Response:**
```json
[
  {
    "name": "my-project",
    "repository": "https://github.com/user/my-project.git",
    "status": "running",
    "containers": [...],
    "ports": [
      {
        "container": 80,
        "host": 8080,
        "protocol": "tcp",
        "url": "http://localhost:8080"
      }
    ]
  }
]
```

### POST /api/launch
Launches all enabled projects from the configuration file.

**Response:**
```json
{
  "total": 2,
  "results": [
    {
      "name": "my-project",
      "status": "success",
      "stage": "completed"
    }
  ]
}
```

### GET /api/health
Health check endpoint.

## How It Works

1. **Configuration**: Projects are defined in `projects.json`
2. **Cloning**: When launched, each repository is cloned to the `./projects` directory
3. **Building**: DCLauncher runs `docker-compose up --build -d` in each project directory
4. **Monitoring**: The backend uses Dockerode to monitor all running containers
5. **Dashboard**: The React frontend displays real-time information about all projects

## Requirements for Managed Projects

For a project to work with DCLauncher, it must have a `docker-compose.yml` or `docker-compose.yaml` file in its root directory.

## Troubleshooting

### Projects not showing up
- Check that the projects have been cloned successfully in the `./projects` directory
- Verify that each project has a `docker-compose.yml` file
- Check the backend logs for errors

### Port conflicts
- Make sure the ports defined in your projects' docker-compose files are not already in use
- Check for conflicts between different projects

### Docker connection issues
- Ensure Docker daemon is running
- Verify that the user has permission to access the Docker socket
- On Linux, you may need to add your user to the `docker` group

### Frontend can't connect to backend
- Verify the backend is running on port 3001
- Check CORS settings if accessing from a different domain

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Screenshots

The dashboard provides:
- Overview of all running projects
- Real-time container status
- One-click access to exposed services
- Beautiful, modern UI with gradient backgrounds
- Responsive design for mobile and desktop

## Future Enhancements

- [ ] Stop/Start individual projects
- [ ] View container logs
- [ ] Resource usage monitoring (CPU, Memory)
- [ ] Project search and filtering
- [ ] Custom environment variables per project
- [ ] Scheduled launches
- [ ] Webhook support for auto-deployment
- [ ] Multi-user support with authentication

## Support

For issues, questions, or contributions, please open an issue on GitHub.
