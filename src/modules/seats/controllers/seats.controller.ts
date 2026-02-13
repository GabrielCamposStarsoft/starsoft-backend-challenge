/**
 * @fileoverview Seats HTTP controller.
 *
 * Handles HTTP endpoints related to seat creation in a session.
 * Only accessible by admin users.
 *
 * @controller seats-controller
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard, UserRole } from 'src/common';
import {
  CreateSeatsDto,
  CreateSeatsBatchDto,
  SeatsResponseDto,
  UpdateSeatsDto,
} from '../dto';
import { SeatsService } from '../services';

@ApiTags('seats')
@Controller()
export class SeatsController {
  /**
   * Constructs a new `SeatsController` instance.
   * @param seatsService The service for handling seat operations.
   */
  constructor(private readonly seatsService: SeatsService) {}

  /**
   * Creates a new seat in a session.
   * Restricted to admin users.
   *
   * @param {CreateSeatsDto} createDto - Data transfer object for creating seats.
   * @returns {Promise<SeatsResponseDto>} The created seat details.
   *
   * @route POST /seats
   * @access Admin (JWT, Role-based Guard)
   * @httpCode 201
   * @swagger
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new seat' })
  @ApiBody({
    type: CreateSeatsDto,
    description: 'Session and seat label',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          label: 'A1',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The seat has been successfully created.',
    type: SeatsResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateSeatsDto,
  ): Promise<SeatsResponseDto> {
    return this.seatsService.create(createDto);
  }

  /**
   * Creates multiple seats for a session in a single request.
   * Restricted to admin users.
   *
   * @param {CreateSeatsBatchDto} dto - Data transfer object for batch seat creation.
   * @returns {Promise<SeatsResponseDto[]>} The created seats.
   *
   * @route POST /seats/batch
   * @access Admin (JWT, Role-based Guard)
   * @httpCode 201
   */
  @Post('batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create multiple seats in batch' })
  @ApiBody({
    type: CreateSeatsBatchDto,
    description: 'Session ID and array of seat labels',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          labels: ['A1', 'A2', 'A3', 'A4'],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The seats have been successfully created.',
    type: [SeatsResponseDto],
  })
  @HttpCode(HttpStatus.CREATED)
  public async createBatch(
    @Body() dto: CreateSeatsBatchDto,
  ): Promise<Array<SeatsResponseDto>> {
    return this.seatsService.createBatch(dto);
  }

  /**
   * Updates a seat's status (blocking, maintenance, or back to available).
   * Restricted to admin users. Only AVAILABLE, BLOCKED, MAINTENANCE allowed.
   *
   * @param {string} id - Seat ID.
   * @param {UpdateSeatsDto} updateDto - New status.
   * @returns {Promise<SeatsResponseDto>} The updated seat.
   *
   * @route PATCH /seats/:id
   * @access Admin
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update seat status (block/maintenance)' })
  @ApiBody({
    type: UpdateSeatsDto,
    description: 'New status: available, blocked, or maintenance',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The seat has been successfully updated.',
    type: SeatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seat not found.',
  })
  public async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSeatsDto,
  ): Promise<SeatsResponseDto> {
    return this.seatsService.update(id, updateDto);
  }
}
