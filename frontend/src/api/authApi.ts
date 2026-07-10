import client from './client';
import type { AuthUser } from '../types';

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await client.post('/api/v1/auth/login', { username, password });
    return res.data as { access_token: string };
  },
  me: async () => {
    const res = await client.get('/api/v1/auth/me');
    return res.data as AuthUser;
  },
  changePassword: async (current_password: string, new_password: string) => {
    await client.put('/api/v1/auth/change-password', { current_password, new_password });
  },
};
