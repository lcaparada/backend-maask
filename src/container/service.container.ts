import {
  EncryptionService,
  MetadataService,
  StorageService,
  ProfileService,
} from "../services";

class ServiceContainer {
  private static instance: ServiceContainer;

  public readonly metadataService: MetadataService;
  public readonly storageService: StorageService;
  public readonly encryptionService: EncryptionService;
  public readonly profileService: ProfileService;

  private constructor() {
    this.metadataService = new MetadataService();
    this.storageService = new StorageService();
    this.encryptionService = new EncryptionService();
    this.profileService = new ProfileService(
      this.metadataService,
      this.storageService,
      this.encryptionService
    );
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public static reset(): void {
    ServiceContainer.instance = null as any;
  }
}

export const serviceContainer = ServiceContainer.getInstance();

export const metadataService = serviceContainer.metadataService;
export const storageService = serviceContainer.storageService;
export const encryptionService = serviceContainer.encryptionService;
export const profileService = serviceContainer.profileService;
