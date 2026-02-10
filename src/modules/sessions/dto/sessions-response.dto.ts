import { ApiProperty } from '@nestjs/swagger';

export class SessionsResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Movie title', example: 'Interstellar' })
  movieTitle: string;

  @ApiProperty({ description: 'Room name', example: 'Sala 1' })
  roomName: string;

  @ApiProperty({ description: 'Session start time' })
  startTime: Date;

  @ApiProperty({ description: 'Session end time' })
  endTime: Date;

  @ApiProperty({ description: 'Ticket price in BRL', example: 25.0 })
  ticketPrice: number;

  @ApiProperty({
    description: 'Session status',
    enum: ['active', 'cancelled', 'finished'],
  })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
