import { PartialType } from '@nestjs/swagger';
import { CreateSalesDto } from './create-sales.dto';

export class UpdateSalesDto extends PartialType(CreateSalesDto) {}
