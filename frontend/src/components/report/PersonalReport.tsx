import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, ButtonGroup, CircularProgress,
  Paper, TextField, Chip,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { reportApi } from '../../api/reportApi';
import { projectApi } from '../../api/projectApi';
import type { Report, Project, EntryData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  weekId: number;
  userId: number;
  displayName: string;
  onStatusChange: (status: string) => void;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

const PersonalReport: React.FC<Props> = ({ weekId, userId, displayName, onStatusChange }) => {
  const { user, isAdmin } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [entries, setEntries] = useState<Record<number, { current: string; next: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = isAdmin || user?.id === userId;

  const load = useCallback(async () => {
    setLoading(true);
    const [rep, projs] = await Promise.all([
      reportApi.get(weekId, userId),
      projectApi.list(),
    ]);
    setReport(rep);
    setProjects(projs);
    const sel = rep.entries.map((e) => e.project_id);
    setSelectedProjects(sel);
    const map: Record<number, { current: string; next: string }> = {};
    rep.entries.forEach((e) => {
      map[e.project_id] = { current: e.current_work, next: e.next_work };
    });
    setEntries(map);
    setLoading(false);
  }, [weekId, userId]);

  useEffect(() => { load(); }, [load]);

  const toggleProject = (id: number) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const updateEntry = (projectId: number, field: 'current' | 'next', value: string) => {
    setEntries((prev) => ({
      ...prev,
      [projectId]: {
        current: prev[projectId]?.current ?? '',
        next: prev[projectId]?.next ?? '',
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entryData: EntryData[] = selectedProjects.map((pid) => ({
        project_id: pid,
        current_work: entries[pid]?.current ?? '',
        next_work: entries[pid]?.next ?? '',
      }));
      const updated = await reportApi.save(weekId, userId, entryData);
      setReport(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const updated = await reportApi.updateStatus(weekId, userId, newStatus);
    setReport(updated);
    onStatusChange(newStatus);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  const displayIds = canEdit
    ? selectedProjects
    : (report?.entries.map((e) => e.project_id) ?? []);

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{displayName}의 주간보고</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{todayLabel()}</Typography>
        </Box>
        {canEdit ? (
          <ButtonGroup size="small" variant="outlined">
            <Button
              onClick={() => handleStatusChange('draft')}
              variant={report?.status === 'draft' ? 'contained' : 'outlined'}
              color="warning"
              sx={{ fontWeight: 600 }}
            >
              작성중
            </Button>
            <Button
              onClick={() => handleStatusChange('done')}
              variant={report?.status === 'done' ? 'contained' : 'outlined'}
              color="primary"
              sx={{ fontWeight: 600 }}
            >
              작성완료
            </Button>
          </ButtonGroup>
        ) : (
          <Box sx={{
            px: 2, py: 0.5, borderRadius: 4,
            bgcolor: report?.status === 'done' ? 'primary.main' : report?.status === 'draft' ? 'warning.main' : 'grey.300',
            color: report?.status === 'none' ? 'text.secondary' : 'white',
            fontSize: 13, fontWeight: 600,
          }}>
            {report?.status === 'done' ? '작성완료' : report?.status === 'draft' ? '작성중' : '미작성'}
          </Box>
        )}
      </Box>

      {/* 프로젝트 선택 — 가로 스크롤 칩 */}
      {canEdit && projects.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
            프로젝트 선택
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: '#F1F5F9', borderRadius: 2 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 },
          }}>
            {projects.map((p) => {
              const selected = selectedProjects.includes(p.id);
              return (
                <Chip
                  key={p.id}
                  label={p.name}
                  onClick={() => toggleProject(p.id)}
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  sx={{
                    flexShrink: 0,
                    fontWeight: selected ? 600 : 400,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.85 },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}

      {/* 내용 없을 때 */}
      {displayIds.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          {canEdit ? '위에서 프로젝트를 선택하세요.' : '아직 작성된 내용이 없습니다.'}
        </Typography>
      )}

      {/* 프로젝트별 입력 카드 */}
      {displayIds.map((pid) => {
        const project = projects.find((p) => p.id === pid);
        if (!project) return null;
        const entry = canEdit
          ? entries[pid]
          : {
              current: report?.entries.find((e) => e.project_id === pid)?.current_work ?? '',
              next: report?.entries.find((e) => e.project_id === pid)?.next_work ?? '',
            };
        return (
          <Paper key={pid} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#1E293B', px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>{project.name}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ p: 2, borderRight: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>금주 업무</Typography>
                {canEdit ? (
                  <TextField
                    multiline minRows={4} fullWidth size="small"
                    value={entry?.current ?? ''}
                    onChange={(e) => updateEntry(pid, 'current', e.target.value)}
                    sx={{ mt: 1 }}
                    placeholder="금주 업무 내용을 입력하세요"
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{entry?.current || '-'}</Typography>
                )}
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>차주 업무</Typography>
                {canEdit ? (
                  <TextField
                    multiline minRows={4} fullWidth size="small"
                    value={entry?.next ?? ''}
                    onChange={(e) => updateEntry(pid, 'next', e.target.value)}
                    sx={{ mt: 1 }}
                    placeholder="차주 업무 내용을 입력하세요"
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{entry?.next || '-'}</Typography>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}

      {canEdit && selectedProjects.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ px: 4 }}
          >
            저장
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PersonalReport;
