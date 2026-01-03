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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RecentActivityItem, PlatformAlert } from './dto/activity.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats(@Query('timeframe') timeframe: string = '30days') {
    return this.adminService.getDashboardStats(timeframe);
  }

  @Get('bookings/recent')
  async getRecentBookings() {
    return this.adminService.getRecentBookings();
  }

  @Get('artisans/top')
  async getTopArtisans() {
    return this.adminService.getTopArtisans();
  }

  @Get('artisans/pending')
  async getPendingArtisans() {
    return this.adminService.getPendingArtisans();
  }

  @Put('artisans/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveArtisan(@Param('id') id: string) {
    return this.adminService.approveArtisan(id);
  }

  @Put('artisans/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectArtisan(@Param('id') id: string) {
    return this.adminService.rejectArtisan(id);
  }

  @Get('payments/commission-settings')
  async getCommissionSettings() {
    return this.adminService.getCommissionSettings();
  }

  @Put('payments/commission-settings')
  @HttpCode(HttpStatus.OK)
  async updateCommissionSettings(@Body() settings: any) {
    return this.adminService.updateCommissionSettings(settings);
  }

  @Get('payments/pending-payouts')
  async getPendingPayouts() {
    return this.adminService.getPendingPayouts();
  }

  @Post('payments/process-payouts')
  @HttpCode(HttpStatus.OK)
  async processPayouts() {
    return this.adminService.processPayouts();
  }

  @Get('payments/revenue-summary')
  async getRevenueSummary() {
    return this.adminService.getRevenueSummary();
  }

  @Get('analytics/popular-categories')
  async getPopularCategories() {
    return this.adminService.getPopularCategories();
  }

  @Get('settings/platform')
  async getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Put('settings/platform')
  @HttpCode(HttpStatus.OK)
  async updatePlatformSettings(@Body() settings: any) {
    return this.adminService.updatePlatformSettings(settings);
  }

  @Get('activities/recent')
  async getRecentActivity(): Promise<RecentActivityItem[]> {
    return this.adminService.getRecentActivity();
  }

  @Get('alerts')
  async getPlatformAlerts(): Promise<PlatformAlert[]> {
    return this.adminService.getPlatformAlerts();
  }
}
