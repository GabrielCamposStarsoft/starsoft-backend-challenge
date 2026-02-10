import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UserEntity } from '../entities';

@Injectable()
export class CreateUsersUseCase implements IUseCase<
  CreateUsersDto,
  UserEntity
> {
  private readonly logger: Logger = new Logger(CreateUsersUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  public async execute(createDto: CreateUsersDto): Promise<UserEntity> {
    const existing = await this.usersRepository.findOne({
      where: { email: createDto.email },
    });
    if (existing) {
      throw new ConflictException(
        `User with email ${createDto.email} already exists`,
      );
    }

    const hashedPassword = await argon2.hash(createDto.password);

    const user: UserEntity = this.usersRepository.create({
      ...createDto,
      password: hashedPassword,
    });
    const saved: UserEntity = await this.usersRepository.save(user);

    this.logger.log(`User ${saved.id} created: ${createDto.username}`);

    return saved;
  }
}
