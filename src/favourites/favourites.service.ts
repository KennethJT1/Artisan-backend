import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artisan, ArtisanDocument } from 'src/artisans/schemas/artisan.schema';
import { Favourite, FavouritesDocument } from './schemas/favourite.schema';

@Injectable()
export class FavouritesService {
  constructor(
    @InjectModel(Favourite.name)
    private readonly favouriteModel: Model<FavouritesDocument>,
    @InjectModel(Artisan.name)
    private readonly artisanModel: Model<ArtisanDocument>, // adjust
  ) {}
    async toggle(customerId: string, artisanId: string) {
      const existing = await this.favouriteModel.findOne({
        customer: customerId,
        artisan: artisanId,
      });

      if (existing) {
        await this.favouriteModel.deleteOne({ _id: existing._id });
        return { message: 'Removed from favorites', favorited: false };
      } else {
        await this.favouriteModel.create({
          customer: customerId,
          artisan: artisanId,
        });
        return { message: 'Added to favorites', favorited: true };
      }
    }

    async findMyFavorites(customerId: string) {
      const favorites = await this.favouriteModel
        .find({ customer: customerId })
        .populate(
          'artisan',
          'firstName lastName category rating completedJobs hourlyRate',
        )
        .exec();

      return favorites.map((f) => f.artisan);
    }
}
