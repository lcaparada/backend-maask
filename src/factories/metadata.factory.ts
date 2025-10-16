import { IMetadataRepository } from "../interfaces";
import {
  PrismaMetadataRepository,
  SupabaseMetadataRepository,
} from "../repositories";

export class MetadataRepositoryFactory {
  private static instance: IMetadataRepository | null = null;

  static getInstance(): IMetadataRepository {
    if (!this.instance) {
      this.instance = this.create();
    }
    return this.instance;
  }

  private static create(): IMetadataRepository {
    const provider = process.env.METADATA_PROVIDER || "supabase";

    switch (provider) {
      case "prisma":
        console.log("📦 Using Prisma for metadata repository");
        return new PrismaMetadataRepository();

      case "supabase":
      default:
        console.log("📦 Using Supabase for metadata repository");
        return new SupabaseMetadataRepository();
    }
  }

  static reset(): void {
    this.instance = null;
  }

  static setInstance(repository: IMetadataRepository): void {
    this.instance = repository;
  }
}

export const metadataRepository = MetadataRepositoryFactory.getInstance();
