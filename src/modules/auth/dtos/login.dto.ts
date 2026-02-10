import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'Str0ngP@ss' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
