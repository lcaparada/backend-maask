import { MultipartFile } from "@fastify/multipart";
import { Readable } from "stream";

import { Profile, ProfileMetadata } from "../types/profile.type";
import { ProfileService } from "../services";

export class ProfileController {
  private profileService: ProfileService;

  constructor(profileService?: ProfileService) {
    this.profileService = profileService || new ProfileService();
  }

  async uploadProfile(file: MultipartFile): Promise<Profile> {
    return await this.profileService.uploadProfile(file);
  }

  async downloadProfile(
    id: string,
    decrypt: boolean = true
  ): Promise<{ stream: Readable; filename: string; contentType: string }> {
    return await this.profileService.downloadProfile(id, decrypt);
  }

  async getMetadata(id: string): Promise<ProfileMetadata> {
    return await this.profileService.getMetadata(id);
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
    return await this.profileService.listProfiles(page, limit);
  }

  async deleteProfile(id: string): Promise<void> {
    return await this.profileService.deleteProfile(id);
  }

  async createDownloadUrl(
    id: string,
    expiresIn: number = 3600
  ): Promise<string> {
    return await this.profileService.createDownloadUrl(id, expiresIn);
  }
}
