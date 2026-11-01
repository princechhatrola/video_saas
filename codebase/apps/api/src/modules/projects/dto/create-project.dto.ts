import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AspectRatio,
  ProviderSelectionMode,
} from '@videoforge/shared-types';

class ProjectSettingsDto {
  @ApiPropertyOptional({ example: 30, description: 'Duration in seconds: 30, 60, 90, 120' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(120)
  targetDurationSeconds?: number;

  @ApiPropertyOptional({ enum: AspectRatio, default: AspectRatio.PORTRAIT_9_16 })
  @IsOptional()
  @IsEnum(AspectRatio)
  aspectRatio?: AspectRatio;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'cinematic' })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({ example: '720p' })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  narrationEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  subtitlesEnabled?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  musicEnabled?: boolean;
}

class ProviderSelectionDto {
  @ApiPropertyOptional({
    enum: ProviderSelectionMode,
    default: ProviderSelectionMode.MANUAL,
  })
  @IsOptional()
  @IsEnum(ProviderSelectionMode)
  mode?: ProviderSelectionMode;

  @ApiPropertyOptional({ example: 'alibaba-wan' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ example: 'wan2.1-t2v-plus' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ example: '6650a123bc...' })
  @IsOptional()
  @IsString()
  connectionId?: string;
}

export class CreateProjectDto {
  @ApiProperty({ example: 'The Future of Deep Sea Exploration' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example:
      'A thrilling short video showing glowing bioluminescent deep sea creatures and a futuristic robotic submarine discovering underwater hydrothermal vents.',
  })
  @IsString()
  @IsNotEmpty()
  inputText!: string;

  @ApiPropertyOptional({ type: ProjectSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;

  @ApiPropertyOptional({ type: ProviderSelectionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderSelectionDto)
  providerSelection?: ProviderSelectionDto;
}
