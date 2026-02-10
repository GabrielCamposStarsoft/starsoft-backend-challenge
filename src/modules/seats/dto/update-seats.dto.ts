import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateSeatsDto {
  @ApiPropertyOptional({
    description: 'Seat status',
    example: 'available',
    enum: ['available', 'reserved', 'sold'],
  })
  @IsOptional()
  @IsIn(['available', 'reserved', 'sold'])
  status?: string;
}
