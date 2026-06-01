import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Req() req: Request, @Body() dto: CreateOrderDto) {
    return this.ordersService.create((req as any).user.id, dto);
  }

  @Get(':orderId')
  async getOrder(@Req() req: Request, @Param('orderId') orderId: string) {
    return this.ordersService.findById((req as any).user.id, orderId);
  }

  @Get()
  async getOrders(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.ordersService.findAllPaginated((req as any).user.id, parseInt(page, 10), parseInt(limit, 10));
  }

  // Admin: view all orders
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  async getAllOrders(
    @Req() req: Request,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    // Check if user is admin
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      throw new Error('Unauthorized: Admin access only');
    }
    return this.ordersService.findAllOrdersAdmin(parseInt(page, 10), parseInt(limit, 10));
  }
}
