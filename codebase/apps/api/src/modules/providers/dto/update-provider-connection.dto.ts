import {
  IsString,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProviderConnectionDto } from './create-provider-connection.dto';

export class UpdateProviderConnectionDto {
  @ApiPropertyOptional({ example: 'My Updated Wan Key' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiPropertyOptional({
    description: 'New API key. If omitted, existing encrypted credential is kept.',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'us-east-1' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'ws_abc123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
