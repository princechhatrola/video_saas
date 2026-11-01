import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { EncryptedCredentialEnvelope, DecryptedCredentials } from '@videoforge/shared-types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce recommended for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_VERSION = 'v1';

/**
 * CredentialCryptoService
 *
 * Implements AES-256-GCM envelope encryption for BYOK provider credentials.
 * The encryption key is loaded from CREDENTIAL_ENCRYPTION_KEY env variable.
 * In production, use AWS KMS to protect this key (wrap/unwrap pattern).
 *
 * CRITICAL SECURITY RULES:
 * - Never log plaintextCredentials or ciphertext
 * - Never return decrypted credentials to the HTTP layer
 * - Only decrypt inside the worker process immediately before provider call
 * - Rotate keys using re-encrypt path without storing plaintext
 */
@Injectable()
export class CredentialCryptoService {
  private readonly logger = new Logger(CredentialCryptoService.name);
  private readonly encryptionKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const hexKey = this.config.get<string>('CREDENTIAL_ENCRYPTION_KEY');
    if (!hexKey || hexKey.length < 32) {
      throw new Error(
        'CREDENTIAL_ENCRYPTION_KEY must be set and at least 32 characters',
      );
    }
    // Derive 32 bytes from the hex key
    this.encryptionKey = Buffer.from(hexKey.padEnd(64, '0').slice(0, 64), 'hex');
  }

  /**
   * Encrypts credentials into an envelope suitable for MongoDB storage.
   * Returns ciphertext + iv + authTag + keyVersion.
   * The plaintext is NEVER stored.
   */
  encrypt(credentials: DecryptedCredentials): EncryptedCredentialEnvelope {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const plaintext = JSON.stringify(credentials);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyVersion: KEY_VERSION,
    };
  }

  /**
   * Decrypts an envelope back into credentials.
   * Should ONLY be called inside the worker process, never in HTTP handlers.
   * Returns null if decryption fails (e.g. tampered data).
   */
  decrypt(envelope: EncryptedCredentialEnvelope): DecryptedCredentials | null {
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
      // Do not log the error details to avoid leaking timing information
      this.logger.warn('Credential decryption failed — envelope may be tampered');
      return null;
    }
  }

  /**
   * Masks an API key for display in the UI.
   * Example: "sk-AbCdEfGhIjKlMn" → "sk-****klmn"
   */
  maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '****';
    }
    const prefix = apiKey.slice(0, 3);
    const suffix = apiKey.slice(-4);
    return `${prefix}-****${suffix}`;
  }

  maskKey(apiKey: string): string {
    return this.maskApiKey(apiKey);
  }
}
