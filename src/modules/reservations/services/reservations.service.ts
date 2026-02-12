/**
 * @fileoverview Reservation domain service.
 *
 * Orchestrates create, findAll, findOne, update, delete. Delegates to use cases.
 *
 * @service reservations-service
 */

import { Injectable } from '@nestjs/common';
import {
  CreateReservationsDto,
  ReservationsResponseDto,
  UpdateReservationsDto,
  FindAllReservationsDto,
} from '../dto';
import {
  CreateReservationsUseCase,
  FindAllReservationsUseCase,
  FindByIdReservationUseCase,
  UpdateReservationsUseCase,
  DeleteReservationsUseCase,
} from '../use-cases';
import { ReservationEntity } from '../entities';
import { IFindAllReservationsResponse } from '../interfaces';

@Injectable()
export class ReservationsService {
  /**
   * Constructs a ReservationsService instance.
   * @param createReservationsUseCase Use case for creating reservations.
   * @param findAllReservationsUseCase Use case for finding all reservations.
   * @param findOneReservationsUseCase Use case for finding a reservation by ID.
   * @param updateReservationsUseCase Use case for updating a reservation.
   * @param deleteReservationsUseCase Use case for deleting a reservation.
   */
  constructor(
    private readonly createReservationsUseCase: CreateReservationsUseCase,
    private readonly findAllReservationsUseCase: FindAllReservationsUseCase,
    private readonly findOneReservationsUseCase: FindByIdReservationUseCase,
    private readonly updateReservationsUseCase: UpdateReservationsUseCase,
    private readonly deleteReservationsUseCase: DeleteReservationsUseCase,
  ) {}

  /**
   * Creates one or more reservations for the given user.
   * @param createDto Data Transfer Object for reservation creation.
   * @param userId The ID of the user creating the reservation(s).
   * @returns Promise resolving to an array of reservation response DTOs.
   */
  public async create(
    createDto: CreateReservationsDto,
    userId: string,
  ): Promise<Array<ReservationsResponseDto>> {
    const reservations: Array<ReservationEntity> =
      await this.createReservationsUseCase.execute({
        ...createDto,
        userId,
      });
    return reservations.map((r: ReservationEntity) => this.toResponseDto(r));
  }

  /**
   * Finds all reservations matching the query options (with pagination).
   * @param options Query options for finding reservations, such as page and limit.
   * @returns Promise resolving to response data and metadata (paging).
   */
  public async findAll(
    options: FindAllReservationsDto,
  ): Promise<IFindAllReservationsResponse> {
    const [items, total]: [Array<ReservationEntity>, number] =
      await this.findAllReservationsUseCase.execute(options);

    return {
      data: items.map((item: ReservationEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page ?? 1,
        limit: options.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (options.limit ?? 10)),
      },
    };
  }

  /**
   * Finds a single reservation by its ID.
   * @param id The reservation ID.
   * @returns Promise resolving to the reservation response DTO.
   */
  public async findOne(
    id: string,
    userId: string,
  ): Promise<ReservationsResponseDto> {
    const reservation: ReservationEntity =
      await this.findOneReservationsUseCase.execute({ id, userId });
    return this.toResponseDto(reservation);
  }

  /**
   * Updates a reservation by its ID for a particular user.
   * @param id The reservation ID.
   * @param updateDto Data Transfer Object for updating the reservation.
   * @param userId The ID of the user performing the update.
   * @returns Promise resolving to the updated reservation response DTO.
   */
  public async update(
    id: string,
    updateDto: UpdateReservationsDto,
    userId: string,
  ): Promise<ReservationsResponseDto> {
    const reservation: ReservationEntity =
      await this.updateReservationsUseCase.execute(id, updateDto, userId);
    return this.toResponseDto(reservation);
  }

  /**
   * Removes (deletes) a reservation by ID for a particular user.
   * @param id The reservation ID.
   * @param userId The ID of the user performing the deletion.
   * @returns Promise resolving when deletion is complete.
   */
  public async remove(id: string, userId: string): Promise<void> {
    await this.deleteReservationsUseCase.execute({ id, userId });
  }

  /**
   * Converts a ReservationEntity to a ReservationsResponseDto.
   * @param reservation The reservation entity instance.
   * @returns ReservationsResponseDto version of the entity.
   */
  private toResponseDto(
    reservation: ReservationEntity,
  ): ReservationsResponseDto {
    return {
      id: reservation.id,
      sessionId: reservation.sessionId,
      seatId: reservation.seatId,
      userId: reservation.userId,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
