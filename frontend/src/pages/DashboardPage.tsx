import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Stack, Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardResponse } from '../types';

const StatCard: React.FC<{ label: string; value: number | string; color?: string }> = ({ label, value, color }) => (
  <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight={700} color={color ?? 'text.primary'}>{value}</Typography>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Paper>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  const activeCount = data?.by_status.find((s) => s.name === '진행중')?.count ?? 0;
  const doneCount = data?.by_status.find((s) => s.name === '완료')?.count ?? 0;

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>프로젝트 대시보드</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
        ) : !data ? null : (
          <>
            {/* 요약 통계 */}
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={6} md={3}><StatCard label="전체 프로젝트" value={data.total} /></Grid>
              <Grid item xs={6} md={3}><StatCard label="진행중" value={activeCount} color="#3B82F6" /></Grid>
              <Grid item xs={6} md={3}><StatCard label="완료(종료)" value={doneCount} color="#64748B" /></Grid>
              <Grid item xs={6} md={3}>
                <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">유형별</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.5 }}>
                    {data.by_type.map((t) => <Chip key={t.name} size="small" label={`${t.name} ${t.count}`} />)}
                    {data.by_type.length === 0 && <Typography variant="body2" color="text.disabled">-</Typography>}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }}><Typography variant="body2" color="text.secondary">진행중 프로젝트</Typography></Divider>

            {/* 진행중 프로젝트 카드 */}
            {data.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 6 }}>진행중인 프로젝트가 없습니다.</Typography>
            ) : (
              <Grid container spacing={2}>
                {data.items.map((p) => (
                  <Grid item xs={12} sm={6} md={4} key={p.project_id}>
                    <Paper
                      elevation={0}
                      onClick={() => navigate(`/projects/${p.project_id}`)}
                      sx={{
                        border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, height: '100%',
                        cursor: 'pointer', transition: 'all .15s',
                        '&:hover': { borderColor: '#3B82F6', boxShadow: '0 2px 8px rgba(59,130,246,0.15)' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">{p.code}</Typography>
                        {p.type_name && <Chip size="small" label={p.type_name} sx={{ height: 20, fontSize: 11 }} />}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{p.name}</Typography>
                      <Stack spacing={0.3}>
                        <Typography variant="body2" color="text.secondary">PM · {p.pm_name ?? '미지정'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          팀원 {p.member_count}명 {p.member_names.length > 0 ? `· ${p.member_names.slice(0, 3).join(', ')}${p.member_names.length > 3 ? ' 외' : ''}` : ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">마감 · {p.end_date ?? '-'}</Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>
    </AppLayout>
  );
};

export default DashboardPage;
