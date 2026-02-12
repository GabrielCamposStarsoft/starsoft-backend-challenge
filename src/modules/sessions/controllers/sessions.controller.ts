/**
 * @fileoverview Sessions HTTP controller.
 *
 * Exposes session CRUD and seat availability. Create requires admin role.
 *
 * @controller sessions-controller
 */

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
  ApiBody,
} from '@nestjs/swagger';
import { SessionsService } from '../services';
import { CreateSessionsDto, SessionsResponseDto } from '../dto';
import type {
  IAvailabilityResponse,
  ISessionsFindAllResponse,
} from '../interfaces';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from 'src/common';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  /**
   * Constructs the SessionsController.
   * @param sessionsService Service handling session logic
   */
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Creates a new session. Requires ADMIN role.
   *
   * @param {CreateSessionsDto} createDto - The DTO containing session creation data.
   * @returns {Promise<SessionsResponseDto>} The created session.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiBody({
    type: CreateSessionsDto,
    description: 'Session data (movie, room, schedule, price)',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          movieTitle: 'Interstellar',
          roomName: 'Sala 1',
          startTime: '2026-03-15T19:00:00.000Z',
          endTime: '2026-03-15T21:30:00.000Z',
          ticketPrice: 25.0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The session has been successfully created.',
    type: SessionsResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() createDto: CreateSessionsDto,
  ): Promise<SessionsResponseDto> {
    return this.sessionsService.create(createDto);
  }

  /**
   * Retrieves all sessions, paginated.
   *
   * @param {number} [page=1] - The page number.
   * @param {number} [limit=10] - The number of results per page.
   * @returns {Promise<ISessionsFindAllResponse>} List of sessions and pagination info.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all sessions.',
    type: [SessionsResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ISessionsFindAllResponse> {
    return this.sessionsService.findAll({ page, limit });
  }

  /**
   * Retrieves a single session by its unique identifier.
   *
   * @param {string} id - The ID of the session.
   * @returns {Promise<SessionsResponseDto>} The session, if found.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a session by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the session.',
    type: SessionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found.',
  })
  public async findOne(@Param('id') id: string): Promise<SessionsResponseDto> {
    return this.sessionsService.findOne(id);
  }

  /**
   * Gets the seat availability for a specific session by ID.
   *
   * @param {string} id - The ID of the session.
   * @returns {Promise<IAvailabilityResponse>} Seat availability information.
   */
  @Get(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get seat availability for a session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns available seats for the session.',
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          format: 'uuid',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        totalSeats: { type: 'number', example: 50 },
        availableSeats: { type: 'number', example: 45 },
        seats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              label: { type: 'string', example: 'A1' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found.',
  })
  public async getAvailability(
    @Param('id') id: string,
  ): Promise<IAvailabilityResponse> {
    return await this.sessionsService.getAvailability(id);
  }
}
