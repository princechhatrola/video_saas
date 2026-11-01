import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateProviderConnectionDto } from './dto/create-provider-connection.dto';
import { UpdateProviderConnectionDto } from './dto/update-provider-connection.dto';
import type { MaskedConnectionView, JwtPayload } from '@videoforge/shared-types';

@ApiTags('Providers & BYOK')
@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ── Catalog Endpoints ────────────────────────────────────────

  @Public()
  @Get('catalog')
  @ApiOperation({
    summary: 'List supported AI video providers, models, and capabilities',
  })
  @ApiOkResponse({ description: 'Active provider catalog and model specifications' })
  async getCatalog() {
    return this.providersService.getCatalog(true);
  }

  @Public()
  @Get('catalog/:providerId')
  @ApiOperation({ summary: 'Get details for a specific provider' })
  @ApiOkResponse({ description: 'Provider catalog entry with models' })
  async getProviderDetails(@Param('providerId') providerId: string) {
    return this.providersService.getProviderDetails(providerId);
  }

  // ── User BYOK Connection Endpoints ───────────────────────────

  @ApiBearerAuth()
  @Get('connections')
  @ApiOperation({
    summary: 'List user BYOK provider connections (keys are masked)',
  })
  @ApiOkResponse({ description: 'List of configured provider connections' })
  async listConnections(
    @CurrentUser() user: JwtPayload,
  ): Promise<MaskedConnectionView[]> {
    return this.providersService.listUserConnections(user.sub);
  }

  @ApiBearerAuth()
  @Get('connections/:id')
  @ApiOperation({ summary: 'Get a specific provider connection' })
  @ApiOkResponse({ description: 'Masked provider connection details' })
  async getConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MaskedConnectionView> {
    return this.providersService.getConnection(user.sub, id);
  }

  @ApiBearerAuth()
  @Post('connections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Connect a new provider API key (BYOK). Encrypted immediately with AES-256-GCM.',
  })
  @ApiCreatedResponse({ description: 'Connection created successfully' })
  async createConnection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProviderConnectionDto,
    @Req() req: Request,
  ): Promise<MaskedConnectionView> {
    return this.providersService.createConnection(user.sub, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @ApiBearerAuth()
  @Patch('connections/:id')
  @ApiOperation({ summary: 'Update provider connection label or rotate API key' })
  @ApiOkResponse({ description: 'Connection updated successfully' })
  async updateConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProviderConnectionDto,
    @Req() req: Request,
  ): Promise<MaskedConnectionView> {
    return this.providersService.updateConnection(user.sub, id, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @ApiBearerAuth()
  @Delete('connections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a provider connection' })
  async deleteConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<void> {
    return this.providersService.deleteConnection(user.sub, id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @ApiBearerAuth()
  @Post('connections/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test / validate credentials for a connection' })
  async testConnection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.providersService.testConnection(user.sub, id);
  }
}
