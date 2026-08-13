import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProjectFormDialog from '../components/project/ProjectFormDialog';
import { projectApi } from '../api/projectApi';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../types';

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = () => {
    setLoading(true);
    projectApi.list('진행중').then(setProjects).finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight={700}>프로젝트</Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>프로젝트 등록</Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', pt: 6 }}>진행중인 프로젝트가 없습니다.</Typography>
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell>코드</TableCell>
                  <TableCell>프로젝트명</TableCell>
                  <TableCell>유형</TableCell>
                  <TableCell>PM</TableCell>
                  <TableCell align="center">팀원</TableCell>
                  <TableCell>마감예정일</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                    <TableCell><Typography variant="body2" color="text.secondary">{p.code}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                    <TableCell>{p.type_name ? <Chip size="small" label={p.type_name} sx={{ height: 20, fontSize: 11 }} /> : '-'}</TableCell>
                    <TableCell>{p.pm_name ?? '-'}</TableCell>
                    <TableCell align="center">{p.member_count ?? 0}</TableCell>
                    <TableCell>{p.end_date ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>

      <ProjectFormDialog
        open={formOpen}
        initial={null}
        onClose={() => setFormOpen(false)}
        onSaved={() => load()}
      />
    </AppLayout>
  );
};

export default ProjectListPage;
