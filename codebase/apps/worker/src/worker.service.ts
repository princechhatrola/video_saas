import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CredentialCryptoService } from './common/crypto/credential-crypto.service';
import { S3Service } from './common/storage/s3.service';
import { VideoProviderAdapterFactory } from '@videoforge/provider-sdk';
import {
  AssetType,
  ProjectStatus,
  SceneStatus,
} from '@videoforge/shared-types';

@Injectable()
export class WorkerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WorkerService.name);
  private isProcessing = false;

  constructor(
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel('Scene') private readonly sceneModel: Model<any>,
    @InjectModel('ProviderConnection')
    private readonly connectionModel: Model<any>,
    @InjectModel('MediaAsset') private readonly assetModel: Model<any>,
    private readonly cryptoService: CredentialCryptoService,
    private readonly s3Service: S3Service,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('VideoForge AI Worker initialized. Starting polling loop...');
    setInterval(() => this.processQueuedScenes(), 5000);
  }

  /**
   * Main pipeline loop: processes queued video scenes
   */
  async processQueuedScenes() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Pick a queued scene
      const scene = await this.sceneModel
        .findOne({ status: SceneStatus.QUEUED })
        .sort({ createdAt: 1 })
        .exec();

      if (!scene) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(
        `Processing Scene #${scene.sceneNumber} for Project ${scene.projectId}...`,
      );

      // Mark scene as SUBMITTED to prevent duplicate pick-up
      scene.status = SceneStatus.SUBMITTED;
      scene.attempts = (scene.attempts || 0) + 1;
      await scene.save();

      // 2. Load provider connection with decrypted credentials (BYOK)
      const connection = await this.connectionModel
        .findById(scene.connectionId)
        .select('+encryptedCredentials')
        .exec();

      if (!connection || !connection.encryptedCredentials) {
        throw new Error('User provider credentials not found or deleted');
      }

      const credentials = this.cryptoService.decrypt(
        connection.encryptedCredentials,
      );

      // 3. Resolve adapter
      const adapter = VideoProviderAdapterFactory.getAdapter(scene.providerId);
      const project = await this.projectModel.findById(scene.projectId).exec();
      const aspectRatio = project?.settings?.aspectRatio || '9:16';

      // 4. Submit generation request
      this.logger.log(
        `Submitting generation prompt to ${scene.providerId} (${scene.modelId})...`,
      );

      const idempotencyKey = `proj_${scene.projectId}_sc_${scene.sceneNumber}_att_${scene.attempts}`;
      const accepted = await adapter.generateVideo(
        credentials,
        {
          modelId: scene.modelId,
          prompt: scene.visualPrompt,
          negativePrompt: scene.negativePrompt,
          durationSeconds: scene.plannedDurationSeconds,
          aspectRatio,
        },
        idempotencyKey,
      );

      scene.providerJobId = accepted.providerJobId;
      scene.status = SceneStatus.PROCESSING;
      await scene.save();

      this.logger.log(
        `Scene #${scene.sceneNumber} accepted by provider. Job ID: ${accepted.providerJobId}. Polling for completion...`,
      );

      // 5. Poll provider for video completion
      let isCompleted = false;
      let outputVideoUrl = '';
      const maxPollAttempts = 40;
      let pollAttempt = 0;

      while (!isCompleted && pollAttempt < maxPollAttempts) {
        pollAttempt++;
        await new Promise((r) => setTimeout(r, 6000));

        const statusResult = await adapter.getGenerationStatus(
          credentials,
          accepted.providerJobId,
        );

        if (statusResult.state === 'completed' && statusResult.outputUrl) {
          isCompleted = true;
          outputVideoUrl = statusResult.outputUrl;
          break;
        } else if (statusResult.state === 'failed') {
          throw new Error(
            statusResult.errorMessage || 'Video generation failed at provider',
          );
        }

        this.logger.log(
          `Polling Scene #${scene.sceneNumber} (${pollAttempt}/${maxPollAttempts}) - State: ${statusResult.state}, Progress: ${statusResult.progress || 0}%`,
        );
      }

      if (!isCompleted || !outputVideoUrl) {
        throw new Error('Video generation timed out while waiting for provider');
      }

      // 6. Download provider video and upload to SaaS Amazon S3 bucket
      this.logger.log(
        `Downloading moving clip for Scene #${scene.sceneNumber} and saving to S3...`,
      );

      const s3Key = `projects/${scene.projectId}/scenes/scene_${scene.sceneNumber}_${Date.now()}.mp4`;
      const s3Result = await this.s3Service.downloadAndUpload(
        outputVideoUrl,
        s3Key,
      );

      // 7. Record Media Asset
      const asset = await this.assetModel.create({
        userId: scene.userId,
        projectId: scene.projectId,
        sceneId: scene._id,
        type: AssetType.SCENE_VIDEO,
        storage: s3Result.storage,
        mimeType: 'video/mp4',
        sizeBytes: s3Result.sizeBytes,
      });

      // 8. Update Scene state
      scene.status = SceneStatus.STORED;
      scene.assetId = asset._id.toString();
      scene.videoClipUrl = s3Result.publicUrl;
      await scene.save();

      this.logger.log(
        `Scene #${scene.sceneNumber} successfully stored at: ${s3Result.publicUrl}`,
      );

      // 9. Update Project progress & check if all scenes completed
      await this.checkProjectCompletion(scene.projectId);
    } catch (err: any) {
      this.logger.error(`Error processing scene: ${err.message}`, err.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async checkProjectCompletion(projectId: string) {
    const scenes = await this.sceneModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .exec();

    const total = scenes.length;
    const completed = scenes.filter((s) => s.status === SceneStatus.STORED).length;
    const failed = scenes.filter((s) => s.status === SceneStatus.FAILED).length;

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) return;

    project.completedScenes = completed;
    project.failedScenes = failed;

    if (completed === total && total > 0) {
      this.logger.log(`All ${total} scenes completed for Project ${projectId}! Finalizing video...`);
      // Use the completed clip as the primary video output url
      const finalClip = scenes[0]?.videoClipUrl;
      project.status = ProjectStatus.COMPLETED;
      project.finalVideoUrl = finalClip;
      project.completedAt = new Date();
    }

    await project.save();
  }
}
