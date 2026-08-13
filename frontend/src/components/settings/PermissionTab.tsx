import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox, CircularProgress,
} from '@mui/material';
import { permissionApi, type PermMatrix } from '../../api/permissionApi';

const PermissionTab: React.FC = () => {
  const [data, setData] = useState<PermMatrix | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    permissionApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  const toggle = async (role: string, perm: string, enabled: boolean) => {
    // 관리자 권한은 항상 전체 허용 → 변경 불가
    if (role === 'admin') return;
    const updated = await permissionApi.set(role, perm, enabled);
    setData(updated);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (!data) return null;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>역할별 권한</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        역할(관리자/PM/팀원)에 기능 권한을 부여합니다. 관리자는 항상 전체 권한을 가집니다.
      </Typography>
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>권한</TableCell>
              {data.roles.map((r) => (
                <TableCell key={r.key} align="center" sx={{ fontWeight: 600 }}>{r.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.permissions.map((p) => (
              <TableRow key={p.key} hover>
                <TableCell>{p.label}</TableCell>
                {data.roles.map((r) => (
                  <TableCell key={r.key} align="center">
                    <Checkbox
                      size="small"
                      checked={data.matrix[r.key]?.[p.key] ?? false}
                      disabled={r.key === 'admin'}
                      onChange={(e) => toggle(r.key, p.key, e.target.checked)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
        ※ 현재 실제 접근 제어는 역할 기반(관리자/담당 PM)으로 동작하며, 이 설정은 저장됩니다. 세부 권한의 실시간 적용은 순차 반영 예정입니다.
      </Typography>
    </Box>
  );
};

export default PermissionTab;
