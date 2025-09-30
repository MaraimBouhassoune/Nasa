import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const processes = [];

function cleanup() {
  console.log('\nShutting down servers...');
  processes.forEach(proc => {
    try {
      proc.kill();
    } catch (e) {
      // ignore
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('Starting Python FastAPI backend on port 8000...');
const pythonProcess = spawn('python', ['server/main.py'], {
  stdio: 'inherit',
  shell: true
});
processes.push(pythonProcess);

pythonProcess.on('error', (err) => {
  console.error('Failed to start Python backend:', err);
});

setTimeout(() => {
  console.log('Starting Node.js Express frontend on port 5000...');
  const nodeProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  processes.push(nodeProcess);

  nodeProcess.on('error', (err) => {
    console.error('Failed to start Node.js frontend:', err);
  });
}, 3000);
