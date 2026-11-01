import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly mongoConnection: Connection) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Service is alive' })
  checkLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({ description: 'Service is ready to handle traffic' })
  checkReadiness() {
    const isDbConnected = this.mongoConnection.readyState === 1;
    return {
      status: isDbConnected ? 'ready' : 'degraded',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
