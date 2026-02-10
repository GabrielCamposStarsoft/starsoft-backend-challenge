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
  constructor(
    private readonly createReservationsUseCase: CreateReservationsUseCase,
    private readonly findAllReservationsUseCase: FindAllReservationsUseCase,
    private readonly findOneReservationsUseCase: FindByIdReservationUseCase,
    private readonly updateReservationsUseCase: UpdateReservationsUseCase,
    private readonly deleteReservationsUseCase: DeleteReservationsUseCase,
  ) {}

  public async create(
    createDto: CreateReservationsDto,
  ): Promise<Array<ReservationsResponseDto>> {
    const reservations: Array<ReservationEntity> =
      await this.createReservationsUseCase.execute(createDto);
    return reservations.map((r: ReservationEntity) => this.toResponseDto(r));
  }

  public async findAll(
    options: FindAllReservationsDto,
  ): Promise<IFindAllReservationsResponse> {
    const [items, total]: [Array<ReservationEntity>, number] =
      await this.findAllReservationsUseCase.execute(options);

    return {
      data: items.map((item: ReservationEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  public async findOne(id: string): Promise<ReservationsResponseDto> {
    const reservation: ReservationEntity =
      await this.findOneReservationsUseCase.execute({ id });
    return this.toResponseDto(reservation);
  }

  public async update(
    id: string,
    updateDto: UpdateReservationsDto,
  ): Promise<ReservationsResponseDto> {
    const reservation: ReservationEntity =
      await this.updateReservationsUseCase.execute(id, updateDto);
    return this.toResponseDto(reservation);
  }

  public async remove(id: string): Promise<void> {
    await this.deleteReservationsUseCase.execute({ id });
  }

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
