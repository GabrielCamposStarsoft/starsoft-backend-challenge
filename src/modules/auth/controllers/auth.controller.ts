/**
 * @fileoverview Authentication HTTP controller.
 *
 * Exposes /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me.
 * Routes are throttled to mitigate brute force. Uses JwtAuthGuard for /me, JwtRefreshGuard for /refresh.
 *
 * @controller auth-controller
 */

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
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { UsersResponseDto } from '../../users/dto';
import { CurrentUser, type IRequestUser, JwtAuthGuard } from 'src/common';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from '../dtos';
import { JwtRefreshGuard } from '../guards';
import type { ILoginResponse, IRefreshResponse } from '../interfaces';
import { AuthService } from '../services';
import {
  THROTTLE_LOGIN,
  THROTTLE_LOGOUT,
  THROTTLE_REFRESH,
  THROTTLE_REGISTER,
} from '../constants';
import { Throttle } from '@nestjs/throttler';

/**
 * Controller for authentication routes.
 * Handles user registration, login, refresh, logout, and user information retrieval.
 * Uses throttling to protect against brute force attacks.
 */
@ApiTags('auth')
@Controller()
export class AuthController {
  /**
   * Creates an instance of AuthController.
   * @param authService The authentication service to inject.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user with the given credentials.
   * @param dto Registration data transfer object.
   * @returns The DTO of the newly created user.
   *
   * @throttle 3 requests per hour per IP
   * @route POST /register
   */
  @Throttle(THROTTLE_REGISTER)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: RegisterDto,
    description: 'Registration data (email and password)',
    examples: {
      default: {
        summary: 'Request example',
        value: { email: 'user@example.com', password: 'Str0ngP@ss' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @HttpCode(HttpStatus.CREATED)
  public register(@Body() dto: RegisterDto): Promise<UsersResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * Authenticates and logs in a user with email and password.
   * @param dto Login data transfer object.
   * @returns The login response containing access and refresh tokens.
   *
   * @throttle 5 requests per minute per IP
   * @route POST /login
   */
  @Throttle(THROTTLE_LOGIN)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    type: LoginDto,
    description: 'Credenciais de login (email e senha)',
    examples: {
      default: {
        summary: 'Request example',
        value: { email: 'user@example.com', password: 'Str0ngP@ss' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns access and refresh tokens',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  public login(@Body() dto: LoginDto): Promise<ILoginResponse> {
    return this.authService.login(dto);
  }

  /**
   * Provides a new access token using a valid refresh token.
   * @param dto Refresh token data transfer object.
   * @returns The refresh response containing a new access token.
   *
   * @throttle 10 requests per minute per IP
   * @route POST /refresh
   * @guard JwtRefreshGuard
   */
  @Throttle(THROTTLE_REFRESH)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token returned on login',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2gifQ...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns new access token',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  public refresh(@Body() dto: RefreshTokenDto): Promise<IRefreshResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * Logs out the user by invalidating the given refresh token.
   * @param dto Logout data transfer object.
   * @returns An object confirming successful logout.
   *
   * @throttle 20 requests per minute per IP
   * @route POST /logout
   */
  @Throttle(THROTTLE_LOGOUT)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate refresh token (logout)' })
  @ApiBody({
    type: LogoutDto,
    description: 'Refresh token to be invalidated',
    examples: {
      default: {
        summary: 'Request example',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2gifQ...',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token invalidated' })
  public async logout(@Body() dto: LogoutDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  /**
   * Gets the currently authenticated user.
   * @param user The current request user injected by the JwtAuthGuard.
   * @returns The current user data.
   *
   * @route GET /me
   * @guard JwtAuthGuard
   */
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
