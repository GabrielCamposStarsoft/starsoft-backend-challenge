import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateSessionsDto {
  @ApiProperty({ description: 'Movie title', example: 'Interstellar' })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @ApiProperty({ description: 'Room name', example: 'Sala 1' })
  @IsString()
  @IsNotEmpty()
  roomName: string;

  @ApiProperty({
    description: 'Session start time (ISO 8601)',
    example: '2026-03-15T19:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Session end time (ISO 8601)',
    example: '2026-03-15T21:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ description: 'Ticket price in BRL', example: 25.0 })
  @IsNumber()
  @Min(0.01)
  ticketPrice: number;
}
