import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UsersResponseDto } from '../../users/dto';
import { CurrentUser } from '../decorators';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from '../dtos';
import { JwtAuthGuard, JwtRefreshGuard } from '../guards';
import type {
  ILoginResponse,
  IRefreshResponse,
  IRequestUser,
} from '../interfaces';
import { AuthService } from '../services/auth.service';
import {
  THROTTLE_LOGIN,
  THROTTLE_LOGOUT,
  THROTTLE_REFRESH,
  THROTTLE_REGISTER,
} from '../constants/auth.constants';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(THROTTLE_REGISTER)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  public async register(@Body() dto: RegisterDto): Promise<UsersResponseDto> {
    return this.authService.register(dto);
  }

  @Throttle(THROTTLE_LOGIN)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns access and refresh tokens',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  public async login(@Body() dto: LoginDto): Promise<ILoginResponse> {
    return this.authService.login(dto);
  }

  @Throttle(THROTTLE_REFRESH)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns new access token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  public async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<IRefreshResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Throttle(THROTTLE_LOGOUT)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token (logout)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token invalidated' })
  public async logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user (protected route example)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current user info' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid token',
  })
  public me(@CurrentUser() user: IRequestUser): IRequestUser {
    return user;
  }
}
