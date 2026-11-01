import {
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  IsTimeZone,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdatePreferencesDto {
  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: UpdatePreferencesDto })
  @IsOptional()
  preferences?: UpdatePreferencesDto;
}
