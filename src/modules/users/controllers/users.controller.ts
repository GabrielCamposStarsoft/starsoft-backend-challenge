import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  UsersService,
  type IFindAllUsersResponse,
} from '../services/users.service';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersResponseDto } from '../dto/users-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new users' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The users has been successfully created.',
    type: UsersResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateUsersDto,
  ): Promise<UsersResponseDto> {
    return this.usersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all userss' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all userss.',
    type: [UsersResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<IFindAllUsersResponse> {
    return this.usersService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a users by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the users.',
    type: UsersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Users not found.',
  })
  public async findOne(@Param('id') id: string): Promise<UsersResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The users has been successfully updated.',
    type: UsersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Users not found.',
  })
  public async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUsersDto,
  ): Promise<UsersResponseDto> {
    return this.usersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a users' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The users has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Users not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
