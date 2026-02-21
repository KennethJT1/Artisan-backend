import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { User, UserRole } from './schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaymentsService } from 'src/payments/payments.service';
import { AddPaymentMethodDto } from 'src/payments/dto/add-payment-method.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Req() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    return this.usersService.findAll(pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('me')
  async getMyProfile(@GetUser() user: any) {
    return this.usersService.findOneByEmail(user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment-methods')
  async getMyPaymentMethods(@Req() req) {
    return this.usersService.getPaymentMethods(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment-history')
  async getMyPaymentHistory(@Req() req) {
    return this.paymentsService.getPaymentHistoryByCustomer(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-methods')
  async addPaymentMethod(@Req() req, @Body() dto: AddPaymentMethodDto) {
    return this.usersService.addPaymentMethod(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('payment-methods/:methodId/default')
  async setDefaultPaymentMethod(
    @Req() req,
    @Param('methodId') methodId: string,
  ) {
    return this.usersService.setDefaultPaymentMethod(req.user.id, methodId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('payment-methods/:methodId')
  async removePaymentMethod(@Req() req, @Param('methodId') methodId: string) {
    return this.usersService.removePaymentMethod(req.user.id, methodId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.resetPassword(token, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/stats')
  async getDashboardStats(@Req() req) {
    return this.usersService.getCustomerDashboardStats(req.user.id);
  }
}
