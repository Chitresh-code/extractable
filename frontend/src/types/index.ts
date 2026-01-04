export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Extraction {
  id: number;
  user_id: number;
  status: "pending" | "processing" | "completed" | "failed";
  input_type?: string;
  input_filename?: string;
  columns_requested?: string[];
  multiple_tables: boolean;
  output_format: "json" | "csv" | "excel";
  complexity: "simple" | "regular" | "complex";
  priority: "high" | "medium" | "low";
  table_data?: Record<string, unknown>; // Final structured table data (JSON)
  llm_extraction_output?: Record<string, unknown>;
  llm_validation_output?: Record<string, unknown>;
  llm_final_output?: {
    text?: string;
    timing_metrics?: {
      step_1_file_processing?: number;
      step_2_extraction?: number;
      step_3_validation?: number;
      step_4_finalization?: number;
      step_5_storage?: number;
      total_time?: number;
    };
  };
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface ExtractionListResponse {
  items: Extraction[];
  total: number;
  page: number;
  page_size: number;
}
