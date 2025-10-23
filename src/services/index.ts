// Services - Export apenas as classes
export { MetadataService } from "./metadata.service";
export { StorageService } from "./storage.service";
export { EncryptionService } from "./encryption.service";
export { ProfileService } from "./profile.service";
export type { CryptoMetadata } from "./encryption.service";

// Re-export utils for backward compatibility
export { ByteCounterStream } from "../utils/byte-counter-stream";
