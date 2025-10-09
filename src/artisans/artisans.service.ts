import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Artisan, ArtisanDocument } from './schemas/artisan.schema';
import { CategoriesService } from 'src/category/category.service';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Injectable()
export class ArtisansService {
  constructor(
    @InjectModel(Artisan.name)
    private readonly artisanModel: Model<ArtisanDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async apply(data: Partial<Artisan>) {
    if (data.category) {
      let categoryId: string;

      if (typeof data.category === 'string') categoryId = data.category;
      else if (data.category instanceof Types.ObjectId)
        categoryId = data.category.toString();
      else
        throw new NotFoundException(
          `Invalid category format provided: ${typeof data.category}`,
        );

      if (!Types.ObjectId.isValid(categoryId)) {
        throw new NotFoundException(
          `Invalid category ID format: ${categoryId}`,
        );
      }

      const categoryExists = await this.categoriesService.findOne(categoryId);
      if (!categoryExists || !categoryExists.isActive) {
        throw new NotFoundException(
          `Category with ID ${categoryId} not found or inactive.`,
        );
      }

      data.category = new Types.ObjectId(categoryId);
    }

    return this.artisanModel.create(data);
  }

  // ✅ Paginated "findAll" for approved artisans
async findAll(
  page = 1,
  limit = 10,
): Promise<PaginatedResult<Artisan>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.artisanModel
      .find({ status: 'approved' })
      .populate('category')
      .skip(skip)
      .limit(limit)
      .exec(),
    this.artisanModel.countDocuments({ status: 'approved' }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async findPending(
  page = 1,
  limit = 10,
): Promise<PaginatedResult<Artisan>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.artisanModel
      .find({ status: 'pending' })
      .populate('category')
      .skip(skip)
      .limit(limit)
      .exec(),
    this.artisanModel.countDocuments({ status: 'pending' }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}


  async updateStatus(id: string, status: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid artisan ID format: ${id}`);
    }

    const artisan = await this.artisanModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('category')
      .exec();

    if (!artisan) {
      throw new NotFoundException(`Artisan with ID ${id} not found`);
    }

    return artisan;
  }
}
