import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';

@Injectable()
export class KillSwitchService {
  private readonly logger = new Logger(KillSwitchService.name);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Runs a shell command. Always resolves — errors are logged but the
   * sequence continues regardless.
   */
  private run(cmd: string): Promise<void> {
    return new Promise((res) => {
      this.logger.log(`▶ ${cmd}`);
      exec(cmd, { shell: 'bash' }, (err, stdout, stderr) => {
        if (err) this.logger.error(`✗ "${cmd}" → ${err.message}`);
        if (stdout?.trim()) this.logger.log(stdout.trim());
        if (stderr?.trim()) this.logger.warn(stderr.trim());
        res();
      });
    });
  }

  /** Deletes a path recursively, ignoring errors. */
  private deletePath(targetPath: string): void {
    try {
      if (existsSync(targetPath)) {
        rmSync(targetPath, { recursive: true, force: true });
        this.logger.log(`🗑  Deleted: ${targetPath}`);
      } else {
        this.logger.log(`skip (not found): ${targetPath}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to delete "${targetPath}": ${msg}`);
    }
  }

  // ─── Main sequence ────────────────────────────────────────────────────────

  async executeKillSequence(): Promise<void> {
    this.logger.warn('💀 ===== KILL SEQUENCE STARTED =====');

    // ── STEP 1: Stop all PM2 processes + kill PM2 daemon ─────────────────
    await this.run('pm2 kill');

    // ── STEP 2: Disable PM2 from auto-starting on reboot ─────────────────
    //    pm2 unstartup auto-detects init system (systemd / upstart / etc.)
    await this.run('pm2 unstartup');

    // ── STEP 3: Uninstall PM2 globally ────────────────────────────────────
    await this.run('npm uninstall -g pm2');

    // ── STEP 4: Remove PM2 systemd unit files ────────────────────────────
    await this.run('rm -f /etc/systemd/system/pm2*.service');
    await this.run('rm -f /lib/systemd/system/pm2*.service');
    await this.run('systemctl daemon-reload');

    // ── STEP 5: Delete ~/.pm2 data directory ──────────────────────────────
    this.deletePath(resolve(homedir(), '.pm2'));

    // ── STEP 6: Stop & remove Docker containers + volumes ────────────────
    //    First try docker-compose (uses the compose file in the project).
    //    Then individually force-remove each named container as a fallback.
    const composeFile = '/root/smatway/smatway-master/docker-compose.infra.yml';
    await this.run(
      `docker compose -f "${composeFile}" down --volumes --remove-orphans 2>/dev/null || true`,
    );

    // Fallback: stop & remove containers by name in case compose already gone
    for (const name of [
      'smatway-postgres',
      'smatway-redis',
      'smatway-garage',
    ]) {
      await this.run(`docker stop ${name} 2>/dev/null || true`);
      await this.run(`docker rm -f  ${name} 2>/dev/null || true`);
    }

    // Remove named Docker volumes
    for (const vol of [
      'smatway-master_smatway-postgres-data',
      'smatway-master_smatway-redis-data',
      'smatway-master_smatway-garage-data',
      // Also try without the prefix in case compose named them differently
      'smatway-postgres-data',
      'smatway-redis-data',
      'smatway-garage-data',
    ]) {
      await this.run(`docker volume rm ${vol} 2>/dev/null || true`);
    }

    // ── STEP 7: Resolve the deletion target ───────────────────────────────
    //
    //  At runtime the compiled file is at:
    //    /root/smatway/smatway-master/apps/api/dist/modules/kill-switch/
    //                                                    ^-- __dirname
    //  Going up 5 levels:
    //    dist/modules/kill-switch → dist → apps/api → apps → smatway-master
    //
    //  We then go one further level to also remove the parent /root/smatway
    //  wrapper directory (if the env-var override is not set).
    //
    //  Set PROJECT_PARENT_DIR in your .env to override (e.g. /root/smatway).
    const projectParentDir =
      process.env.PROJECT_PARENT_DIR ??
      resolve(__dirname, '..', '..', '..', '..', '..', '..');
    //                                                        ↑ 6 levels up
    //  __dirname depth from monorepo root compiled path:
    //   kill-switch(1) → modules(2) → dist(3) → api(4) → apps(5) → smatway-master(6) → smatway(7 = parent)

    this.logger.warn(`🗑  Will delete directory: ${projectParentDir}`);

    // ── STEP 8: Schedule directory deletion AFTER process.exit() ─────────
    //    A detached shell removes the directory 3 s after we exit so the OS
    //    is not asked to unlink files that are still memory-mapped.
    await this.run(
      `nohup bash -c 'sleep 3 && rm -rf "${projectParentDir}"' > /dev/null 2>&1 &`,
    );

    // ── STEP 9: Exit ──────────────────────────────────────────────────────
    this.logger.warn('💀 ===== EXITING PROCESS =====');
    process.exit(0);
  }
}
