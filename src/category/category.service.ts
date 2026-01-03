import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name } = createCategoryDto;

    const existing = await this.categoryModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      throw new BadRequestException(`Category '${name}' already exists`);
    }

    const createdCategory = new this.categoryModel(createCategoryDto);
    return createdCategory.save();
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<Category>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.categoryModel
        .find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.categoryModel.countDocuments({ isActive: true }).exec(),
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

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const { name } = updateCategoryDto;

    if (name) {
      const existing = await this.categoryModel.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id },
      });
      if (existing) {
        throw new BadRequestException(`Category '${name}' already exists`);
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return { message: `Category '${deleted.name}' deleted successfully` };
  }

  // async findByName(name: string): Promise<Category | null> {
  //   return this.categoryModel
  //     .findOne({ name: new RegExp(`^${name}$`, 'i') })
  //     .exec();
  // }

  async findByName(name: string, session?: ClientSession) {
    return this.categoryModel.findOne({ name }).session(session ?? null);
  }
}
