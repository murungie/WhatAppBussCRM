import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@CurrentBusiness() business: { businessId: string }) {
    return this.ordersService.findAll(business.businessId);
  }

  @Post()
  create(
    @CurrentBusiness() business: { businessId: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(business.businessId, dto);
  }

  @Patch(':id/mark-paid')
  markPaid(
    @CurrentBusiness() business: { businessId: string },
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
  ) {
    return this.ordersService.markPaid(business.businessId, id, dto);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentBusiness() business: { businessId: string },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancel(business.businessId, id);
  }
}
