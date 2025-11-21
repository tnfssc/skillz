import { createAuthClient } from 'better-auth/react';
import { apiKeyClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.DEV ? 'http://localhost:8787' : 'https://skillz.lat',
  plugins: [apiKeyClient()],
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signOut, useSession, apiKey } = authClient;
