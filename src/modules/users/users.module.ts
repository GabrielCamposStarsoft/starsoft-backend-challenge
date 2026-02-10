import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UserEntity } from './entities';
import { UsersService } from './services/users.service';
import { UsersUseCases } from './use-cases';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UsersController],
  providers: [UsersService, ...UsersUseCases],
  exports: [UsersService],
})
export class UsersModule {}
