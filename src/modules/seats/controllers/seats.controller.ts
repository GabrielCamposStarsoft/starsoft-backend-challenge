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
import { CreateSeatsDto, SeatsResponseDto } from '../dto';
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
}
