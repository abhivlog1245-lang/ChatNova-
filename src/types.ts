export type ChatMode = "auto" | "ai" | "basic";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  source?: "gemini" | "rule_based";
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: "image" | "video";
}

export interface ServerInfo {
  status: string;
  name: string;
  aiConfigured: boolean;
  model: string;
  imageModel?: string;
  videoModel?: string;
  liveModel?: string;
  version: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
  mode: ChatMode;
}

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
}

