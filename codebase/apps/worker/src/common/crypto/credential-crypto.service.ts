import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'crypto';
import type {
  EncryptedCredentialEnvelope,
  DecryptedCredentials,
} from '@videoforge/shared-types';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CredentialCryptoService {
  private readonly logger = new Logger(CredentialCryptoService.name);
  private readonly encryptionKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const hexKey = this.config.get<string>('CREDENTIAL_ENCRYPTION_KEY', '');
    if (!hexKey || hexKey.length < 32) {
      throw new Error(
        'CREDENTIAL_ENCRYPTION_KEY must be set and at least 32 characters',
      );
    }
    this.encryptionKey = Buffer.from(hexKey.padEnd(64, '0').slice(0, 64), 'hex');
  }

  /**
   * Decrypts credentials strictly inside the worker process immediately before provider API calls.
   */
  decrypt(envelope: EncryptedCredentialEnvelope): DecryptedCredentials {
    try {
      const iv = Buffer.from(envelope.iv, 'base64');
      const authTag = Buffer.from(envelope.authTag, 'base64');
      const ciphertext = Buffer.from(envelope.ciphertext, 'base64');

      const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf8')) as DecryptedCredentials;
    } catch {
      this.logger.error('Credential decryption failed — envelope corrupted or invalid key');
      throw new Error('Failed to decrypt BYOK credentials');
    }
  }
}
