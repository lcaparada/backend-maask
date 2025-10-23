import { supabase } from "../config";
import { CreateProfileDto, Profile, ProfileMetadata } from "../types";
import { IMetadataRepository } from "../interfaces/metadata.interface";

export class SupabaseMetadataRepository implements IMetadataRepository {
  private readonly tableName = "profiles";

  async createProfile(profile: CreateProfileDto): Promise<Profile> {
    const insertData = {
      ...(profile.id && { id: profile.id }),
      name: profile.name,
      original_name: profile.original_name,
      size: profile.size,
      encrypted_size: profile.encrypted_size,
      storage_path: profile.storage_path,
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .insert([insertData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data as Profile;
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data as Profile;
  }

  async listProfiles(
    page: number = 1,
    limit: number = 10
  ): Promise<{ profiles: Profile[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from(this.tableName)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to list profiles: ${error.message}`);
    }

    return {
      profiles: (data as Profile[]) || [],
      total: count || 0,
    };
  }

  async getProfileMetadata(id: string): Promise<ProfileMetadata | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(
        "id, name, original_name, size, encrypted_size, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get profile metadata: ${error.message}`);
    }

    return data as ProfileMetadata;
  }

  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, "id" | "created_at">>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data as Profile;
  }

  async deleteProfile(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
  }
}
