import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('summary')
  async getAnalyticsSummary(
    @Query('months') months: number = 12,
    @Query('limit') limit: number = 5,
  ) {
    return this.analyticsService.getAnalyticsSummary(months, limit);
  }
}
