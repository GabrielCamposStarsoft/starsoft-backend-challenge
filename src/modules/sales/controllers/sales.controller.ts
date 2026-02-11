import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from '../services';
import { CreateSalesDto, SalesResponseDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { IRequestUser } from '../../auth/interfaces/jwt-payload.interface';

@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Confirm payment for a reservation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The sale has been successfully created.',
    type: SalesResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateSalesDto,
    @CurrentUser() user: IRequestUser,
  ): Promise<SalesResponseDto> {
    return this.salesService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get purchase history for the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all sales for the authenticated user.',
    type: [SalesResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @CurrentUser() user: IRequestUser,
  ): Promise<{
    data: SalesResponseDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.salesService.findAll({ page, limit, userId: user.id });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the sale.',
    type: SalesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sale not found.',
  })
  public async findOne(@Param('id') id: string): Promise<SalesResponseDto> {
    return this.salesService.findOne(id);
  }
}
