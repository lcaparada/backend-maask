import { CreateProfileDto, Profile, ProfileMetadata } from "../types";
import { metadataRepository } from "../factories/metadata.factory";

export class MetadataService {
  async createProfile(profile: CreateProfileDto): Promise<Profile> {
    return await metadataRepository.createProfile(profile);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    return await metadataRepository.getProfileById(id);
  }

  async listProfiles(
    page: number = 1,
    limit: number = 10
  ): Promise<{ profiles: Profile[]; total: number }> {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;

    return await metadataRepository.listProfiles(page, limit);
  }

  async getProfileMetadata(id: string): Promise<ProfileMetadata | null> {
    return await metadataRepository.getProfileMetadata(id);
  }

  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, "id" | "created_at">>
  ): Promise<Profile> {
    const exists = await metadataRepository.getProfileById(id);
    if (!exists) {
      throw new Error(`Profile ${id} not found`);
    }

    return await metadataRepository.updateProfile(id, updates);
  }

  async deleteProfile(id: string): Promise<void> {
    const exists = await metadataRepository.getProfileById(id);
    if (!exists) {
      throw new Error(`Profile ${id} not found`);
    }

    await metadataRepository.deleteProfile(id);
  }

  async deleteProfileMetadata(id: string): Promise<void> {
    return this.deleteProfile(id);
  }
}
