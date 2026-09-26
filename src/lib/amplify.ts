import { Amplify } from 'aws-amplify';
import { EVENTS_ENDPOINT } from './config';

const amplifyConfig = {
  // Realtime hints subscribe with the user's ID token (the channel must be their own sub).
  ...(EVENTS_ENDPOINT
    ? { API: { Events: { endpoint: EVENTS_ENDPOINT, region: import.meta.env.VITE_AWS_REGION || 'us-east-1', defaultAuthMode: 'userPool' as const } } }
    : {}),
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      userPoolId: import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID!,
      userPoolClientId: import.meta.env.VITE_AWS_COGNITO_CLIENT_ID!,
      signUpVerificationMethod: 'code' as const, // 'code' | 'link'
      loginWith: {
        email: true,
        username: false,
      },
    },
  },
};

// Validate required environment variables
if (!amplifyConfig.Auth.Cognito.userPoolId) {
  throw new Error('Missing required environment variable: VITE_AWS_COGNITO_USER_POOL_ID');
}

if (!amplifyConfig.Auth.Cognito.userPoolClientId) {
  throw new Error('Missing required environment variable: VITE_AWS_COGNITO_CLIENT_ID');
}

// Configure Amplify
Amplify.configure(amplifyConfig);

export { amplifyConfig };
export default Amplify;