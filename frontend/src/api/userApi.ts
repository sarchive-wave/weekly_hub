import client from './client';
import type { User } from '../types';

export const userApi = {
  list: async () => {
    const res = await client.get('/api/v1/users');
    return res.data as User[];
  },
  create: async (data: { username: string; password: string; display_name: string; role: string; position?: string; team?: string }) => {
    const res = await client.post('/api/v1/users', data);
    return res.data as User;
  },
  update: async (id: number, data: { display_name: string; role: string; is_active: boolean; position?: string; team?: string }) => {
    const res = await client.put(`/api/v1/users/${id}`, data);
    return res.data as User;
  },
  delete: async (id: number) => {
    await client.delete(`/api/v1/users/${id}`);
  },
  resetPassword: async (id: number, new_password: string) => {
    await client.post(`/api/v1/users/${id}/reset-password`, { new_password });
  },
  reorder: async (ids: number[]) => {
    await client.put('/api/v1/users/reorder', { ids });
  },
};
