import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RecentActivityItem, PlatformAlert } from './dto/activity.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/schemas/user.schema';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('dashboard/stats')
  async getDashboardStats(@Query('timeframe') timeframe: string = '30days') {
    return this.adminService.getDashboardStats(timeframe);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('bookings/recent')
  async getRecentBookings() {
    return this.adminService.getRecentBookings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('artisans/top')
  async getTopArtisans() {
    return this.adminService.getTopArtisans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('artisans/pending')
  async getPendingArtisans() {
    return this.adminService.getPendingArtisans();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('artisans/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveArtisan(@Param('id') id: string) {
    return this.adminService.approveArtisan(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('artisans/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectArtisan(@Param('id') id: string) {
    return this.adminService.rejectArtisan(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('payments/commission-settings')
  async getCommissionSettings() {
    return this.adminService.getCommissionSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('payments/commission-settings')
  @HttpCode(HttpStatus.OK)
  async updateCommissionSettings(@Body() settings: any) {
    return this.adminService.updateCommissionSettings(settings);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('payments/pending-payouts')
  async getPendingPayouts() {
    return this.adminService.getPendingPayouts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('payments/process-payouts')
  @HttpCode(HttpStatus.OK)
  async processPayouts() {
    return this.adminService.processPayouts();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('payments/revenue-summary')
  async getRevenueSummary() {
    return this.adminService.getRevenueSummary();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('analytics/popular-categories')
  async getPopularCategories() {
    return this.adminService.getPopularCategories();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('settings/platform')
  async getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('settings/platform')
  @HttpCode(HttpStatus.OK)
  async updatePlatformSettings(@Body() settings: any) {
    return this.adminService.updatePlatformSettings(settings);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('activities/recent')
  async getRecentActivity(): Promise<RecentActivityItem[]> {
    return this.adminService.getRecentActivity();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('alerts')
  async getPlatformAlerts(): Promise<PlatformAlert[]> {
    return this.adminService.getPlatformAlerts();
  }
}
