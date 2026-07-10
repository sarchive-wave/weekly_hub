import client from './client';
import type { Project } from '../types';

export const projectApi = {
  list: async () => {
    const res = await client.get('/api/v1/projects');
    return res.data as Project[];
  },
  create: async (name: string) => {
    const res = await client.post('/api/v1/projects', { name });
    return res.data as Project;
  },
  update: async (id: number, name: string) => {
    const res = await client.put(`/api/v1/projects/${id}`, { name });
    return res.data as Project;
  },
  delete: async (id: number) => {
    await client.delete(`/api/v1/projects/${id}`);
  },
  reorder: async (ids: number[]) => {
    await client.put('/api/v1/projects/reorder', { ids });
  },
};
