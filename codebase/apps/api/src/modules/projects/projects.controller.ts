import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { JwtPayload } from '@videoforge/shared-types';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new video project' })
  @ApiCreatedResponse({ description: 'Project created successfully' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService.create(user.sub, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Get()
  @ApiOperation({ summary: 'List user video projects' })
  @ApiOkResponse({ description: 'Paginated list of user projects' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.projectsService.list(user.sub, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details with scenes and assets' })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.projectsService.getById(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project settings or prompt' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService.update(user.sub, id, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project and its scenes' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.projectsService.delete(user.sub, id, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/script')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Plan and generate scene breakdown script for project' })
  async generateScript(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.projectsService.generateScript(user.sub, id);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start video generation for all scenes using user BYOK provider key',
  })
  async startGeneration(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.projectsService.startGeneration(user.sub, id);
  }
}
