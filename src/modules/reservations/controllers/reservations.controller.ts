/**
 * @fileoverview Reservations HTTP controller.
 *
 * Exposes create, findAll, findOne, delete. Uses idempotency for create.
 * User-scoped (userId from JWT).
 *
 * @controller reservations-controller
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateReservationsDto,
  FindAllReservationsDto,
  ReservationsResponseDto,
  UpdateReservationsDto,
} from '../dto';
import { ReservationsService } from '../services';
import {
  IdempotencyInterceptor,
  JwtAuthGuard,
  RolesGuard,
  CurrentUser,
  type IRequestUser,
  Roles,
  UserRole,
} from 'src/common';
import type { IFindAllReservationsResponse } from '../interfaces';
@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReservationsController {
  /**
   * Constructor for ReservationsController.
   * @param {ReservationsService} reservationsService - The service handling reservation logic.
   */
  public constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  /**
   * Reserve one or more seats for a session.
   * The userId is extracted from the authenticated JWT token.
   * @param {CreateReservationsDto} createDto - Data for creating reservations.
   * @param {IRequestUser} user - Authenticated user from JWT.
   * @returns {Promise<ReservationsResponseDto[]>} Array of created reservation DTOs.
   */
  @Post()
  @ApiOperation({ summary: 'Reserve one or more seats for a session' })
  @ApiBody({
    type: CreateReservationsDto,
    description: 'Session and seats to reserve',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          seatIds: [
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reservations created successfully.',
    type: [ReservationsResponseDto],
  })
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() createDto: CreateReservationsDto,
    @CurrentUser() user: IRequestUser,
  ): Promise<Array<ReservationsResponseDto>> {
    return this.reservationsService.create(createDto, user.id);
  }

  /**
   * Get all reservations for the authenticated user with optional filters.
   * @param {FindAllReservationsDto} findAllReservationsDto - DTO containing query filters.
   * @param {IRequestUser} user - Authenticated user from JWT.
   * @returns {Promise<IFindAllReservationsResponse>} List and meta info of reservations.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all reservations for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all reservations for the authenticated user.',
    type: [ReservationsResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  public async findAll(
    @Query() findAllReservationsDto: FindAllReservationsDto,
    @CurrentUser() user: IRequestUser,
  ): Promise<IFindAllReservationsResponse> {
    findAllReservationsDto.userId = user.id;
    return this.reservationsService.findAll(findAllReservationsDto);
  }

  /**
   * Get a reservation by its ID.
   * @param {string} id - Reservation ID.
   * @returns {Promise<ReservationsResponseDto>} The requested reservation DTO.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a reservation by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the reservation.',
    type: ReservationsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reservation not found.',
  })
  public findOne(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ): Promise<ReservationsResponseDto> {
    return this.reservationsService.findOne(id, user.id);
  }

  /**
   * Delete/cancel a reservation.
   * Only the reservation owner can delete.
   * @param {string} id - Reservation ID.
   * @param {IRequestUser} user - Authenticated user from JWT.
   * @returns {Promise<void>} No content.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete/cancel a reservation' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The reservation has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reservation not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only modify your own reservations.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(
    @Param('id') id: string,
    @CurrentUser() user: IRequestUser,
  ): Promise<void> {
    return this.reservationsService.remove(id, user.id);
  }

  /**
   * Update a reservation by ID.
   * Only admins are allowed to update reservations.
   *
   * @param {string} id - Reservation ID.
   * @param {UpdateReservationsDto} updateDto - DTO containing fields to update.
   * @param {IRequestUser} user - The currently authenticated user.
   * @returns {Promise<ReservationsResponseDto>} The updated reservation DTO.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The reservation has been successfully updated.',
    type: ReservationsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reservation not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only modify your own reservations.',
  })
  public update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationsDto,
    @CurrentUser() user: IRequestUser,
  ): Promise<ReservationsResponseDto> {
    return this.reservationsService.update(id, updateDto, user.id);
  }
}
