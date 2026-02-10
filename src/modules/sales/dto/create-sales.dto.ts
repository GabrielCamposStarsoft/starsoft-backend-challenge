import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
@ApiTags('Sales')
export class CreateSalesDto {
  @ApiProperty({
    description: 'Reservation ID to confirm payment',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  reservationId: string;
}
