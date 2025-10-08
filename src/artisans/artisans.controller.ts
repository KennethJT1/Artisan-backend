import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ArtisansService } from './artisans.service';
import { Artisan } from './schemas/artisan.schema';

@Controller('artisans')
export class ArtisansController {
  constructor(private readonly artisansService: ArtisansService) {}

  @Post('apply')
  async apply(@Body() data: Partial<Artisan>) {
    return this.artisansService.apply(data);
  }

  @Get('pending')
  async findPending() {
    return this.artisansService.findPending();
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.artisansService.updateStatus(id, status);
  }

  @Get()
  async findAll() {
    return this.artisansService.findAll();
  }
}
