import { Injectable } from '@nestjs/common';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersResponseDto } from '../dto/users-response.dto';
import { UserEntity } from '../entities';
import {
  CreateUsersUseCase,
  FindUserByIdUseCase,
  UpdateUsersUseCase,
  DeleteUsersUseCase,
} from '../use-cases';
import {
  FindAllUsersUseCase,
  type IFindAllUsersInput,
} from '../use-cases/find-all-users.use-case';
import { FindUserByEmailUseCase } from '../use-cases/find-user-by-email.use-case';
import type { IMeta } from 'src/common';
import type { Nullable } from 'src/common';

export interface IFindAllUsersResponse {
  data: Array<UsersResponseDto>;
  meta: IMeta;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly createUsersUseCase: CreateUsersUseCase,
    private readonly findAllUsersUseCase: FindAllUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly updateUsersUseCase: UpdateUsersUseCase,
    private readonly deleteUsersUseCase: DeleteUsersUseCase,
  ) {}

  public async findByEmail(email: string): Promise<Nullable<UserEntity>> {
    return this.findUserByEmailUseCase.execute(email);
  }

  public async create(createDto: CreateUsersDto): Promise<UsersResponseDto> {
    const user: UserEntity = await this.createUsersUseCase.execute(createDto);
    return this.toResponseDto(user);
  }

  public async findAll(
    input: IFindAllUsersInput,
  ): Promise<IFindAllUsersResponse> {
    const [items, total]: [Array<UserEntity>, number] =
      await this.findAllUsersUseCase.execute(input);

    return {
      data: items.map((item: UserEntity) => this.toResponseDto(item)),
      meta: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  public async findOne(id: string): Promise<UsersResponseDto> {
    const user: UserEntity = await this.findUserByIdUseCase.execute(id);
    return this.toResponseDto(user);
  }

  public async update(
    id: string,
    updateDto: UpdateUsersDto,
  ): Promise<UsersResponseDto> {
    const user: UserEntity = await this.updateUsersUseCase.execute(
      id,
      updateDto,
    );
    return this.toResponseDto(user);
  }

  public async remove(id: string): Promise<void> {
    await this.deleteUsersUseCase.execute(id);
  }

  private toResponseDto(user: UserEntity): UsersResponseDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
