import client from './client';
import type { Week, MemberStatus, OverallSummary } from '../types';

export const weekApi = {
  list: async () => {
    const res = await client.get('/api/v1/weeks');
    return res.data as Week[];
  },
  create: async (data: { year: number; month: number; week_num: number; title: string; start_date?: string | null; end_date?: string | null }) => {
    const res = await client.post('/api/v1/weeks', data);
    return res.data as Week;
  },
  delete: async (weekId: number) => {
    await client.delete(`/api/v1/weeks/${weekId}`);
  },
  getMembers: async (weekId: number) => {
    const res = await client.get(`/api/v1/weeks/${weekId}/members`);
    return res.data as MemberStatus[];
  },
  getSummary: async (weekId: number) => {
    const res = await client.get(`/api/v1/weeks/${weekId}/summary`);
    return res.data as OverallSummary;
  },
};
