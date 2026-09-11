export type ExpertiseLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export interface User {
  id: string;
  email: string;
  expertise_level: ExpertiseLevel;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface DatasetUploadResult {
  dataset_id: string;
  name: string;
  version: number;
  sha256_hash: string;
  row_count: number;
  column_count: number;
  candidate_target_columns: string[];
  blockchain_status: "PENDING" | "CONFIRMED" | "FAILED";
  note: string;
}
