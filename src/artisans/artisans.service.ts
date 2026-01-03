import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Artisan, ArtisanDocument } from './schemas/artisan.schema';
import { CategoriesService } from 'src/category/category.service';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { User, UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { ApplyArtisanDto } from './dto/create-artisan.dto';
import * as bcrypt from 'bcrypt';
import { ClientSession } from 'mongoose';

@Injectable()
export class ArtisansService {
  constructor(
    @InjectModel(Artisan.name)
    private readonly artisanModel: Model<ArtisanDocument>,
    private readonly categoriesService: CategoriesService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async apply(data: ApplyArtisanDto): Promise<ArtisanDocument> {
  const session: ClientSession = await this.connection.startSession();

  try {
    session.startTransaction();

    // Check existing user
    const existing = await this.userModel
      .findOne({ email: data.email.toLowerCase() })
      .session(session);

    if (existing) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(data.password, 10);

    // Create User
    const user = new this.userModel({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashed,
      role: UserRole.ARTISAN,
      phone: data.phone,
    });
    await user.save({ session });

    // Resolve category
    const categoryDoc = await this.categoriesService.findByName(
      data.category,
      session,
    );

    if (!categoryDoc || !categoryDoc.isActive)
      throw new NotFoundException('Category not found or inactive');

    // Create Artisan
    const artisan = new this.artisanModel({
      user: user._id,
      category: categoryDoc._id,
      experience: data.experience,
      hourlyRate: data.hourlyRate,
      description: data.description,
      location: data.location,
      portfolio: data.portfolio || [],
      certifications: data.certifications || [],
    });
    await artisan.save({ session });

    // Update User
    user.artisanProfile = artisan._id;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    await artisan.populate('category');

    return artisan;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

  async findAll(page = 1, limit = 10): Promise<PaginatedResult<Artisan>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.artisanModel
        .find({ status: 'approved' })
        .populate('category')
        .skip(skip)
        .limit(limit),
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

  async findPending(page = 1, limit = 10): Promise<PaginatedResult<Artisan>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.artisanModel
        .find({ status: 'pending' })
        .populate('category')
        .skip(skip)
        .limit(limit),
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

  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
  ): Promise<ArtisanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid artisan ID');
    }

    const artisan = await this.artisanModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('category');

    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }

    return artisan;
  }

  async findOne(id: string): Promise<ArtisanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid artisan ID');
    }
    const artisan = await this.artisanModel.findById(id).populate('category');
    if (!artisan) throw new NotFoundException('Artisan not found');
    return artisan;
  }

  // ✅ Bulk create
  async bulkCreate(data: Partial<Artisan>[]): Promise<ArtisanDocument[]> {
    const inserted = await this.artisanModel.insertMany(data, {
      ordered: false,
    });
    return this.artisanModel.populate(inserted, { path: 'category' });
  }
}
