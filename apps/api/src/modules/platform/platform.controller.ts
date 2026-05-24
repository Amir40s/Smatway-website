import { Controller, Get, Query } from '@nestjs/common';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /** Public — used by the auth pages and (future) marketing site. */
  @Get('overview')
  getOverview(@Query('reviewLimit') reviewLimit?: string) {
    const limit = reviewLimit ? parseInt(reviewLimit, 10) : 4;
    return this.platformService.getOverview(Number.isFinite(limit) ? limit : 4);
  }

  /** Public — top routes by booking count for the marketing homepage bento. */
  @Get('popular-routes')
  getPopularRoutes(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 4;
    return this.platformService.getPopularRoutes(Number.isFinite(n) ? n : 4);
  }
}
