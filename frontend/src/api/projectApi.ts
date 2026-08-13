import client from './client';
import type { Project, ProjectMember, ProjectLog, ProjectWeeklyItem, ProjectPayload } from '../types';

export const projectApi = {
  list: async (status?: string) => {
    const res = await client.get('/api/v1/projects', { params: status ? { status } : {} });
    return res.data as Project[];
  },
  get: async (id: number) => {
    const res = await client.get(`/api/v1/projects/${id}`);
    return res.data as Project;
  },
  create: async (payload: ProjectPayload) => {
    const res = await client.post('/api/v1/projects', payload);
    return res.data as Project;
  },
  update: async (id: number, payload: Partial<ProjectPayload>) => {
    const res = await client.put(`/api/v1/projects/${id}`, payload);
    return res.data as Project;
  },
  remove: async (id: number) => {
    await client.delete(`/api/v1/projects/${id}`);
  },
  reorder: async (ids: number[]) => {
    await client.put('/api/v1/projects/reorder', { ids });
  },
  complete: async (id: number) => {
    const res = await client.post(`/api/v1/projects/${id}/complete`);
    return res.data as Project;
  },
  reopen: async (id: number) => {
    const res = await client.post(`/api/v1/projects/${id}/reopen`);
    return res.data as Project;
  },
  getMembers: async (id: number) => {
    const res = await client.get(`/api/v1/projects/${id}/members`);
    return res.data as ProjectMember[];
  },
  setMembers: async (id: number, members: { user_id: number; role: string }[]) => {
    const res = await client.put(`/api/v1/projects/${id}/members`, { members });
    return res.data as ProjectMember[];
  },
  getLogs: async (id: number) => {
    const res = await client.get(`/api/v1/projects/${id}/logs`);
    return res.data as ProjectLog[];
  },
  getWeekly: async (id: number) => {
    const res = await client.get(`/api/v1/projects/${id}/weekly`);
    return res.data as ProjectWeeklyItem[];
  },
};
