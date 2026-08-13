import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Checkbox, CircularProgress, Button, Stack,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { permissionApi, type PermMatrix } from '../../api/permissionApi';

type Matrix = Record<string, Record<string, boolean>>;

const PermissionTab: React.FC = () => {
  const [data, setData] = useState<PermMatrix | null>(null);
  const [matrix, setMatrix] = useState<Matrix>({});     // 편집 중 로컬 상태
  const [original, setOriginal] = useState<Matrix>({});  // 저장된 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    permissionApi.get().then((d) => {
      setData(d);
      setMatrix(JSON.parse(JSON.stringify(d.matrix)));
      setOriginal(JSON.parse(JSON.stringify(d.matrix)));
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = (role: string, perm: string, enabled: boolean) => {
    if (role === 'admin') return;  // 관리자는 항상 전체 허용
    setMatrix((m) => ({ ...m, [role]: { ...m[role], [perm]: enabled } }));
  };

  // 변경된 셀 목록
  const changes = useMemo(() => {
    const out: { role: string; permission: string; enabled: boolean }[] = [];
    for (const role of Object.keys(matrix)) {
      if (role === 'admin') continue;
      for (const perm of Object.keys(matrix[role] || {})) {
        if (matrix[role][perm] !== original[role]?.[perm]) {
          out.push({ role, permission: perm, enabled: matrix[role][perm] });
        }
      }
    }
    return out;
  }, [matrix, original]);

  const handleSave = async () => {
    if (changes.length === 0) { alert('변경된 내용이 없습니다.'); return; }
    setSaving(true);
    try {
      for (const c of changes) {
        await permissionApi.set(c.role, c.permission, c.enabled);
      }
      setOriginal(JSON.parse(JSON.stringify(matrix)));
      alert('저장되었습니다.');
    } catch (e: any) {
      alert(e.response?.data?.detail || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (!data) return null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>역할별 권한</Typography>
          <Typography variant="caption" color="text.secondary">
            역할(관리자/PM/팀원)에 기능 권한을 부여합니다. 관리자는 항상 전체 권한을 가집니다.
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || changes.length === 0}>
          저장{changes.length > 0 ? ` (${changes.length})` : ''}
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
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
                      checked={matrix[r.key]?.[p.key] ?? false}
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
        ※ 변경 후 반드시 [저장]을 눌러야 반영됩니다. (실제 접근 제어 실시간 적용은 순차 반영 예정)
      </Typography>
    </Box>
  );
};

export default PermissionTab;
