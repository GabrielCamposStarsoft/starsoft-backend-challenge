import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';

@Injectable()
export class DeleteUsersUseCase {
  private readonly logger: Logger = new Logger(DeleteUsersUseCase.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  public async execute(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    await this.usersRepository.delete({ id });

    this.logger.log(`User ${id} deleted`);
  }
}
