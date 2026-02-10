import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SalesService } from '../services';
import { CreateSalesDto, SalesResponseDto } from '../dto';

@ApiTags('sales')
@Controller()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The sales has been successfully created.',
    type: SalesResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateSalesDto,
  ): Promise<SalesResponseDto> {
    return this.salesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all saless.',
    type: [SalesResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<{
    data: SalesResponseDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.salesService.findAll({ page, limit, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sales by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the sales.',
    type: SalesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sales not found.',
  })
  public async findOne(@Param('id') id: string): Promise<SalesResponseDto> {
    return this.salesService.findOne(id);
  }
}
