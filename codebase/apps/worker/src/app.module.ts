import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkerProjectSchema,
  WorkerSceneSchema,
  WorkerProviderConnectionSchema,
  WorkerMediaAssetSchema,
  WorkerJobSchema,
} from './schemas/worker-models';
import { CredentialCryptoService } from './common/crypto/credential-crypto.service';
import { S3Service } from './common/storage/s3.service';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'MONGODB_URI',
          'mongodb://videoforge:videoforge_secret@localhost:27017/videoforge?authSource=admin',
        ),
      }),
    }),
    MongooseModule.forFeature([
      { name: 'Project', schema: WorkerProjectSchema },
      { name: 'Scene', schema: WorkerSceneSchema },
      { name: 'ProviderConnection', schema: WorkerProviderConnectionSchema },
      { name: 'MediaAsset', schema: WorkerMediaAssetSchema },
      { name: 'GenerationJob', schema: WorkerJobSchema },
    ]),
  ],
  providers: [CredentialCryptoService, S3Service, WorkerService],
})
export class AppModule {}
