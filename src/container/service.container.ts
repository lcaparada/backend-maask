import {
  EncryptionService,
  MetadataService,
  StorageService,
} from "../services";

class ServiceContainer {
  private static instance: ServiceContainer;

  public readonly metadataService: MetadataService;
  public readonly storageService: StorageService;
  public readonly encryptionService: EncryptionService;

  private constructor() {
    this.metadataService = new MetadataService();
    this.storageService = new StorageService();
    this.encryptionService = new EncryptionService();
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
