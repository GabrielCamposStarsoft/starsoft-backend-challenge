/**
 * @fileoverview Sales HTTP controller.
 *
 * Exposes create (payment confirm), findAll, findOne. Idempotent create.
 * User-scoped; userId from JWT.
 *
 * @controller sales-controller
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type IRequestUser,
  IdempotencyInterceptor,
  JwtAuthGuard,
  RolesGuard,
} from 'src/common';
import { CreateSalesDto, SalesResponseDto } from '../dto';
import { SalesService } from '../services';

/**
 * Controller for managing sales operations.
 * Handles creation, retrieval, and pagination of sales records.
 *
 * @class SalesController
 * @controller('sales')
 * @apiBearerAuth()
 * @useGuards(JwtAuthGuard, RolesGuard)
 */
@ApiTags('sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SalesController {
  /**
   * Constructs the SalesController.
   * @param salesService Service used for sales operations.
   */
  constructor(private readonly salesService: SalesService) {}

  /**
   * Confirms payment for a reservation, creating a new sale.
   *
   * @param {CreateSalesDto} createDto - The DTO with sale creation data.
   * @param {IRequestUser} user - The currently authenticated user.
   * @returns {Promise<SalesResponseDto>} The created sale.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Confirm payment for a reservation' })
  @ApiBody({
    type: CreateSalesDto,
    description: 'Reservation UUID to confirm payment',
    examples: {
      default: {
        summary: 'Request example',
        value: { reservationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
      },
    },
  })
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

  /**
   * Gets all sales for the authenticated user (purchase history) with pagination.
   *
   * @param {number} [page=1] - The page number.
   * @param {number} [limit=10] - Number of items per page.
   * @param {IRequestUser} user - The currently authenticated user.
   * @returns {Promise<{ data: SalesResponseDto[]; meta: { page: number; limit: number; total: number; totalPages: number } }>}
   *   A paginated list of sales and meta information.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    data: Array<SalesResponseDto>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.salesService.findAll({ page, limit, userId: user.id });
  }

  /**
   * Retrieves a sale by its unique identifier.
   *
   * @param {string} id - The unique UUID of the sale.
   * @returns {Promise<SalesResponseDto>} The requested sale or throws if not found.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
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
  public async findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ): Promise<SalesResponseDto> {
    return this.salesService.findOne(id, user.id);
  }
}
