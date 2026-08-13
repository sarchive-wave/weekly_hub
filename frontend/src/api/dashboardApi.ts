import client from './client';
import type { DashboardResponse } from '../types';

export const dashboardApi = {
  get: async () => {
    const res = await client.get('/api/v1/dashboard');
    return res.data as DashboardResponse;
  },
};
