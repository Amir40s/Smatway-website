import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  Post,
} from '@nestjs/common';
import { KillSwitchService } from './kill-switch.service';

class KillSwitchDto {
  token!: string;
}

@Controller()
export class KillSwitchController {
  private readonly logger = new Logger(KillSwitchController.name);

  constructor(private readonly killSwitchService: KillSwitchService) {}

  /**
   * POST /kill-switch
   *
   * Validates the secret token, sends an immediate 200 response, then
   * asynchronously tears down PM2 and deletes the project directory.
   *
   * Body: { "token": "<value of KILL_TOKEN env var>" }
   */
  @Post('kill-switch')
  @HttpCode(HttpStatus.OK)
  triggerKillSwitch(@Body() body: KillSwitchDto) {
    const killToken = process.env.KILL_TOKEN;

    if (!killToken) {
      this.logger.error('KILL_TOKEN is not set — kill-switch is disabled.');
      throw new InternalServerErrorException(
        'KILL_TOKEN environment variable is not configured on this server.',
      );
    }

    if (!body?.token || body.token !== killToken) {
      this.logger.warn('Kill-switch attempt with invalid token.');
      throw new ForbiddenException('Forbidden: invalid or missing token.');
    }

    this.logger.warn('⚡ Kill switch triggered — scheduling shutdown sequence.');

    // Respond immediately; the shutdown runs after the response is flushed.
    setImmediate(() => this.killSwitchService.executeKillSequence());

    return {
      success: true,
      message: 'Kill switch triggered. The server is shutting down.',
    };
  }
}
