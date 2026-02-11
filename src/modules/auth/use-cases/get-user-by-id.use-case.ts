import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IUseCase } from 'src/common';
import type { Nullable } from 'src/common';
import { UserEntity } from '../../users/entities';

@Injectable()
export class GetUserByIdUseCase implements IUseCase<
  string,
  Nullable<UserEntity>
> {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  public async execute(id: string): Promise<Nullable<UserEntity>> {
    return this.userRepository.findOne({ where: { id } });
  }
}
