import { Injectable } from '@nestjs/common';
import { CreateSessionsUseCase } from '../use-cases/create-sessions.use-case';
import { FindAllSessionsUseCase } from '../use-cases/find-all-sessions.use-case';
import { FindSessionByIdUseCase } from '../use-cases/find-one-sessions.use-case';
import { UpdateSessionsUseCase } from '../use-cases/update-sessions.use-case';
import { DeleteSessionsUseCase } from '../use-cases/delete-sessions.use-case';
import { CreateSessionsDto } from '../dto/create-sessions.dto';
import { UpdateSessionsDto } from '../dto/update-sessions.dto';
import { SessionsResponseDto } from '../dto/sessions-response.dto';
import { SessionEntity } from '../entities';

@Injectable()
export class SessionsService {
  constructor(
    private readonly createSessionsUseCase: CreateSessionsUseCase,
    private readonly findAllSessionsUseCase: FindAllSessionsUseCase,
    private readonly findSessionByIdUseCase: FindSessionByIdUseCase,
    private readonly updateSessionsUseCase: UpdateSessionsUseCase,
    private readonly deleteSessionsUseCase: DeleteSessionsUseCase,
  ) {}

  public async create(
    createDto: CreateSessionsDto,
  ): Promise<SessionsResponseDto> {
    const session: SessionEntity =
      await this.createSessionsUseCase.execute(createDto);
    return this.toResponseDto(session);
  }

  public async findAll(options: { page: number; limit: number }) {
    const [items, total]: [Array<SessionEntity>, number] =
      await this.findAllSessionsUseCase.execute(options);

    return {
      data: items.map((item: SessionEntity) => this.toResponseDto(item)),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  public async findOne(id: string): Promise<SessionsResponseDto> {
    const session = await this.findSessionByIdUseCase.execute(id);
    return this.toResponseDto(session);
  }

  public async update(
    id: string,
    updateDto: UpdateSessionsDto,
  ): Promise<SessionsResponseDto> {
    const session = await this.updateSessionsUseCase.execute(id, updateDto);
    return this.toResponseDto(session);
  }

  public async remove(id: string): Promise<void> {
    await this.deleteSessionsUseCase.execute(id);
  }

  private toResponseDto(session: SessionEntity): SessionsResponseDto {
    return {
      id: session.id,
      movieTitle: session.movieTitle,
      roomName: session.roomName,
      startTime: session.startTime,
      endTime: session.endTime,
      ticketPrice: session.ticketPrice,
      status: session.status,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
