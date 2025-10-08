import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artisan } from './schemas/artisan.schema';

@Injectable()
export class ArtisansService {
  constructor(@InjectModel(Artisan.name) private artisanModel: Model<Artisan>) {}

  async apply(data: Partial<Artisan>) {
    return this.artisanModel.create(data);
  }

  async findAll() {
    return this.artisanModel.find({ status: 'approved' });
  }

  async findPending() {
    return this.artisanModel.find({ status: 'pending' });
  }

  async updateStatus(id: string, status: string) {
    return this.artisanModel.findByIdAndUpdate(id, { status }, { new: true });
  }
}
