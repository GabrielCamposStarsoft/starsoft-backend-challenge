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
import { SeatsService } from '../services/seats.service';
import { CreateSeatsDto } from '../dto/create-seats.dto';
import { UpdateSeatsDto } from '../dto/update-seats.dto';
import { SeatsResponseDto } from '../dto/seats-response.dto';

interface ISeatsResponse {
  data: SeatsResponseDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@ApiTags('seats')
@Controller('seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new seat' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The seat has been successfully created.',
    type: SeatsResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createDto: CreateSeatsDto,
  ): Promise<SeatsResponseDto> {
    return this.seatsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all seats.',
    type: [SeatsResponseDto],
  })
  public async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sessionId') sessionId?: string,
  ): Promise<ISeatsResponse> {
    return this.seatsService.findAll({ page, limit, sessionId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a seat by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the seat.',
    type: SeatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seat not found.',
  })
  public async findOne(@Param('id') id: string): Promise<SeatsResponseDto> {
    return this.seatsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a seat' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The seat has been successfully updated.',
    type: SeatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seat not found.',
  })
  public async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSeatsDto,
  ): Promise<SeatsResponseDto> {
    return this.seatsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a seat' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The seat has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seat not found.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id') id: string): Promise<void> {
    return this.seatsService.remove(id);
  }
}
