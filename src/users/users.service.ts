import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { sendEmail } from '../utils/email';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashed = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashed,
    });
    return createdUser.save();
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel.find().select('-password').skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).select('-password').exec();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // 🧠 Forgot password: generate token
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user)
      throw new NotFoundException('User with this email does not exist');

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // 📌 Build reset link for frontend
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // 📧 Send email using SMTP
    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `
      <p>You requested to reset your password.</p>
      <p>Click the link below to choose a new password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
    `,
    });

    return {
      message: 'Password reset email sent',
      devToken: resetToken, // remove in production
    };
  }

  // ✅ Reset password using the token
  async resetPassword(token: string, newPassword: string) {
  const user = await this.userModel.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) throw new BadRequestException('Invalid or expired token');

  user.password = await bcrypt.hash(newPassword, 10); // <-- ERROR occurs here
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;

  await user.save();

  return { message: 'Password reset successful' };
}

}
