import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { StartBeforeEnd } from 'src/common/validators/start-before-end.validator';

/**
 * DTO for updating a session.
 *
 * All fields are optional (partial update / PATCH semantics).
 * Only provided fields will be updated.
 */
@ApiExtraModels(UpdateSessionsDto)
export class UpdateSessionsDto {
  /**
   * Title of the movie to be shown in this session.
   * @example "Interstellar"
   */
  @ApiProperty({
    description: 'Title of the movie being screened in the session.',
    example: 'Interstellar',
    required: false,
    type: String,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'movieTitle must not be empty' })
  movieTitle?: string;

  /**
   * The name of the room/theater where the session will take place.
   * @example "Sala 1"
   */
  @ApiProperty({
    description: 'The room or theater name where the session takes place.',
    example: 'Sala 1',
    required: false,
    type: String,
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'roomName must not be empty' })
  roomName?: string;

  /**
   * Session start time (ISO 8601).
   * @example "2026-03-15T19:00:00.000Z"
   */
  @ApiProperty({
    description: 'Start time (ISO 8601)',
    example: '2026-03-15T19:00:00.000Z',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  /**
   * Session end time (ISO 8601).
   * @example "2026-03-15T21:30:00.000Z"
   */
  @ApiProperty({
    description: 'End time (ISO 8601)',
    example: '2026-03-15T21:30:00.000Z',
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @StartBeforeEnd()
  endTime?: string;

  /**
   * Ticket price in BRL.
   * @example 25.0
   */
  @ApiProperty({
    description: 'Ticket price in BRL',
    example: 25.0,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  ticketPrice?: number;
}
