// Shapes the UI currently consumes (formerly inferred from the server's Drizzle schema).

export interface Transcription {
  id: string;
  userId: string;
  videoUrl: string; // empty for uploaded files
  sourceType: "url" | "upload";
  originalFilename?: string;
  videoTitle?: string;
  transcript: string;
  status: "awaiting_upload" | "pending" | "processing" | "completed" | "failed" | string;
  duration: number;
  wordCount: number;
  processingTime: number;
  accuracy: number;
  errorMessage?: string;
  segments: { start: number; end: number; text: string }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
}
