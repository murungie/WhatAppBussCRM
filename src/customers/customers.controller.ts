import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';

import { CustomersService } from './customers.service';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

   // ============================================================
  // GET CUSTOMERS
  // GET /customers?page=1&limit=20&search=software
  // ============================================================

  @Get()
  findAll(
    @CurrentBusiness()
    business: { businessId: string },

    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,

    @Query('search')
    search?: string,
  ) {
    return this.customersService.findAll(
      business.businessId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search,
    );
  }

  // ============================================================
  // GET CUSTOMER BY ID
  // ============================================================

  @Get(':id')
  findOne(
    @CurrentBusiness()
    business: { businessId: string },

    @Param('id')
    id: string,
  ) {
    return this.customersService.findOne(
      business.businessId,
      id,
    );
  }

  // ============================================================
  // CUSTOMER CONVERSATION STATUS
  // ============================================================

  @Get(':id/conversation-status')
  getConversationStatus(
    @CurrentBusiness()
    business: { businessId: string },

    @Param('id')
    id: string,
  ) {
    return this.customersService.getConversationStatus(
      business.businessId,
      id,
    );
  }

  // ============================================================
  // CREATE CUSTOMER
  // ============================================================

  @Post()
  create(
    @CurrentBusiness()
    business: { businessId: string },

    @Body()
    dto: UpsertCustomerDto,
  ) {
    return this.customersService.findOrCreate(
      business.businessId,
      dto,
    );
  }
}