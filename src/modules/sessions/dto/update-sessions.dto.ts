import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSessionsDto } from './create-sessions.dto';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateSessionsDto extends PartialType(CreateSessionsDto) {
  @ApiPropertyOptional({
    description: 'Session status',
    example: 'active',
    enum: ['active', 'cancelled', 'finished'],
  })
  @IsOptional()
  @IsIn(['active', 'cancelled', 'finished'])
  status?: string;
}
