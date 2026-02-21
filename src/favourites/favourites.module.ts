import { Module } from '@nestjs/common';
import { FavouritesService } from './favourites.service';
import { FavouritesController } from './favourites.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Favourite, FavouriteSchema } from './schemas/favourite.schema';
import { Artisan, ArtisanSchema } from 'src/artisans/schemas/artisan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favourite.name, schema: FavouriteSchema },
      { name: Artisan.name, schema: ArtisanSchema },
    ]),
  ],
  controllers: [FavouritesController],
  providers: [FavouritesService],
  exports: [FavouritesService,MongooseModule],
})
export class FavouritesModule {}
