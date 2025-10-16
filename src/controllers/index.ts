// Export controllers
export { ProfileController } from "./profile.controller";

// Import services from container
import { serviceContainer } from "../container";

// Import controllers
import { ProfileController } from "./profile.controller";

// Initialize controllers with injected dependencies
export const profileController = new ProfileController(
  serviceContainer.metadataService,
  serviceContainer.storageService,
  serviceContainer.encryptionService
);
