#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║      DCLauncher - Starting Up...     ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');

// Start the backend server
console.log('🚀 Starting backend server...');
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

backend.on('error', (error) => {
  console.error('❌ Failed to start backend:', error);
  process.exit(1);
});

// Wait a bit before starting frontend
setTimeout(() => {
  console.log('🎨 Starting frontend dashboard...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('❌ Failed to start frontend:', error);
    backend.kill();
    process.exit(1);
  });

  frontend.on('close', (code) => {
    console.log('Frontend stopped');
    backend.kill();
  });
}, 2000);

backend.on('close', (code) => {
  console.log('Backend stopped');
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down DCLauncher...');
  backend.kill();
  process.exit(0);
});
