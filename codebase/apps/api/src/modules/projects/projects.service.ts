import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { ScenesRepository } from './scenes.repository';
import { ProviderConnectionsRepository } from '../providers/provider-connections.repository';
import { ProviderCatalogRepository } from '../providers/provider-catalog/provider-catalog.repository';
import { AuditService } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  AspectRatio,
  AuditAction,
  ConnectionStatus,
  GenerationMode,
  JobType,
  ProjectStatus,
  ProviderSelectionMode,
  SceneStatus,
} from '@videoforge/shared-types';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly projectsRepo: ProjectsRepository,
    private readonly scenesRepo: ScenesRepository,
    private readonly connectionsRepo: ProviderConnectionsRepository,
    private readonly catalogRepo: ProviderCatalogRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    userId: string,
    dto: CreateProjectDto,
    reqMeta?: { ip?: string; userAgent?: string },
  ) {
    // 1. Verify connection if manual mode specified
    if (
      dto.providerSelection?.mode === ProviderSelectionMode.MANUAL &&
      dto.providerSelection.connectionId
    ) {
      const conn = await this.connectionsRepo.findByIdAndUserId(
        dto.providerSelection.connectionId,
        userId,
      );
      if (!conn) {
        throw new BadRequestException('Selected provider connection not found');
      }
    }

    const project = await this.projectsRepo.create({
      userId: userId as any,
      title: dto.title,
      inputText: dto.inputText,
      status: ProjectStatus.DRAFT,
      settings: {
        targetDurationSeconds: dto.settings?.targetDurationSeconds || 30,
        aspectRatio: dto.settings?.aspectRatio || AspectRatio.PORTRAIT_9_16,
        language: dto.settings?.language || 'en',
        style: dto.settings?.style || 'cinematic',
        resolution: dto.settings?.resolution || '720p',
        narrationEnabled: dto.settings?.narrationEnabled ?? true,
        subtitlesEnabled: dto.settings?.subtitlesEnabled ?? true,
        musicEnabled: dto.settings?.musicEnabled ?? false,
      },
      providerSelection: {
        mode: dto.providerSelection?.mode || ProviderSelectionMode.MANUAL,
        providerId: dto.providerSelection?.providerId,
        modelId: dto.providerSelection?.modelId,
        connectionId: dto.providerSelection?.connectionId,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE_PROJECT,
      resourceType: 'project',
      resourceId: project._id.toString(),
      details: { title: dto.title },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return project;
  }

  async list(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { items, total } = await this.projectsRepo.findByUserId(
      userId,
      limit,
      offset,
    );
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(userId: string, projectId: string) {
    const project = await this.projectsRepo.findByIdAndUserId(projectId, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const scenes = await this.scenesRepo.findByProjectId(projectId, userId);
    return {
      ...project.toObject(),
      scenes,
    };
  }

  async update(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
    reqMeta?: { ip?: string; userAgent?: string },
  ) {
    const project = await this.projectsRepo.updateByIdAndUserId(
      projectId,
      userId,
      dto,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE_PROJECT,
      resourceType: 'project',
      resourceId: projectId,
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return project;
  }

  async delete(
    userId: string,
    projectId: string,
    reqMeta?: { ip?: string; userAgent?: string },
  ) {
    const deleted = await this.projectsRepo.deleteByIdAndUserId(projectId, userId);
    if (!deleted) {
      throw new NotFoundException('Project not found');
    }
    await this.scenesRepo.deleteByProjectId(projectId);

    await this.auditService.log({
      userId,
      action: AuditAction.DELETE_PROJECT,
      resourceType: 'project',
      resourceId: projectId,
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });
  }

  /**
   * Plans the scenes and generates a structured script.
   * Breaks target duration into moving clips (typically 5-6s each).
   */
  async generateScript(userId: string, projectId: string) {
    const project = await this.projectsRepo.findByIdAndUserId(projectId, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const duration = project.settings.targetDurationSeconds || 30;
    const clipDuration = 5; // standard moving clip duration
    const sceneCount = Math.max(1, Math.round(duration / clipDuration));

    const scenes = [];
    for (let i = 1; i <= sceneCount; i++) {
      scenes.push({
        sceneNumber: i,
        narration: `Scene ${i} voiceover narrating part ${i} of: "${project.title}".`,
        visualPrompt: `High quality cinematic moving shot, ${project.settings.style} style, aspect ratio ${project.settings.aspectRatio}. Scene ${i} visualizing: ${project.inputText.slice(0, 100)}...`,
        plannedDurationSeconds: clipDuration,
        generationMode: GenerationMode.TEXT_TO_VIDEO,
      });
    }

    const script = {
      title: project.title,
      summary: project.inputText.slice(0, 200),
      targetDurationSeconds: duration,
      aspectRatio: project.settings.aspectRatio,
      language: project.settings.language,
      narration: scenes.map((s) => s.narration).join(' '),
      scenes,
    };

    const updated = await this.projectsRepo.updateByIdAndUserId(
      projectId,
      userId,
      {
        script,
        totalScenes: sceneCount,
        status: ProjectStatus.SCRIPT_READY,
      },
    );

    return updated;
  }

  /**
   * Triggers video generation for all scenes.
   * Strictly enforces BYOK: requires an active user provider connection.
   */
  async startGeneration(userId: string, projectId: string) {
    const project = await this.projectsRepo.findByIdAndUserId(projectId, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.script || !project.script.scenes?.length) {
      throw new BadRequestException('Project has no script. Generate a script first.');
    }

    // Resolve user's BYOK provider connection
    let connectionId = project.providerSelection?.connectionId;
    let providerId = project.providerSelection?.providerId;
    let modelId = project.providerSelection?.modelId;

    if (!connectionId) {
      // Find user's default or first active connection
      const connections = await this.connectionsRepo.findByUserId(userId);
      const activeConn = connections.find(
        (c) => c.status === ConnectionStatus.CONNECTED,
      );
      if (!activeConn) {
        throw new BadRequestException(
          'No active AI provider key found. Please connect your provider API key in Settings → API Providers (BYOK).',
        );
      }
      connectionId = activeConn._id.toString();
      providerId = activeConn.providerId;
    }

    // Default model if none specified
    if (!modelId && providerId) {
      const models = await this.catalogRepo.findModelsByProviderId(providerId);
      if (models.length > 0) {
        modelId = models[0]!.modelId;
      } else {
        modelId = 'default-model';
      }
    }

    // Clean up any existing scenes for this project
    await this.scenesRepo.deleteByProjectId(projectId);

    // Create scene entities in DB
    const scenesToCreate = project.script.scenes.map((s) => ({
      userId: userId as any,
      projectId: projectId as any,
      sceneNumber: s.sceneNumber,
      narration: s.narration,
      visualPrompt: s.visualPrompt,
      negativePrompt: s.negativePrompt,
      plannedDurationSeconds: s.plannedDurationSeconds,
      generationMode: s.generationMode || GenerationMode.TEXT_TO_VIDEO,
      providerId: providerId || 'alibaba-wan',
      modelId: modelId || 'wan2.1-t2v-plus',
      connectionId: connectionId as any,
      status: SceneStatus.QUEUED,
      attempts: 0,
    }));

    await this.scenesRepo.createMany(scenesToCreate);

    // Update project state
    const updated = await this.projectsRepo.updateByIdAndUserId(
      projectId,
      userId,
      {
        status: ProjectStatus.GENERATING,
        completedScenes: 0,
        failedScenes: 0,
      },
    );

    this.logger.log(
      `Generation triggered for project ${projectId} with ${scenesToCreate.length} scenes using connection ${connectionId}`,
    );

    return {
      project: updated,
      message: 'Video generation started. Scenes are queued for rendering.',
    };
  }
}
