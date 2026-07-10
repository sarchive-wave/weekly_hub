import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { weekApi } from '../../api/weekApi';
import type { OverallSummary } from '../../types';

interface Props {
  weekId: number;
  title: string;
}

const OverallReport: React.FC<Props> = ({ weekId, title }) => {
  const [summary, setSummary] = useState<OverallSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    weekApi.getSummary(weekId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [weekId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>{title} 전체 주간보고</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        팀 전체 업무를 프로젝트별로 취합한 내용입니다.
      </Typography>
      {summary?.projects.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          아직 작성된 주간보고가 없습니다.
        </Typography>
      )}
      {summary?.projects.map((project) => (
        <Paper key={project.project_id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#1E293B', px: 2.5, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600} color="white">{project.project_name}</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <Box sx={{ p: 2.5, borderRight: '1px solid #E2E8F0' }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                금주 업무
              </Typography>
              <Box sx={{ mt: 1 }}>
                {project.current_work.length === 0
                  ? <Typography variant="body2" color="text.disabled">-</Typography>
                  : project.current_work.map((w, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>• {w}</Typography>
                  ))}
              </Box>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                차주 업무
              </Typography>
              <Box sx={{ mt: 1 }}>
                {project.next_work.length === 0
                  ? <Typography variant="body2" color="text.disabled">-</Typography>
                  : project.next_work.map((w, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>• {w}</Typography>
                  ))}
              </Box>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default OverallReport;
