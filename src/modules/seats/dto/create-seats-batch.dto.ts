import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSeatsBatchDto {
  @ApiProperty({
    description: 'Session UUID to attach the seats to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Array of seat labels to create',
    example: ['A1', 'A2', 'A3', 'A4'],
    type: [String],
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  labels: string[];
}
