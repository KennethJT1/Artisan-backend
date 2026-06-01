import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { CreateOrderDto, OrderCartItemDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Ensure each item has a currency field (from totals.currency if missing)
    const itemsWithCurrency: OrderCartItemDto[] = (dto.items || []).map((item: OrderCartItemDto) => {
      return {
        ...item,
        currency:
          (typeof item.currency === 'string' && item.currency) ||
          (dto.totals && typeof dto.totals.currency === 'string' && dto.totals.currency) ||
          'USD',
      };
    });

    // Calculate subtotal
    const subtotal = itemsWithCurrency.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    // Set tax and shipping to 0 for now
    const tax = 0;
    const shipping = 0;
    const grandTotal = subtotal + tax + shipping;

    const totals = {
      subtotal,
      discount: 0,
      tax,
      shipping,
      grandTotal,
      currency: dto.totals?.currency || 'USD',
    };

    const order = new this.orderModel({
      userId,
      contactInfo: dto.contactInfo,
      shippingAddress: dto.shippingAddress,
      items: itemsWithCurrency,
      totals,
      paymentMethod: dto.paymentMethod,
      status: 'pending',
    });
    await order.save();
    return { orderId: order._id, status: order.status };
  }

  async findById(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, userId });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAllPaginated(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments({ userId }),
    ]);
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: orders,
    };
  }

  async findAllOrdersAdmin(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments({}),
    ]);
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: orders,
    };
  }
}
