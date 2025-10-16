import { CreateProfileDto, Profile, ProfileMetadata } from "../types";

export interface IMetadataRepository {
  createProfile(profile: CreateProfileDto): Promise<Profile>;
  getProfileById(id: string): Promise<Profile | null>;
  listProfiles(
    page?: number,
    limit?: number
  ): Promise<{ profiles: Profile[]; total: number }>;
  getProfileMetadata(id: string): Promise<ProfileMetadata | null>;
  updateProfile(
    id: string,
    updates: Partial<Omit<Profile, "id" | "created_at">>
  ): Promise<Profile>;
  deleteProfile(id: string): Promise<void>;
}
