import { ApiProperty } from '@nestjs/swagger';

export class SeatsResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Seat label', example: 'A1' })
  label: string;

  @ApiProperty({
    description: 'Seat status',
    enum: ['available', 'reserved', 'sold'],
  })
  status: string;

  @ApiProperty({ description: 'Version (optimistic locking)' })
  version: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
