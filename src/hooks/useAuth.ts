import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, completeEmailVerification, getProfile, queryKeys } from '@/lib/api';
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignUp, resetPassword, confirmResetPassword, resendSignUpCode } from 'aws-amplify/auth';
import type { 
  AuthResponse, 
  UserResponse, 
  RegisterRequest, 
  LoginRequest, 
  VerifyEmailRequest,
  RefreshTokenRequest 
} from '@/lib/auth-schema';

// Amplify handles token storage automatically, so we don't need manual storage utilities

async function loadProfile(): Promise<UserResponse> {
  const { userId } = await getCurrentUser();
  return getProfile(userId);
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user using Amplify Auth and user profile endpoint
  const { data: user, isLoading, error } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        // Check if user is authenticated with Amplify
        const amplifyUser = await getCurrentUser();
        if (!amplifyUser) {
          console.log('No valid Amplify session found');
          return null;
        }

        console.log('Amplify user found, fetching user profile...');
        
        try {
          return await getProfile(amplifyUser.userId);
        } catch (error) {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            await signOut();
            return null;
          }
          throw error;
        }
      } catch (error) {
        console.log('No authenticated user found');
        return null;
      }
    },
    retry: false,
  });

  // Register mutation using Amplify Auth
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      // Register with Amplify Auth
      const result = await signUp({
        username: data.email, // Use email as username
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName || '',
            family_name: data.lastName || '',
            preferred_username: data.username || '', // Store username as preferred_username
          },
        },
      });

      console.log('Amplify signup result:', result);

      // Get the Cognito user ID from the Amplify result
      const cognitoUserId = result.userId;
      console.log('Cognito user ID:', cognitoUserId);

      // Registration complete with Amplify - no backend sync needed during registration
      // User will be auto-synced to backend when they first log in after email verification
      return {
        amplifyResult: result,
        needsVerification: !result.isSignUpComplete,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });

  // Login mutation using Amplify Auth
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      try {
        // First, ensure any existing session is cleared
        try {
          await signOut();
          console.log('Cleared existing session before login');
        } catch (signOutError) {
          console.log('No existing session to clear');
        }

        // Login with Amplify Auth
        const amplifyResult = await signIn({
          username: data.email,
          password: data.password,
        });
        
        console.log('Amplify login successful:', amplifyResult);

        // Check if user needs to verify email
        if (amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          console.log('User needs email verification');
          return { 
            user: null, 
            amplifyResult,
            needsVerification: true,
            email: data.email
          };
        }

        // The API creates the profile on first access
        const userData = await loadProfile();
        
        return { 
          user: userData, 
          amplifyResult,
          needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
        };
      } catch (error: any) {
        console.error('Login error:', error);
        
        // Handle specific Cognito errors
        if (error.name === 'UserAlreadyAuthenticatedException' || 
            error.message?.includes('already a signed in user')) {
          // Force sign out and retry
          await signOut();
          console.log('Cleared conflicting session, retrying login...');
          
          const amplifyResult = await signIn({
            username: data.email,
            password: data.password,
          });
          
          // Check if user needs to verify email in retry scenario
          if (amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
            console.log('User needs email verification (retry)');
            return { 
              user: null, 
              amplifyResult,
              needsVerification: true,
              email: data.email
            };
          }
          
          const userData = await loadProfile();
          
          return { 
            user: userData, 
            amplifyResult,
            needsVerification: amplifyResult.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
          };
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });

  // Verify email mutation using Amplify Auth
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailRequest & { password?: string }) => {
      // Set flag early to prevent session cleanup during auto-login process
      sessionStorage.setItem('justVerified', 'true');
      
      // Verify signup with Amplify
      const result = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });
      
      console.log('Amplify verification result:', result);
      
      // If verification successful, auto-login and trigger welcome materials
      if (result.isSignUpComplete) {
        try {
          console.log('Calling verification completion endpoint...');
          
          // Auto-login the user after successful verification
          if (data.password) {
            // Force logout first to ensure clean state
            console.log('🔄 Forcing logout before auto-login to ensure clean session...');
            try {
              await signOut();
            } catch (error) {
              console.log('No active session to clear during verification');
            }
            
            // Proceed with auto-login
            console.log('Auto-logging in user after verification...');
            const signInResult = await signIn({
              username: data.email,
              password: data.password
            });
            console.log('Auto-login successful:', signInResult);
          }
          
          // Small delay to ensure AWS Amplify session is fully established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get user after successful verification to get user ID
          const amplifyUser = await getCurrentUser();
          
          // Detect language from current URL or localStorage
          const currentLanguage = window.location.pathname.includes('/es') ? 'es' : 'en';
          
          // Mark verified; the API sends the welcome email + notification once
          await completeEmailVerification(amplifyUser.userId, currentLanguage);
          console.log('✅ Welcome materials triggered successfully');
        } catch (error) {
          console.warn('Failed to trigger welcome materials:', error);
        }

      }
      
      return {
        amplifyResult: result,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await resetPassword({ username: email });
      console.log('Forgot password initiated:', result);
      return result;
    },
  });

  // Reset password mutation  
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; code: string; newPassword: string }) => {
      const result = await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });
      console.log('Password reset completed:', result);
      return result;
    },
  });

  // Resend verification code mutation
  const resendVerificationCodeMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const result = await resendSignUpCode({ username: data.email });
      console.log('Verification code resent:', result);
      return result;
    },
  });

  // Logout function using Amplify Auth
  const logout = async () => {
    console.log('Logging out user via Amplify');
    await signOut();
    queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    queryClient.clear();
  };

  // Force logout function - cleans sessions without user interaction
  const forceLogout = async () => {
    console.log('Force logging out user to clean stale session');
    try {
      await signOut();
    } catch (error) {
      console.log('Force logout - no active session to clear');
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    queryClient.clear();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    register: registerMutation,
    login: loginMutation,
    verifyEmail: verifyEmailMutation,
    resendVerificationCode: resendVerificationCodeMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    logout,
    forceLogout,
  };
}