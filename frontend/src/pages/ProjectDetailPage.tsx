import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Grid, Stack, Divider,
  Tabs, Tab, Table, TableHead, TableBody, TableRow, TableCell, Link as MuiLink,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Edit as EditIcon, Group as GroupIcon,
  CheckCircle as CheckCircleIcon, Replay as ReplayIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProjectFormDialog from '../components/project/ProjectFormDialog';
import MembersDialog from '../components/project/MembersDialog';
import { projectApi } from '../api/projectApi';
import { useAuth } from '../contexts/AuthContext';
import type { Project, ProjectLog, ProjectWeeklyItem } from '../types';

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box sx={{ display: 'flex', py: 0.7 }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>{label}</Typography>
    <Box sx={{ flex: 1 }}><Typography variant="body2" component="div">{children}</Typography></Box>
  </Box>
);

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = Number(projectId);
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [weekly, setWeekly] = useState<ProjectWeeklyItem[]>([]);
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([projectApi.get(pid), projectApi.getWeekly(pid), projectApi.getLogs(pid)])
      .then(([p, w, l]) => { setProject(p); setWeekly(w); setLogs(l); })
      .finally(() => setLoading(false));
  }, [pid]);
  useEffect(load, [load]);

  const isPm = !!project && (
    project.pm_user_id === user?.id ||
    (project.members ?? []).some((m) => m.user_id === user?.id && m.role === 'pm')
  );
  const canEdit = isAdmin || isPm;
  const isDone = project?.status_name === '완료';

  const handleComplete = async () => { await projectApi.complete(pid); load(); };
  const handleReopen = async () => { await projectApi.reopen(pid); load(); };

  if (loading) {
    return <AppLayout><Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box></AppLayout>;
  }
  if (!project) {
    return <AppLayout><Typography sx={{ textAlign: 'center', pt: 8 }} color="text.secondary">프로젝트를 찾을 수 없습니다.</Typography></AppLayout>;
  }

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} color="inherit" sx={{ color: 'text.secondary', mb: 1 }}>목록으로</Button>

        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">{project.code}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" fontWeight={700}>{project.name}</Typography>
              <Chip
                size="small"
                label={project.status_name ?? '-'}
                color={isDone ? 'default' : 'primary'}
              />
            </Box>
          </Box>
          {canEdit && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<GroupIcon />} onClick={() => setMembersOpen(true)}>팀원</Button>
              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>수정</Button>
              {isDone
                ? <Button size="small" variant="outlined" color="inherit" startIcon={<ReplayIcon />} onClick={handleReopen}>재개</Button>
                : <Button size="small" variant="contained" startIcon={<CheckCircleIcon />} onClick={handleComplete}>완료 처리</Button>}
            </Stack>
          )}
        </Box>

        {/* 정보 카드 */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
              <InfoRow label="유형">{project.type_name ?? '-'}</InfoRow>
              <InfoRow label="PM">{project.pm_name ?? '미지정'}</InfoRow>
              <InfoRow label="기간">{(project.start_date ?? '-')} ~ {(project.end_date ?? '-')}</InfoRow>
              <InfoRow label="NAS 폴더">{project.nas_path || '-'}</InfoRow>
              <InfoRow label="Git 저장소">
                {project.git_url ? <MuiLink href={project.git_url} target="_blank" rel="noreferrer">{project.git_url}</MuiLink> : '-'}
              </InfoRow>
              <Divider sx={{ my: 1 }} />
              <InfoRow label="소개">{project.description || '-'}</InfoRow>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>팀원 ({project.member_count ?? 0})</Typography>
              <Stack spacing={0.8}>
                {(project.members ?? []).length === 0 && <Typography variant="body2" color="text.disabled">배정된 팀원이 없습니다.</Typography>}
                {(project.members ?? []).map((m) => (
                  <Box key={m.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" label={m.role === 'pm' ? 'PM' : '팀원'} color={m.role === 'pm' ? 'primary' : 'default'} sx={{ height: 20, fontSize: 11 }} />
                    <Typography variant="body2">{m.display_name}</Typography>
                    {m.position && <Typography variant="caption" color="text.secondary">{m.position}</Typography>}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* 탭 */}
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mt: 2, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}>
            <Tab label="주간보고 (read)" />
            <Tab label="변경 이력" />
          </Tabs>
          <Box sx={{ p: 2.5 }}>
            {tab === 0 && (
              weekly.length === 0
                ? <Typography variant="body2" color="text.secondary">이 프로젝트로 작성된 주간보고가 없습니다.</Typography>
                : <Stack spacing={2}>
                    {weekly.map((w) => (
                      <Box key={w.week_id}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{w.title}</Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">금주</Typography>
                            {w.current_work.length === 0 ? <Typography variant="body2" color="text.disabled">-</Typography>
                              : w.current_work.map((t, i) => <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>• {t}</Typography>)}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">차주</Typography>
                            {w.next_work.length === 0 ? <Typography variant="body2" color="text.disabled">-</Typography>
                              : w.next_work.map((t, i) => <Typography key={i} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>• {t}</Typography>)}
                          </Grid>
                        </Grid>
                        <Divider sx={{ mt: 1.5 }} />
                      </Box>
                    ))}
                  </Stack>
            )}
            {tab === 1 && (
              logs.length === 0
                ? <Typography variant="body2" color="text.secondary">변경 이력이 없습니다.</Typography>
                : <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell>일시</TableCell><TableCell>담당</TableCell><TableCell>변경</TableCell><TableCell>이전</TableCell><TableCell>이후</TableCell>
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
          </Box>
        </Paper>
      </Box>

      <ProjectFormDialog open={editOpen} initial={project} onClose={() => setEditOpen(false)} onSaved={() => load()} />
      <MembersDialog open={membersOpen} projectId={pid} onClose={() => setMembersOpen(false)} onSaved={() => load()} />
    </AppLayout>
  );
};

export default ProjectDetailPage;
