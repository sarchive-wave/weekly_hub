import React, { useEffect, useState } from 'react';
import {
  Box, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Chip, Stack, Typography, Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import ProjectFormDialog from '../project/ProjectFormDialog';
import MasterTab from './MasterTab';
import { projectApi } from '../../api/projectApi';
import type { Project } from '../../types';

const ProjectAdminTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);

  const load = () => { projectApi.list().then(setProjects); };
  useEffect(load, []);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (p: Project) => { setEditTarget(p); setFormOpen(true); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>프로젝트 목록</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>프로젝트 등록</Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell>코드</TableCell>
              <TableCell>프로젝트명</TableCell>
              <TableCell>유형</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>노출</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{p.code}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                <TableCell>{p.type_name ?? '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={p.status_name ?? '-'} color={p.status_name === '완료' ? 'default' : 'primary'} sx={{ height: 20, fontSize: 11 }} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {p.show_in_dashboard && <Chip size="small" label="대시보드" sx={{ height: 20, fontSize: 11 }} />}
                    {p.show_in_weekly && <Chip size="small" label="주간회의" sx={{ height: 20, fontSize: 11 }} />}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {projects.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.disabled', py: 3 }}>등록된 프로젝트가 없습니다.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">유형 · 상태 관리</Typography></Divider>
      <MasterTab />

      <ProjectFormDialog
        open={formOpen}
        initial={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={() => load()}
      />
    </Box>
  );
};

export default ProjectAdminTab;
