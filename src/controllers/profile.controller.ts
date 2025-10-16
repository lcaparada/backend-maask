import { MultipartFile } from "@fastify/multipart";
import { pipeline } from "stream/promises";
import { randomUUID } from "crypto";
import { Readable, PassThrough } from "stream";

import { Profile, ProfileMetadata } from "../types/profile.type";
import {
  MetadataService,
  StorageService,
  EncryptionService,
} from "../services";
import { ByteCounterStream, PerformanceLogger } from "../utils";

export class ProfileController {
  private metadataService: MetadataService;
  private storageService: StorageService;
  private encryptionService: EncryptionService;

  constructor(
    metadataService?: MetadataService,
    storageService?: StorageService,
    encryptionService?: EncryptionService
  ) {
    this.metadataService = metadataService || new MetadataService();
    this.storageService = storageService || new StorageService();
    this.encryptionService = encryptionService || new EncryptionService();
  }

  async uploadProfile(file: MultipartFile): Promise<Profile> {
    const perf = new PerformanceLogger();

    if (!file) throw new Error("No file provided");
    if (
      file.mimetype !== "application/zip" &&
      file.mimetype !== "application/x-zip-compressed"
    )
      throw new Error("Only ZIP files are allowed");

    perf.mark("Validation completed");

    const profileId = randomUUID();
    const originalName = file.filename;
    const storagePath = `profiles/${profileId}.enc`;
    const metadataPath = `profiles/${profileId}.metadata`;

    let uploadedFile = false;
    let uploadedMetadata = false;

    try {
      const {
        stream: encryptStream,
        salt,
        iv,
        getAuthTag,
      } = await this.encryptionService.createEncryptStream();

      perf.mark("Encryption setup");

      const encryptedCounter = new ByteCounterStream();

      const uploadStream = new PassThrough();

      const processingPromise = pipeline(
        file.file,
        encryptStream,
        encryptedCounter,
        uploadStream
      );

      const uploadPromise = this.storageService.uploadFile(
        storagePath,
        uploadStream
      );

      await Promise.all([processingPromise, uploadPromise]);
      uploadedFile = true;

      perf.mark("File uploaded & encrypted");

      const authTag = getAuthTag();

      const cryptoMetadata = this.encryptionService.serializeCryptoMetadata(
        salt,
        iv,
        authTag
      );

      const metadataUploadPromise = this.storageService
        .uploadFile(metadataPath, Readable.from(Buffer.from(cryptoMetadata)))
        .then(() => {
          uploadedMetadata = true;
        });

      const [profile] = await Promise.all([
        this.metadataService.createProfile({
          name: originalName.replace(/\.zip$/i, ""),
          original_name: originalName,
          size: encryptedCounter.byteCount,
          encrypted_size: encryptedCounter.byteCount,
          storage_path: storagePath,
        }),
        metadataUploadPromise,
      ]);

      perf.mark("Metadata + Database (parallel)");
      perf.log();

      return profile;
    } catch (error) {
      if (uploadedFile) {
        await this.storageService.deleteFile(storagePath).catch(() => {});
      }
      if (uploadedMetadata) {
        await this.storageService.deleteFile(metadataPath).catch(() => {});
      }
      throw new Error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async downloadProfile(
    id: string,
    decrypt: boolean = true
  ): Promise<{ stream: Readable; filename: string; contentType: string }> {
    const profile = await this.metadataService.getProfileById(id);

    if (!profile) throw new Error("Profile not found");

    try {
      const fileBlob = await this.storageService.downloadFile(
        profile.storage_path
      );

      if (!decrypt) {
        const stream = new PassThrough();
        const reader = fileBlob.stream().getReader();

        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              stream.push(Buffer.from(value));
            }
            stream.push(null);
          } catch (error) {
            stream.destroy(error as Error);
          }
        })();

        return {
          stream,
          filename: `${profile.name}.enc`,
          contentType: "application/octet-stream",
        };
      }

      const metadataPath = profile.storage_path.replace(".enc", ".metadata");
      const metadataBlob = await this.storageService.downloadFile(metadataPath);
      const metadataBuffer = Buffer.from(await metadataBlob.arrayBuffer());
      const cryptoMetadata = this.encryptionService.deserializeCryptoMetadata(
        metadataBuffer.toString()
      );

      const decryptStream = await this.encryptionService.createDecryptStream(
        cryptoMetadata.salt,
        cryptoMetadata.iv,
        cryptoMetadata.authTag
      );

      const blobStream = new PassThrough();
      const reader = fileBlob.stream().getReader();

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            blobStream.push(Buffer.from(value));
          }
          blobStream.push(null);
        } catch (error) {
          blobStream.destroy(error as Error);
        }
      })();

      const outputStream = blobStream.pipe(decryptStream);

      return {
        stream: outputStream,
        filename: profile.original_name,
        contentType: "application/zip",
      };
    } catch (error) {
      throw new Error(
        `Download failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getMetadata(id: string): Promise<ProfileMetadata> {
    const metadata = await this.metadataService.getProfileMetadata(id);

    if (!metadata) {
      throw new Error("Profile not found");
    }

    return metadata;
  }

  async listProfiles(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    profiles: Profile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { profiles, total } = await this.metadataService.listProfiles(
      page,
      limit
    );

    return {
      profiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = await this.metadataService.getProfileById(id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    try {
      await this.storageService.deleteFile(profile.storage_path);
      await this.storageService.deleteFile(
        profile.storage_path.replace(".enc", ".metadata")
      );

      await this.metadataService.deleteProfileMetadata(id);
    } catch (error) {
      throw new Error(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createDownloadUrl(
    id: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const profile = await this.metadataService.getProfileById(id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    try {
      const signedUrl = await this.storageService.createSignedUrl(
        profile.storage_path,
        expiresIn
      );
      return signedUrl;
    } catch (error) {
      throw new Error(
        `Failed to create download URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
