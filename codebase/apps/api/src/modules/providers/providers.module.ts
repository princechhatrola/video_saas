import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProviderConnection,
  ProviderConnectionSchema,
} from './entities/provider-connection.entity';
import {
  ProviderCatalog,
  ProviderCatalogSchema,
} from './provider-catalog/entities/provider-catalog.entity';
import {
  ProviderModel,
  ProviderModelSchema,
} from './provider-catalog/entities/provider-model.entity';
import { ProviderConnectionsRepository } from './provider-connections.repository';
import { ProviderCatalogRepository } from './provider-catalog/provider-catalog.repository';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { CredentialCryptoService } from '../../common/crypto/credential-crypto.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderConnection.name, schema: ProviderConnectionSchema },
      { name: ProviderCatalog.name, schema: ProviderCatalogSchema },
      { name: ProviderModel.name, schema: ProviderModelSchema },
    ]),
    AuditModule,
  ],
  providers: [
    ProviderConnectionsRepository,
    ProviderCatalogRepository,
    CredentialCryptoService,
    ProvidersService,
  ],
  controllers: [ProvidersController],
  exports: [
    ProvidersService,
    ProviderConnectionsRepository,
    ProviderCatalogRepository,
    CredentialCryptoService,
  ],
})
export class ProvidersModule {}
