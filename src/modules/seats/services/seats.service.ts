import { Injectable } from '@nestjs/common';
import { CreateSeatsUseCase } from '../use-cases/create-seats.use-case';
import { FindAllSeatsUseCase } from '../use-cases/find-all-seats.use-case';
import { FindOneSeatsUseCase } from '../use-cases/find-one-seats.use-case';
import { UpdateSeatsUseCase } from '../use-cases/update-seats.use-case';
import { DeleteSeatsUseCase } from '../use-cases/delete-seats.use-case';
import { CreateSeatsDto } from '../dto/create-seats.dto';
import { UpdateSeatsDto } from '../dto/update-seats.dto';
import { SeatsResponseDto } from '../dto/seats-response.dto';
import { SeatEntity } from '../entities';
import { SeatStatus } from '../enums';
import { IMeta } from 'src/common';
interface ISeatsResponse {
  data: Array<SeatsResponseDto>;
  meta: IMeta;
}
@Injectable()
export class SeatsService {
  constructor(
    private readonly createSeatsUseCase: CreateSeatsUseCase,
    private readonly findAllSeatsUseCase: FindAllSeatsUseCase,
    private readonly findOneSeatsUseCase: FindOneSeatsUseCase,
    private readonly updateSeatsUseCase: UpdateSeatsUseCase,
    private readonly deleteSeatsUseCase: DeleteSeatsUseCase,
  ) {}

  public async create(createDto: CreateSeatsDto): Promise<SeatsResponseDto> {
    const seat: SeatEntity = await this.createSeatsUseCase.execute(createDto);
    return this.toResponseDto(seat);
  }

  public async findAll(options: {
    page: number;
    limit: number;
    sessionId?: string;
  }): Promise<ISeatsResponse> {
    const [items, total]: [Array<SeatEntity>, number] =
      await this.findAllSeatsUseCase.execute(options);

    return {
      data: items.map((item: SeatEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  public async findOne(id: string): Promise<SeatsResponseDto> {
    const seat = await this.findOneSeatsUseCase.execute({ id });
    return this.toResponseDto(seat);
  }

  public async update(
    id: string,
    updateDto: UpdateSeatsDto,
  ): Promise<SeatsResponseDto> {
    const seat: SeatEntity = await this.updateSeatsUseCase.execute({
      id,
      status: updateDto.status as SeatStatus,
    });
    return this.toResponseDto(seat);
  }

  public async remove(id: string): Promise<void> {
    await this.deleteSeatsUseCase.execute({ id });
  }

  private toResponseDto(seat: SeatEntity): SeatsResponseDto {
    return {
      id: seat.id,
      sessionId: seat.sessionId,
      label: seat.label,
      status: seat.status,
      version: seat.version,
      createdAt: seat.createdAt,
      updatedAt: seat.updatedAt,
    };
  }
}
