import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FavouritesService } from './favourites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavouritesController {
  constructor(private readonly favoritesService: FavouritesService) {}

  @Post(':artisanId')
  toggle(@Req() req, @Param('artisanId') artisanId: string) {
    return this.favoritesService.toggle(req.user.id, artisanId);
  }

  @Get()
  findMyFavorites(@Req() req) {
    return this.favoritesService.findMyFavorites(req.user.id);
  }
}
