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

  // 🟢 Apply for artisan — no user required
  async apply(data: Partial<Artisan>): Promise<ArtisanDocument> {
    // ✅ Validate category if provided
    if (data.category) {
      let categoryId: string;

      if (typeof data.category === 'string') {
        categoryId = data.category;
      } else if (data.category instanceof Types.ObjectId) {
        categoryId = data.category.toString();
      } else {
        throw new NotFoundException(
          `Invalid category format provided: ${typeof data.category}`,
        );
      }

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

    // ✅ No user ID required
    const createdArtisan = new this.artisanModel(data);
    return createdArtisan.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
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

  // 🟢 Get pending artisans (for admin review)
  async findPending(
    page: number = 1,
    limit: number = 10,
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

  // 🟢 Update artisan status (admin only)
  async updateStatus(id: string, status: string): Promise<ArtisanDocument> {
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

  // 🟢 Update artisan profile (for future “edit profile” feature)
  async update(
    id: string,
    updates: Partial<Artisan> & { $push?: any; $pull?: any },
  ): Promise<ArtisanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid artisan ID format: ${id}`);
    }

    const updateOperations: any = { ...updates };
    if (updateOperations.$push || updateOperations.$pull) {
      delete updateOperations.portfolio;
      delete updateOperations.certifications;
    }

    const updatedArtisan = await this.artisanModel
      .findByIdAndUpdate(id, updateOperations, {
        new: true,
        runValidators: true,
      })
      .populate('category')
      .exec();

    if (!updatedArtisan) {
      throw new NotFoundException(`Artisan with ID ${id} not found`);
    }

    return updatedArtisan;
  }

  // 🟢 Find artisan by ID
  async findOne(id: string): Promise<ArtisanDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid artisan ID format: ${id}`);
    }
    return this.artisanModel.findById(id).populate('category').exec();
  }

  // NEW: Bulk create method
  async bulkCreate(
    artisansData: Partial<Artisan>[],
  ): Promise<ArtisanDocument[]> {
    for (const artisanDatum of artisansData) {
      if (artisanDatum.category) {
        let categoryId: string;

        if (typeof artisanDatum.category === 'string') {
          categoryId = artisanDatum.category;
        } else if (artisanDatum.category instanceof Types.ObjectId) {
          categoryId = artisanDatum.category.toString();
        } else {
          throw new NotFoundException(
            `Invalid category format provided for artisan ${artisanDatum.firstName} ${artisanDatum.lastName}: ${typeof artisanDatum.category}`,
          );
        }

        if (!Types.ObjectId.isValid(categoryId)) {
          throw new NotFoundException(
            `Invalid category ID format for artisan ${artisanDatum.firstName} ${artisanDatum.lastName}: ${categoryId}`,
          );
        }

        const categoryExists = await this.categoriesService.findOne(categoryId);
        if (!categoryExists || !categoryExists.isActive) {
          throw new NotFoundException(
            `Category with ID ${categoryId} for artisan ${artisanDatum.firstName} ${artisanDatum.lastName} not found or inactive.`,
          );
        }

        artisanDatum.category = new Types.ObjectId(categoryId);
      }
    }

    try {
      const result = await this.artisanModel.insertMany(artisansData, {
        ordered: false,
      });
      return result;
    } catch (error) {
      console.error('Bulk create error:', error.message);
      throw error;
    }
  }
}
