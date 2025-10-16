import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { Transform } from "stream";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

export interface CryptoMetadata {
  salt: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export class EncryptionService {
  private readonly algorithm = ALGORITHM;
  private readonly encryptionKey: string;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        "ENCRYPTION_KEY must be defined in environment variables"
      );
    }
    this.encryptionKey = key;
  }

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  }

  async createEncryptStream(): Promise<{
    stream: Transform;
    salt: Buffer;
    iv: Buffer;
    getAuthTag: () => Buffer;
  }> {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = await this.deriveKey(this.encryptionKey, salt);

    const cipher = createCipheriv(this.algorithm, key, iv);

    let authTag: Buffer | null = null;

    cipher.on("end", () => {
      authTag = cipher.getAuthTag();
    });

    return {
      stream: cipher,
      salt,
      iv,
      getAuthTag: () => {
        if (!authTag) {
          cipher.end();
          authTag = cipher.getAuthTag();
        }
        return authTag;
      },
    };
  }

  async createDecryptStream(
    saltOrMetadata: Buffer | CryptoMetadata,
    iv?: Buffer,
    authTag?: Buffer
  ): Promise<Transform> {
    let metadata: CryptoMetadata;

    if (Buffer.isBuffer(saltOrMetadata)) {
      metadata = {
        salt: saltOrMetadata,
        iv: iv!,
        authTag: authTag!,
      };
    } else {
      metadata = saltOrMetadata;
    }

    const key = await this.deriveKey(this.encryptionKey, metadata.salt);
    const decipher = createDecipheriv(this.algorithm, key, metadata.iv);
    decipher.setAuthTag(metadata.authTag);
    return decipher;
  }

  serializeCryptoMetadata(
    saltOrMetadata: Buffer | CryptoMetadata,
    iv?: Buffer,
    authTag?: Buffer
  ): string {
    let metadata: CryptoMetadata;

    if (Buffer.isBuffer(saltOrMetadata)) {
      metadata = {
        salt: saltOrMetadata,
        iv: iv!,
        authTag: authTag!,
      };
    } else {
      metadata = saltOrMetadata;
    }

    return JSON.stringify({
      salt: metadata.salt.toString("base64"),
      iv: metadata.iv.toString("base64"),
      authTag: metadata.authTag.toString("base64"),
    });
  }

  deserializeCryptoMetadata(serialized: string): CryptoMetadata {
    const parsed = JSON.parse(serialized);
    return {
      salt: Buffer.from(parsed.salt, "base64"),
      iv: Buffer.from(parsed.iv, "base64"),
      authTag: Buffer.from(parsed.authTag, "base64"),
    };
  }
}
