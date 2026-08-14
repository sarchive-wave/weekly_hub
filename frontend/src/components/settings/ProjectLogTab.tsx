import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, List, ListItemButton, ListItemText, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, Chip,
} from '@mui/material';
import { projectApi } from '../../api/projectApi';
import type { Project, ProjectLog } from '../../types';

const ProjectLogTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    projectApi.list().then((ps) => {
      setProjects(ps);
      if (ps.length > 0) select(ps[0]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (p: Project) => {
    setSelected(p);
    setLoadingLogs(true);
    projectApi.getLogs(p.id).then(setLogs).finally(() => setLoadingLogs(false));
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>프로젝트 관리이력</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        프로젝트를 선택하면 마감일·상태·PM·팀원 등 변경 이력을 확인할 수 있습니다. (관리자 전용)
      </Typography>

      <Grid container spacing={2}>
        {/* 왼쪽: 프로젝트 리스트 */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 520, overflow: 'auto' }}>
            <List disablePadding>
              {projects.map((p) => (
                <ListItemButton
                  key={p.id}
                  selected={selected?.id === p.id}
                  onClick={() => select(p)}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{p.name}</Typography>}
                    secondary={<Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{p.code}</Typography>}
                  />
                </ListItemButton>
              ))}
              {projects.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>프로젝트가 없습니다.</Box>
              )}
            </List>
          </Paper>
        </Grid>

        {/* 오른쪽: 선택 프로젝트 로그 */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.25, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{selected?.name ?? '-'}</Typography>
              {selected?.code && <Chip size="small" label={selected.code} sx={{ height: 20, fontSize: 11 }} />}
            </Box>
            {loadingLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={24} /></Box>
            ) : logs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>변경 이력이 없습니다.</Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>일시</TableCell>
                    <TableCell>담당</TableCell>
                    <TableCell>변경</TableCell>
                    <TableCell>이전</TableCell>
                    <TableCell>이후</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell><Typography variant="caption">{l.created_at.replace('T', ' ').slice(0, 16)}</Typography></TableCell>
                      <TableCell>{l.actor_name ?? '-'}</TableCell>
                      <TableCell>{l.action}</TableCell>
                      <TableCell><Typography variant="caption" color="text.secondary">{l.old_value ?? '-'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{l.new_value ?? '-'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectLogTab;
