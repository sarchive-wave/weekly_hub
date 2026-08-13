import client from './client';
import type { ProjectMeta } from '../types';

// kind: 'type' (유형) | 'status' (상태)
export const metaApi = {
  list: async (kind: string) => {
    const res = await client.get(`/api/v1/project-meta/${kind}`);
    return res.data as ProjectMeta[];
  },
  create: async (kind: string, data: { name: string; sort_order?: number }) => {
    const res = await client.post(`/api/v1/project-meta/${kind}`, data);
    return res.data as ProjectMeta;
  },
  update: async (kind: string, id: number, data: { name: string; sort_order?: number }) => {
    const res = await client.put(`/api/v1/project-meta/${kind}/${id}`, data);
    return res.data as ProjectMeta;
  },
  remove: async (kind: string, id: number) => {
    await client.delete(`/api/v1/project-meta/${kind}/${id}`);
  },
};
