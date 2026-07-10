import client from './client';
import type { Report, EntryData } from '../types';

export const reportApi = {
  get: async (weekId: number, userId: number) => {
    const res = await client.get(`/api/v1/reports/${weekId}/${userId}`);
    return res.data as Report;
  },
  save: async (weekId: number, userId: number, entries: EntryData[]) => {
    const res = await client.put(`/api/v1/reports/${weekId}/${userId}`, { entries });
    return res.data as Report;
  },
  updateStatus: async (weekId: number, userId: number, status: string) => {
    const res = await client.patch(`/api/v1/reports/${weekId}/${userId}/status`, { status });
    return res.data as Report;
  },
};
