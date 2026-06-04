export interface ToolResultMetadata {
    source: string;
    timestamp: string;
  }
  
  export interface ToolResult<T = unknown> {
    success: boolean;
    data: T | null;
    error?: string;
    metadata?: ToolResultMetadata;
  }