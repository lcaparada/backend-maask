export interface Profile {
  id: string;
  name: string;
  original_name: string;
  size: number;
  encrypted_size: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileDto {
  name: string;
  original_name: string;
  size: number;
  encrypted_size: number;
  storage_path: string;
}

export interface ProfileMetadata {
  id: string;
  name: string;
  original_name: string;
  size: number;
  encrypted_size: number;
  created_at: string;
  updated_at: string;
}
