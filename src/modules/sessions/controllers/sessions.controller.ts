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
import { SessionsService } from '../services/sessions.service';
import { CreateSessionsDto } from '../dto/create-sessions.dto';
import { UpdateSessionsDto } from '../dto/update-sessions.dto';
import { SessionsResponseDto } from '../dto/sessions-response.dto';

interface ISessionsResponse {
  data: SessionsResponseDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The sessions has been successfully created.',
    type: SessionsResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateSessionsDto,
  ): Promise<SessionsResponseDto> {
    return this.sessionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all sessionss.',
    type: [SessionsResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ISessionsResponse> {
    return this.sessionsService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sessions by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the sessions.',
    type: SessionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sessions not found.',
  })
  public async findOne(@Param('id') id: string): Promise<SessionsResponseDto> {
    return this.sessionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sessions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The sessions has been successfully updated.',
    type: SessionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sessions not found.',
  })
  public async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSessionsDto,
  ): Promise<SessionsResponseDto> {
    return this.sessionsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sessions' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The sessions has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sessions not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id') id: string): Promise<void> {
    return this.sessionsService.remove(id);
  }
}
