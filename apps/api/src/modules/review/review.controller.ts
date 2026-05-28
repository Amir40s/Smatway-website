import { Body, Controller, ForbiddenException, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

class CreateReviewDto {
  bookingId!: string;
  rating!: number;
  feedback?: string;
}

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewService.createReview(dto.bookingId, user.id, dto.rating, dto.feedback);
  }

  @Get('transporter/:transporterId/stats')
  getStats(@Param('transporterId') transporterId: string) {
    return this.reviewService.getTransporterStats(transporterId);
  }

  @Get('transporter/:transporterId/reviews')
  @UseGuards(JwtAuthGuard)
  getReviews(
    @CurrentUser() user: User,
    @Param('transporterId') transporterId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can read feedbacks');
    }
    return this.reviewService.getTransporterReviews(transporterId, parseInt(page), parseInt(limit));
  }

  @Get('transporter/:transporterId/profile')
  @UseGuards(JwtAuthGuard)
  getFullProfile(@CurrentUser() user: User, @Param('transporterId') transporterId: string) {
    return this.reviewService.getTransporterFullProfile(transporterId, user);
  }

  /** Public — latest platform-wide reviews for the marketing homepage Testimonials section. */
  @Get('recent')
  @UseGuards(JwtAuthGuard)
  getRecent(@CurrentUser() user: User, @Query('limit') limit: string = '6') {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admin can read feedbacks');
    }
    return this.reviewService.getRecentPlatformReviews(parseInt(limit, 10) || 6);
  }
}
