export { ProfileController } from "./profile.controller";

import { serviceContainer } from "../container";

import { ProfileController } from "./profile.controller";

export const profileController = new ProfileController(
  serviceContainer.profileService
);
