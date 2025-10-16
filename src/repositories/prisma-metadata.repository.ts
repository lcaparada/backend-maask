import { IMetadataRepository } from "../interfaces";
import { prisma } from "../lib/prisma";
import { CreateProfileDto, Profile, ProfileMetadata } from "../types";

export class PrismaMetadataRepository implements IMetadataRepository {
  async createProfile(profile: CreateProfileDto): Promise<Profile> {
    const created = await prisma.profile.create({
      data: {
        name: profile.name,
        originalName: profile.original_name,
        size: BigInt(profile.size),
        encryptedSize: BigInt(profile.encrypted_size),
        storagePath: profile.storage_path,
      },
    });

    return this.toDomain(created);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const found = await prisma.profile.findUnique({ where: { id } });
    return found ? this.toDomain(found) : null;
  }

  async listProfiles(
    page: number = 1,
    limit: number = 10
  ): Promise<{ profiles: Profile[]; total: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.profile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.profile.count(),
    ]);

    return {
      profiles: items.map((item) => this.toDomain(item)),
      total,
    };
  }

  async getProfileMetadata(id: string): Promise<ProfileMetadata | null> {
    const found = await prisma.profile.findUnique({ where: { id } });

    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      original_name: found.originalName,
      size: Number(found.size),
      encrypted_size: Number(found.encryptedSize),
      created_at: found.createdAt.toISOString(),
      updated_at: found.updatedAt.toISOString(),
    };
  }

  async updateProfile(
    id: string,
    updates: Partial<Omit<Profile, "id" | "created_at">>
  ): Promise<Profile> {
    const updated = await prisma.profile.update({
      where: { id },
      data: {
        name: updates.name,
        originalName: updates.original_name,
        size: updates.size ? BigInt(updates.size) : undefined,
        encryptedSize: updates.encrypted_size
          ? BigInt(updates.encrypted_size)
          : undefined,
        storagePath: updates.storage_path,
      },
    });

    return this.toDomain(updated);
  }

  async deleteProfile(id: string): Promise<void> {
    await prisma.profile.delete({ where: { id } });
  }

  private toDomain(prismaProfile: any): Profile {
    return {
      id: prismaProfile.id,
      name: prismaProfile.name,
      original_name: prismaProfile.originalName,
      size: Number(prismaProfile.size),
      encrypted_size: Number(prismaProfile.encryptedSize),
      storage_path: prismaProfile.storagePath,
      created_at: prismaProfile.createdAt.toISOString(),
      updated_at: prismaProfile.updatedAt.toISOString(),
    };
  }
}
