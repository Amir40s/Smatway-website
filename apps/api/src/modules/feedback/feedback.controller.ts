import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { RateJourneyDto } from './dto/rate-journey.dto';

class CreateSiteFeedbackDto {
  rating!: number;
  comment!: string;
}

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateSiteFeedbackDto) {
    return this.feedbackService.create(user.id, dto.rating, dto.comment);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: User) {
    return this.feedbackService.listMine(user.id);
  }

  @Post('journey')
  @UseGuards(JwtAuthGuard)
  rateJourney(@CurrentUser() user: User, @Body() dto: RateJourneyDto) {
    return this.feedbackService.rateJourney(user.id, dto);
  }

  /** Public — site feedback for the marketing homepage Testimonials rotator. */
  @Get('recent')
  getRecent(@Query('limit') limit: string = '6') {
    return this.feedbackService.getRecent(parseInt(limit, 10) || 6);
  }

  /** Public — aggregate site feedback stats for the homepage Feedback section. */
  @Get('stats')
  getStats() {
    return this.feedbackService.getStats();
  }
}
