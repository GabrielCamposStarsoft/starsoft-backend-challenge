import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateReservationsDto,
  FindAllReservationsDto,
  ReservationsResponseDto,
  UpdateReservationsDto,
} from '../dto';
import { ReservationsService } from '../services';
import { IdempotencyInterceptor } from 'src/common';
import type { IMeta } from 'src/common';

interface IFindAllReservationsResponse {
  data: ReservationsResponseDto[];
  meta: IMeta;
}

@ApiTags('reservations')
@Controller('reservations')
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
   * @param {CreateReservationsDto} createDto - Data for creating reservations.
   * @returns {Promise<ReservationsResponseDto[]>} Array of created reservation DTOs.
   */
  @Post()
  @ApiOperation({ summary: 'Reserve one or more seats for a session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reservations created successfully.',
    type: [ReservationsResponseDto],
  })
  @UseInterceptors(IdempotencyInterceptor)
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Body() createDto: CreateReservationsDto,
  ): Promise<ReservationsResponseDto[]> {
    return this.reservationsService.create(createDto);
  }

  /**
   * Get all reservations with optional filters (pagination, userId, sessionId, status).
   * @param {FindAllReservationsDto} findAllReservationsDto - DTO containing query filters.
   * @returns {Promise<any>} List and meta info of reservations.
   */
  @Get()
  @ApiOperation({ summary: 'Get all reservations with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all reservations.',
    type: [ReservationsResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'sessionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  public async findAll(
    @Query() findAllReservationsDto: FindAllReservationsDto,
  ): Promise<IFindAllReservationsResponse> {
    return this.reservationsService.findAll(findAllReservationsDto);
  }

  /**
   * Get a reservation by its ID.
   * @param {string} id - Reservation ID.
   * @returns {Promise<ReservationsResponseDto>} The requested reservation DTO.
   */
  @Get(':id')
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
  public findOne(@Param('id') id: string): Promise<ReservationsResponseDto> {
    return this.reservationsService.findOne(id);
  }

  /**
   * Update a reservation (e.g., cancel).
   * @param {string} id - Reservation ID.
   * @param {UpdateReservationsDto} updateDto - Data for updating the reservation.
   * @returns {Promise<ReservationsResponseDto>} The updated reservation DTO.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a reservation (e.g. cancel)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The reservation has been successfully updated.',
    type: ReservationsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Reservation not found.',
  })
  public update(
    @Param('id') id: string,
    @Body() updateDto: UpdateReservationsDto,
  ): Promise<ReservationsResponseDto> {
    return this.reservationsService.update(id, updateDto);
  }

  /**
   * Delete/cancel a reservation.
   * @param {string} id - Reservation ID.
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
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(@Param('id') id: string): Promise<void> {
    return this.reservationsService.remove(id);
  }
}
