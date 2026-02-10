import { ApiProperty } from '@nestjs/swagger';

export class SalesResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Reservation ID' })
  reservationId: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Seat ID' })
  seatId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Amount paid in BRL', example: 25.0 })
  amount: number;

  @ApiProperty({ description: 'Sale date' })
  createdAt: Date;
}
