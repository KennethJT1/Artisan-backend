import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { Payment } from './schemas/payment.schema';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Body() data: Partial<Payment>) {
    return this.paymentsService.create(data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
