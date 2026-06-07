const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * POST /kill-switch
 * Completely tears down PM2, removes the project directory, and exits the process.
 *
 * Body: { "token": "<KILL_TOKEN value>" }
 * Env:  KILL_TOKEN — the secret required to authorize the shutdown
 */
router.post('/kill-switch', (req, res) => {
  const { token } = req.body;
  const KILL_TOKEN = process.env.KILL_TOKEN;

  // ── Guard: token must be set in the environment ──────────────────────────
  if (!KILL_TOKEN) {
    return res.status(500).json({
      success: false,
      message: 'KILL_TOKEN environment variable is not configured on this server.',
    });
  }

  // ── Guard: token must match ───────────────────────────────────────────────
  if (!token || token !== KILL_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: invalid or missing token.',
    });
  }

  // ── Send the success response BEFORE we start tearing everything down ─────
  res.status(200).json({
    success: true,
    message: 'Kill switch triggered. The server is shutting down.',
  });

  // ── Give Express a moment to flush the response, then execute ─────────────
  setTimeout(() => executeKillSequence(), 500);
});

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: run a shell command and return a Promise (never rejects — errors
//  are logged but the sequence continues regardless).
// ─────────────────────────────────────────────────────────────────────────────
function run(cmd) {
  return new Promise((resolve) => {
    console.log(`[kill-switch] Running: ${cmd}`);
    exec(cmd, { shell: true }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[kill-switch] Error running "${cmd}":`, err.message);
      }
      if (stdout) console.log(`[kill-switch] stdout: ${stdout.trim()}`);
      if (stderr) console.error(`[kill-switch] stderr: ${stderr.trim()}`);
      resolve(); // always resolve — we keep going even on error
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helper: delete a path (file or directory) recursively, ignoring errors.
// ─────────────────────────────────────────────────────────────────────────────
function deletePath(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`[kill-switch] Deleted: ${targetPath}`);
    } else {
      console.log(`[kill-switch] Path not found (skipping): ${targetPath}`);
    }
  } catch (err) {
    console.error(`[kill-switch] Failed to delete "${targetPath}":`, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main kill sequence
// ─────────────────────────────────────────────────────────────────────────────
async function executeKillSequence() {
  console.log('[kill-switch] ⚡ Starting kill sequence…');

  // 1. Stop all PM2 processes and kill the PM2 daemon
  await run('pm2 kill');

  // 2. Remove the PM2 systemd/startup service
  //    `pm2 unstartup` figures out the init system automatically.
  await run('pm2 unstartup');

  // 3. Uninstall PM2 globally
  await run('npm uninstall -g pm2');

  // 4. Remove lingering systemd unit files for PM2
  //    (covers common paths; non-existent files are silently skipped by rm -f)
  await run('rm -f /etc/systemd/system/pm2*.service');
  await run('rm -f /lib/systemd/system/pm2*.service');
  await run('systemctl daemon-reload');

  // 5. Delete the ~/.pm2 directory
  const pm2Dir = path.join(os.homedir(), '.pm2');
  deletePath(pm2Dir);

  // 6. Delete the entire project directory (__dirname resolves to the
  //    directory of THIS file; adjust if your entry-point lives elsewhere)
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`[kill-switch] Scheduling deletion of project root: ${projectRoot}`);

  // We schedule the directory removal AFTER the process exits so the OS
  // isn't asked to delete files that are still in use.  The `at now` trick
  // (or a detached shell) removes the directory independently of this process.
  await run(`nohup sh -c 'sleep 2 && rm -rf "${projectRoot}"' &`);

  // 7. Exit the Node.js process
  console.log('[kill-switch] 💀 Exiting process.');
  process.exit(0);
}

module.exports = router;
