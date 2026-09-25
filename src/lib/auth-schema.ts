import { z } from "zod";
import type { Transcription } from "./api-types";

// API Request/Response types
export const registerRequestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const verifyEmailRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const createTranscriptionRequestSchema = z.object({
  videoUrl: z.string().url(),
  transcript: z.string(),
  duration: z.number().positive(),
  wordCount: z.number().positive(),
  processingTime: z.number().positive(),
  accuracy: z.number().min(0).max(100),
});

// Types


export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type CreateTranscriptionRequest = z.infer<typeof createTranscriptionRequestSchema>;

// API Response types
export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  transcriptionsUsed?: number;
  isEmailVerified?: boolean;
  isPro?: boolean;
  languagePreference?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TranscriptionHistoryResponse {
  transcriptions: Transcription[];
  total: number;
  page: number;
  limit: number;
}
