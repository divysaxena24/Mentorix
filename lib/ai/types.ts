export interface GenerateParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  feature?: string; // for caching key
  jsonMode?: boolean; // for JSON object response format
  // additional optional fields can be added as needed
}

export interface UnifiedResponse {
  content: string;
  providerUsed: string;
  modelUsed: string;
  responseTime: number; // ms
}

export interface AIProvider {
  name: string;
  generate(params: GenerateParams): Promise<UnifiedResponse>;
}
