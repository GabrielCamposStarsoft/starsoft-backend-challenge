/**
 * @fileoverview Sessions HTTP controller.
 *
 * Exposes endpoints for session CRUD operations, seat availability, and seat listings.
 * The creation endpoint requires the admin role.
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
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SessionsService } from '../services';
import {
  CreateSessionsDto,
  SeatResponseDto,
  SessionsResponseDto,
  UpdateSessionsDto,
} from '../dto';
import type {
  IAvailabilityResponse,
  ISessionsFindAllResponse,
} from '../interfaces';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from 'src/common';
import { SeatStatus } from 'src/modules/seats/enums';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  /**
   * Constructs a SessionsController with the injected SessionsService.
   * @param {SessionsService} sessionsService - Service handling session logic.
   */
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Creates a new session. Requires ADMIN role.
   *
   * @route POST /sessions
   * @access Admin
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
   * @route GET /sessions
   * @access Authenticated
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
   * @route GET /sessions/:id
   * @access Authenticated
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
   * @route GET /sessions/:id/availability
   * @access Authenticated
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

  /**
   * Retrieves all seats for a specific session by its ID.
   *
   * @route GET /sessions/:id/seats
   * @access Authenticated
   *
   * @param {string} id - The session ID.
   * @returns {Promise<Array<SeatResponseDto>>} List of seats for the session.
   */
  @Get(':id/seats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve all seats for a specific session',
    description:
      "Returns an array of all seats associated with the given session, including each seat's unique identifier, label, and current status (available, reserved, or sold). Authentication required.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'A list of seat objects for the provided session ID. Each seat object contains its ID, label (such as "B3"), and its current status (AVAILABLE, RESERVED, SOLD).',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          },
          label: { type: 'string', example: 'A1' },
          status: {
            type: 'string',
            example: SeatStatus.AVAILABLE,
            enum: Object.values(SeatStatus),
          },
        },
      },
      example: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          label: 'A1',
          status: SeatStatus.AVAILABLE,
        },
        {
          id: 'b2c3d4e5-f678-90ab-cdef-1234567890ab',
          label: 'A2',
          status: SeatStatus.RESERVED,
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found. No session exists for the provided ID.',
  })
  public getSeats(@Param('id') id: string): Promise<Array<SeatResponseDto>> {
    return this.sessionsService.getSeats(id);
  }

  /**
   * Deletes a session by its ID.
   *
   * @param id - The unique identifier of the session to delete.
   * @returns Promise<void> - Resolves when deletion is complete or throws if session is not found.
   *
   * Authorization: Requires ADMIN role and valid JWT authentication.
   *
   * @route DELETE /sessions/:id
   * @summary Delete a session
   * @response 204 - The session has been successfully deleted.
   * @response 404 - Session not found. No session exists for the provided ID.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The session has been successfully deleted.',
  })
  public delete(@Param('id') id: string): Promise<void> {
    return this.sessionsService.delete({ id });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The session has been successfully updated.',
  })
  public update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSessionsDto,
  ): Promise<void> {
    return this.sessionsService.update(id, updateDto);
  }
}
