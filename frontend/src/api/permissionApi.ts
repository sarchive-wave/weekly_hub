import client from './client';

export interface PermMatrix {
  roles: { key: string; label: string }[];
  permissions: { key: string; label: string }[];
  matrix: Record<string, Record<string, boolean>>;
}

export const permissionApi = {
  get: async () => {
    const res = await client.get('/api/v1/permissions');
    return res.data as PermMatrix;
  },
  set: async (role: string, permission: string, enabled: boolean) => {
    const res = await client.put('/api/v1/permissions', { role, permission, enabled });
    return res.data as PermMatrix;
  },
};
