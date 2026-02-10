import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../entities';

@Injectable()
export class FindUserByEmailUseCase
  implements IUseCase<string, Nullable<UserEntity>>
{
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  public async execute(email: string): Promise<Nullable<UserEntity>> {
    return this.usersRepository.findOne({ where: { email } });
  }
}
