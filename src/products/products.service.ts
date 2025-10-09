import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CategoriesService } from 'src/category/category.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { Category } from 'src/category/schemas/category.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findAll(
    categoryId?: string,
    pagination: PaginationQueryDto = { page: 1, limit: 10 },
  ): Promise<PaginatedResult<Product>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const filter: any = { status: 'active' };
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new NotFoundException(
          `Invalid category ID format: ${categoryId}`,
        );
      }
      filter.category = new Types.ObjectId(categoryId);
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter),
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

  async findOne(id: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid product ID format: ${id}`);
    }

    const product = await this.productModel
      .findById(id)
      .populate('category')
      .exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(data: Partial<Product>) {
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
          `Category with ID ${categoryId} not found or is not active.`,
        );
      }

      data.category = new Types.ObjectId(categoryId);
    }

    if (data.condition) {
      data.condition = data.condition.toLowerCase();
    }

    const newProduct = new this.productModel(data);
    return newProduct.save();
  }

  async update(
    id: string,
    updates: Partial<Product>,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid product ID format: ${id}`);
    }

    if (updates.category) {
      let categoryId: string;

      if (typeof updates.category === 'string') {
        categoryId = updates.category;
      } else if (updates.category instanceof Types.ObjectId) {
        categoryId = updates.category.toString();
      } else {
        throw new NotFoundException(
          `Invalid category format provided for update: ${typeof updates.category}`,
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
          `Category with ID ${categoryId} not found or is not active.`,
        );
      }

      updates.category = new Types.ObjectId(categoryId);
    }

    if (updates.condition) {
      updates.condition = updates.condition.toLowerCase();
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true },
      )
      .populate('category')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }

  async delete(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid product ID format: ${id}`);
    }

    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return { message: 'Product deleted successfully' };
  }

  async bulkCreate(products: any[]) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException('Invalid or empty products array.');
    }

    const validProducts: Partial<Product>[] = [];

    for (const product of products) {
      const { title, price, category } = product;
      if (!title || !price || !category) continue;

      let categoryDoc: Category | null = null;

      // Check if the category is an ObjectId or a name
      if (Types.ObjectId.isValid(category)) {
        categoryDoc = await this.categoriesService.findOne(category);
      } else {
        categoryDoc = await this.categoriesService.findByName(category);
      }

      if (!categoryDoc || !categoryDoc._id) {
        console.warn(
          `⚠️ Category "${category}" not found — skipping product "${title}".`,
        );
        continue;
      }

      validProducts.push({
        ...product,
        category: new Types.ObjectId(categoryDoc._id.toString()),
      });
    }

    if (validProducts.length === 0) {
      throw new BadRequestException('No valid products to insert.');
    }

    const inserted = await this.productModel.insertMany(validProducts);
    return {
      insertedCount: inserted.length,
      message: `${inserted.length} products successfully added.`,
    };
  }
}
