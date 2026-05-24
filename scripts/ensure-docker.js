#!/usr/bin/env node
const { execSync, spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

function isDaemonUp() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function waitFor(predicate, { timeoutMs, intervalMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

(async () => {
  if (isDaemonUp()) return;

  if (process.platform !== 'win32') {
    console.error('Docker daemon is not running. Start Docker and retry.');
    process.exit(1);
  }

  const candidates = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Docker', 'Docker', 'Docker Desktop.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Docker', 'Docker', 'Docker Desktop.exe'),
    path.join(process.env['LOCALAPPDATA'] || '', 'Docker', 'Docker Desktop.exe'),
  ].filter(Boolean);

  const exe = candidates.find((p) => fs.existsSync(p));
  if (!exe) {
    console.error('Could not find Docker Desktop.exe. Start Docker Desktop manually and retry.');
    process.exit(1);
  }

  console.log('Docker daemon not running — starting Docker Desktop...');
  spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();

  const ready = await waitFor(isDaemonUp, { timeoutMs: 90_000, intervalMs: 2_000 });
  if (!ready) {
    console.error('Docker Desktop did not become ready within 90s. Try again once it finishes starting.');
    process.exit(1);
  }
  console.log('Docker is ready.');
})();
