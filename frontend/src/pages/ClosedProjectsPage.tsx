import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { projectApi } from '../api/projectApi';
import type { Project } from '../types';

const ClosedProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.list('완료', 'dashboard').then(setProjects).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>종료 프로젝트</Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 6 }}>종료된 프로젝트가 없습니다.</Typography>
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell>코드</TableCell>
                  <TableCell>프로젝트명</TableCell>
                  <TableCell>유형</TableCell>
                  <TableCell>PM</TableCell>
                  <TableCell>기간</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.code}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                    <TableCell>{p.type_name ? <Chip size="small" label={p.type_name} sx={{ height: 20, fontSize: 11 }} /> : '-'}</TableCell>
                    <TableCell>{p.pm_name ?? '-'}</TableCell>
                    <TableCell>{(p.start_date ?? '-')} ~ {(p.end_date ?? '-')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </AppLayout>
  );
};

export default ClosedProjectsPage;
