import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query() pagination?: PaginationQueryDto,
  ): Promise<PaginatedResult<Product>> {
    return this.productsService.findAll(category, pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product | null> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Product>): Promise<Product> {
    return this.productsService.create(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<Product>,
  ): Promise<Product> {
    return this.productsService.update(id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Post('bulk')
  // @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN)
  async bulkCreate(@Body() products: any[]) {
    return this.productsService.bulkCreate(products);
  }
}
