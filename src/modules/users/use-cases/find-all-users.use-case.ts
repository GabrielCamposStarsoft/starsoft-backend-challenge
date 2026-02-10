import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUseCase } from 'src/common/interfaces/use-case.interface';
import { UserEntity } from '../entities';

export interface IFindAllUsersInput {
  page: number;
  limit: number;
}

@Injectable()
export class FindAllUsersUseCase implements IUseCase<
  IFindAllUsersInput,
  [Array<UserEntity>, number]
> {
  private readonly logger: Logger = new Logger(FindAllUsersUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  public async execute(
    input: IFindAllUsersInput,
  ): Promise<[Array<UserEntity>, number]> {
    const { page, limit } = input;

    const [items, total]: [Array<UserEntity>, number] = await Promise.all([
      this.usersRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'DESC' },
      }),
      this.usersRepository.count(),
    ]);

    this.logger.log(`Found ${total} users (page ${page})`);

    return [items, total];
  }
}
