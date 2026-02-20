/**
 * @fileoverview Sessions HTTP controller.
 *
 * Exposes endpoints for session CRUD operations, seat availability, and seat listings.
 * The creation and modification endpoints require the admin role.
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
  ApiParam,
  ApiQuery,
  getSchemaPath,
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

@ApiTags('Sessions')
@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * Creates a new session.
   * Only admins may access this endpoint.
   *
   * @param {CreateSessionsDto} createDto - Session creation payload
   * @returns {Promise<SessionsResponseDto>} Details of the created session
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new cinema session',
    description:
      'Creates a new session for a movie in a specific room, at the specified time, with the given ticket price. Only users with ADMIN role can access this endpoint.',
  })
  @ApiBody({
    type: CreateSessionsDto,
    required: true,
    description:
      'Payload detailing the session to be created. Requires movie title, room name, session start/end times, and ticket price.',
    examples: {
      default: {
        summary: 'Create a new session example',
        value: {
          movieTitle: 'Interstellar',
          roomName: 'Room 1',
          startTime: '2026-03-15T19:00:00.000Z',
          endTime: '2026-03-15T21:30:00.000Z',
          ticketPrice: 25.0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Session successfully created. Returns the created session details.',
    type: SessionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have ADMIN privileges.',
  })
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() createDto: CreateSessionsDto,
  ): Promise<SessionsResponseDto> {
    return this.sessionsService.create(createDto);
  }

  /**
   * Returns a paginated list of all sessions.
   * Authentication required.
   *
   * @param {number} [page=1] - Page number for pagination
   * @param {number} [limit=10] - Items per page
   * @returns {Promise<ISessionsFindAllResponse>} Paginated session list
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated list of all cinema sessions',
    description: `Returns an array of session objects, each containing movie, room, schedule, and price information. Pagination is supported via the page and limit query parameters.`,
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of sessions per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Paginated list of all sessions. Includes pagination information (total count, current page, page size, etc.).',
    schema: {
      type: 'object',
      properties: {
        sessions: {
          type: 'array',
          items: { $ref: getSchemaPath(SessionsResponseDto) },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        pageCount: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ISessionsFindAllResponse> {
    return this.sessionsService.findAll({ page, limit });
  }

  /**
   * Returns details of a single session by its ID.
   * Authentication required.
   *
   * @param {string} id - Session UUID
   * @returns {Promise<SessionsResponseDto>} Session details
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get session details by ID',
    description: 'Returns all session info for a given session ID.',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'UUID of the session',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session found. Returns the session details.',
    type: SessionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found for the provided UUID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  public async findOne(@Param('id') id: string): Promise<SessionsResponseDto> {
    return this.sessionsService.findOne(id);
  }

  /**
   * Returns detailed seat availability for a session by ID.
   * Includes total number of seats, number of available seats, and array of available seat objects.
   * Authentication required.
   *
   * @param {string} id - Session UUID
   * @returns {Promise<IAvailabilityResponse>} Availability of seats for session
   */
  @Get(':id/availability')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get seat availability for a session',
    description:
      'Returns seat availability for a given cinema session. The response includes sessionId, totalSeats, availableSeats count, and an array of available seat objects (IDs and labels).',
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'UUID of the session',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns availability info and available seats for the given session.',
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
              id: {
                type: 'string',
                format: 'uuid',
                example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567891',
              },
              label: { type: 'string', example: 'A1' },
            },
          },
        },
      },
      example: {
        sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        totalSeats: 50,
        availableSeats: 45,
        seats: [
          { id: 'f1e2d3c4-b5a6-7890-abcd-ef1234567891', label: 'A1' },
          { id: 'f1e2d3c4-b5a6-7890-abcd-ef1234567892', label: 'A2' },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found for the provided UUID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  public async getAvailability(
    @Param('id') id: string,
  ): Promise<IAvailabilityResponse> {
    return await this.sessionsService.getAvailability(id);
  }

  /**
   * Returns all seats (with status) for a session with given ID.
   * Each seat object contains unique ID, label, and its current status (AVAILABLE, RESERVED, or SOLD).
   * Authentication required.
   *
   * @param {string} id - Session UUID
   * @returns {Promise<Array<SeatResponseDto>>} Array of seat objects for the session
   */
  @Get(':id/seats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get all seats for a session (with statuses)',
    description:
      "Returns an array of all seats associated with the specified session, including seat's unique identifier, label (e.g. 'B3'), and current status (AVAILABLE, RESERVED, or SOLD). Requires authentication.",
  })
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: 'UUID of the session',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "List of all seat objects for the provided session ID. Each object contains the seat's UUID, its label, and the seat status (AVAILABLE/RESERVED/SOLD).",
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
            description: 'Seat status: AVAILABLE, RESERVED, or SOLD',
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
    description: 'Session not found for the provided UUID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  public getSeats(@Param('id') id: string): Promise<Array<SeatResponseDto>> {
    return this.sessionsService.getSeats(id);
  }

  /**
   * Deletes a session by its ID.
   * Only admins may access this endpoint.
   *
   * @param {string} id - Session UUID to delete
   * @returns {Promise<void>} No content
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a cinema session (Admin only)',
    description:
      'Deletes the session for the specified ID. Requires valid JWT token and ADMIN role. Responds with 204 on success.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the session to delete',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Session has been successfully deleted. No content returned.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found for the provided UUID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have ADMIN privileges.',
  })
  public delete(@Param('id') id: string): Promise<void> {
    return this.sessionsService.delete({ id });
  }

  /**
   * Updates a session by its ID.
   * Only admins may access this endpoint. Accepts partial updates.
   *
   * @param {string} id - Session UUID to update
   * @param {UpdateSessionsDto} updateDto - Partial or full session update payload
   * @returns {Promise<void>} No content
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update a session (Admin only)',
    description:
      'Updates session information for the specified ID. Accepts partial updates. Requires valid JWT token and ADMIN privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the session to update',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({
    type: UpdateSessionsDto,
    required: true,
    description:
      'Partial or full session details to update for the target session.',
    examples: {
      default: {
        summary: 'Update session example',
        value: {
          movieTitle: 'Oppenheimer',
          startTime: '2027-01-01T17:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'The session has been successfully updated. No content returned.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found for the provided UUID.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized. JWT token is missing or invalid.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. User does not have ADMIN privileges.',
  })
  public update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSessionsDto,
  ): Promise<void> {
    return this.sessionsService.update(id, updateDto);
  }
}
