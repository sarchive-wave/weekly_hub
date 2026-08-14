import client from './client';
import type { User } from '../types';

export const userApi = {
  list: async () => {
    const res = await client.get('/api/v1/users');
    return res.data as User[];
  },
  create: async (data: { username: string; password: string; display_name: string; role: string; position?: string; team?: string; in_dashboard?: boolean; in_weekly?: boolean }) => {
    const res = await client.post('/api/v1/users', data);
    return res.data as User;
  },
  update: async (id: number, data: { username: string; display_name: string; role: string; is_active: boolean; position?: string; team?: string; in_dashboard?: boolean; in_weekly?: boolean }) => {
    const res = await client.put(`/api/v1/users/${id}`, data);
    return res.data as User;
  },
  delete: async (id: number) => {   // 소프트 삭제(비활성 처리)
    await client.delete(`/api/v1/users/${id}`);
  },
  activate: async (id: number) => {
    const res = await client.post(`/api/v1/users/${id}/activate`);
    return res.data as User;
  },
  resetPassword: async (id: number, new_password: string) => {
    await client.post(`/api/v1/users/${id}/reset-password`, { new_password });
  },
  reorder: async (ids: number[]) => {
    await client.put('/api/v1/users/reorder', { ids });
  },
};
