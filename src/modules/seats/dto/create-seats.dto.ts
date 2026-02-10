import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSeatsDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Seat label (e.g. A1, B3)', example: 'A1' })
  @IsString()
  @IsNotEmpty()
  label: string;
}
