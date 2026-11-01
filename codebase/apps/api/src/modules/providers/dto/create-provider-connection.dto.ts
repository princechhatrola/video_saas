import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ConnectionLimitsDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyJobs?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlyJobs?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxConcurrentJobs?: number;

  @ApiPropertyOptional({ example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxEstimatedCostPerProject?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  blockPaidOrUnknownProviders?: boolean;
}

export class CreateProviderConnectionDto {
  @ApiProperty({ example: 'alibaba-wan', description: 'Provider identifier' })
  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @ApiProperty({ example: 'My Primary Wan Key', description: 'User-friendly label' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @ApiProperty({
    example: 'sk-1234567890abcdef1234567890abcdef',
    description: 'API key / secret. Encrypted on arrival and never stored plaintext.',
  })
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @ApiPropertyOptional({ example: 'us-east-1' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'ws_abc123' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ type: ConnectionLimitsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConnectionLimitsDto)
  limits?: ConnectionLimitsDto;
}
