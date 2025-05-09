import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
    error: string
  }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
}

export type ContentItem = {
  type: 'paragraph' | 'list' | 'quote' | 'image';
  content?: string;  // For paragraph type only
  list?: string[];   // For list type
  quote?: string;    // For quote type
  imagePrompt?: string; // For image type
  imageUrl?: string;  // For image type - will be populated after generation
};

export type Slide = {
  title: string;
  type: 'title' | 'overview' | 'detail' | 'comparison' | 'statistics' | 'case-study' | 'conclusion';
  content: ContentItem[];
  contentType: string; // Allow any string for contentType
};