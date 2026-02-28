import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query() query?: Record<string, string>,
    @Query() pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.findAll(category, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() data: Partial<Product>, @Req() req): Promise<Product> {
    return this.productsService.create(data, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any, @Req() req) {
    return this.productsService.update(id, data, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.productsService.delete(id, req.user.id);
  }

  @Post('bulk')
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN)
  async bulkCreate(@Body() products: any[]) {
    return this.productsService.bulkCreate(products);
  }
}
