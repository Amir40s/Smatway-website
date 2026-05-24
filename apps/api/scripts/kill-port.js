#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

const PORT = 3002;
const isWindows = os.platform() === 'win32';

function killPortWindows() {
  try {
    // Use Get-NetTCPConnection PowerShell cmdlet (more reliable)
    const psCommand = `Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { taskkill /PID $_ /F }`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit', shell: true });
    console.log(`✓ Port ${PORT} cleaned up`);
  } catch (e) {
    // Fallback to netstat method
    try {
      const output = execSync(`netstat -ano`, { encoding: 'utf8' });
      const lines = output.split('\n');
      const line = lines.find(l => l.includes(`:${PORT}`) && l.includes('LISTENING'));

      if (line) {
        // Extract PID (last number in the line)
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        if (pid && !isNaN(pid)) {
          console.log(`Killing process ${pid} on port ${PORT}...`);
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
          console.log(`✓ Port ${PORT} cleaned up`);
        } else {
          console.log(`✓ Port ${PORT} is available`);
        }
      } else {
        console.log(`✓ Port ${PORT} is available`);
      }
    } catch (fallbackError) {
      console.log(`✓ Port ${PORT} is available or already in use`);
    }
  }
}

function killPortUnix() {
  try {
    const output = execSync(`lsof -ti:${PORT}`, { encoding: 'utf8' }).trim();
    if (output) {
      console.log(`Killing process ${output} on port ${PORT}...`);
      execSync(`kill -9 ${output}`, { stdio: 'inherit' });
      console.log(`✓ Port ${PORT} cleaned up`);
    } else {
      console.log(`✓ Port ${PORT} is available`);
    }
  } catch (e) {
    // Try fuser as fallback
    try {
      execSync(`fuser -k ${PORT}/tcp`, { stdio: 'inherit' });
      console.log(`✓ Port ${PORT} cleaned up`);
    } catch (e2) {
      console.log(`✓ Port ${PORT} is available`);
    }
  }
}

try {
  if (isWindows) {
    killPortWindows();
  } else {
    killPortUnix();
  }
} catch (error) {
  console.error(`Error killing port ${PORT}:`, error.message);
  process.exit(1);
}
