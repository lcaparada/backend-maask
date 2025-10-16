import { Readable } from "stream";
import { supabase, supabaseConfig } from "../config";

export class StorageService {
  private readonly bucket: string;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor() {
    this.bucket = supabaseConfig.bucket;
    this.supabaseUrl = process.env.SUPABASE_URL!;
    this.supabaseKey = process.env.SUPABASE_KEY!;
  }

  async uploadFile(
    path: string,
    fileStream: Readable
  ): Promise<{ path: string; publicUrl: string | null }> {
    const url = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.supabaseKey}`,
      },
      body: fileStream as unknown as ReadableStream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Upload failed");
      throw new Error(`Failed to upload file: ${errorText}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      path,
      publicUrl: urlData?.publicUrl || null,
    };
  }

  async downloadFile(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from download");
    }

    return data;
  }

  async createSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("No signed URL returned");
    }

    return data.signedUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage.from(this.bucket).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async listFiles(prefix: string = "", limit: number = 100): Promise<any[]> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .list(prefix, {
        limit,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .download(path);

      return !error && !!data;
    } catch {
      return false;
    }
  }
}
