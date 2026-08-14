import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Paper, TextField, IconButton, Select, MenuItem, FormControl,
  Snackbar, Alert, Stack, Chip,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Save as SaveIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { reportApi } from '../../api/reportApi';
import { projectApi } from '../../api/projectApi';
import type { Report, Project, EntryData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  weekId: number;
  userId: number;
  displayName: string;
  weekStartDate?: string | null;
  weekYear?: number;
  weekMonth?: number;
  weekNum?: number;
  onStatusChange: (status: string) => void;
}

interface Slot {
  slotId: string;
  projectId: number | null;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function todayLabel() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

function fmt(d: Date) {
  return `${d.getMonth() + 1}월 ${d.getDate()}일(${DAYS[d.getDay()]})`;
}

function getWeekDateLabels(startDate?: string | null, year?: number, month?: number, weekNum?: number) {
  let monday: Date;
  if (startDate) {
    monday = new Date(startDate + 'T00:00:00');
  } else if (year && month && weekNum) {
    const refDate = new Date(year, month - 1, (weekNum - 1) * 7 + 1);
    const dow = refDate.getDay();
    monday = new Date(refDate);
    monday.setDate(refDate.getDate() - (dow === 0 ? 6 : dow - 1));
  } else {
    return { current: '금주', next: '차주' };
  }
  const fri = new Date(monday); fri.setDate(monday.getDate() + 4);
  const nMon = new Date(monday); nMon.setDate(monday.getDate() + 7);
  const nFri = new Date(monday); nFri.setDate(monday.getDate() + 11);
  return {
    current: `금주  ${fmt(monday)} ~ ${fmt(fri)}`,
    next: `차주  ${fmt(nMon)} ~ ${fmt(nFri)}`,
  };
}

let slotCounter = 0;
const newSlotId = () => `slot-${++slotCounter}`;

const PersonalReport: React.FC<Props> = ({
  weekId, userId, displayName, weekStartDate, weekYear, weekMonth, weekNum, onStatusChange,
}) => {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [entries, setEntries] = useState<Record<number, { current: string; next: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canEdit = user?.id === userId;   // 본인만 작성/수정, 타인(관리자 포함)은 read-only
  const dateLabels = getWeekDateLabels(weekStartDate, weekYear, weekMonth, weekNum);

  const load = useCallback(async () => {
    setLoading(true);
    const [rep, projs] = await Promise.all([reportApi.get(weekId, userId), projectApi.list(undefined, 'weekly')]);
    setReport(rep);
    setProjects(projs);
    const map: Record<number, { current: string; next: string }> = {};
    rep.entries.forEach((e) => { map[e.project_id] = { current: e.current_work, next: e.next_work }; });
    setEntries(map);
    setSlots(rep.entries.map((e) => ({ slotId: newSlotId(), projectId: e.project_id })));
    setLoading(false);
  }, [weekId, userId]);

  useEffect(() => { load(); }, [load]);

  const addSlot = () => setSlots((prev) => [...prev, { slotId: newSlotId(), projectId: null }]);

  const removeSlot = (slotId: string) => setSlots((prev) => prev.filter((s) => s.slotId !== slotId));

  const selectProject = (slotId: string, projectId: number) => {
    setSlots((prev) => prev.map((s) => s.slotId === slotId ? { ...s, projectId } : s));
    setEntries((prev) => ({ ...prev, [projectId]: prev[projectId] ?? { current: '', next: '' } }));
  };

  const updateEntry = (projectId: number, field: 'current' | 'next', value: string) => {
    setEntries((prev) => ({ ...prev, [projectId]: { ...prev[projectId], [field]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entryData: EntryData[] = slots
        .filter((s) => s.projectId !== null)
        .map((s) => ({
          project_id: s.projectId!,
          current_work: entries[s.projectId!]?.current ?? '',
          next_work: entries[s.projectId!]?.next ?? '',
        }));
      const updated = await reportApi.save(weekId, userId, entryData);
      setReport(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const updated = await reportApi.updateStatus(weekId, userId, newStatus);
    setReport(updated);
    onStatusChange(newStatus);
    if (newStatus === 'done') setSaved(true);
  };

  const handleToggleDone = async () => {
    const next = report?.status === 'done' ? 'none' : 'done';
    await handleStatusChange(next);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  // 읽기 전용 모드: report entries 그대로 표시
  const readonlyEntries = report?.entries ?? [];

  // 현재 슬롯에서 이미 선택된 project id 목록
  const takenIds = slots.map((s) => s.projectId).filter(Boolean) as number[];

  const isDone = report?.status === 'done';
  const hasSlot = slots.some((s) => s.projectId !== null);

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{displayName}의 주간보고</Typography>
          <Typography variant="caption" color="text.secondary">{todayLabel()}</Typography>
        </Box>
        {canEdit ? (
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            <Button size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={addSlot}
              sx={{ borderColor: 'divider', color: 'text.secondary' }}>
              프로젝트
            </Button>
            <Button size="small" variant={isDone ? 'contained' : 'outlined'}
              color={isDone ? 'success' : 'inherit'} startIcon={<CheckCircleIcon fontSize="small" />}
              onClick={handleToggleDone}
              sx={{ borderColor: isDone ? undefined : 'divider', color: isDone ? 'white' : 'text.secondary' }}>
              작성완료
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveIcon fontSize="small" />}
              onClick={handleSave} disabled={saving || !hasSlot}>
              저장
            </Button>
          </Stack>
        ) : (
          <Chip size="small" color={isDone ? 'primary' : 'default'}
            label={isDone ? '작성완료' : '미작성'} sx={{ fontWeight: 600 }} />
        )}
      </Box>

      {/* 빈 상태 */}
      {canEdit && slots.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 6, border: '1px dashed', borderColor: 'divider', borderRadius: 2, py: 5, color: 'text.secondary' }}>
          <AddIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
          <Typography variant="body2">우측 상단 [프로젝트]로 항목을 추가하세요.</Typography>
        </Box>
      )}
      {!canEdit && readonlyEntries.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 6 }}>아직 작성된 내용이 없습니다.</Typography>
      )}

      {/* 편집 모드: 슬롯 카드 */}
      {canEdit && slots.map((slot) => {
        const entry = slot.projectId ? entries[slot.projectId] : null;
        const available = projects
          .filter((p) => !takenIds.includes(p.id) || p.id === slot.projectId)
          .sort((a, b) => {
            const aEng = /^[A-Za-z]/.test(a.name);
            const bEng = /^[A-Za-z]/.test(b.name);
            if (aEng !== bEng) return aEng ? -1 : 1;
            return a.name.localeCompare(b.name, aEng ? 'en' : 'ko');
          });

        return (
          <Paper key={slot.slotId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1.5, overflow: 'hidden' }}>
            {/* 슬림 헤더: 프로젝트 선택 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, bgcolor: 'action.hover', borderBottom: slot.projectId ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: slot.projectId ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
              <FormControl variant="standard" size="small" sx={{ flex: 1 }}>
                <Select
                  disableUnderline
                  value={slot.projectId ?? ''}
                  onChange={(e) => selectProject(slot.slotId, Number(e.target.value))}
                  displayEmpty
                  sx={{ fontWeight: 600, fontSize: 14, '& .MuiSelect-select': { py: 0.25 } }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                  renderValue={(val) => val ? projects.find((p) => p.id === val)?.name
                    : <Box component="span" sx={{ color: 'text.disabled', fontWeight: 400 }}>프로젝트 선택</Box>}
                >
                  {available.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => removeSlot(slot.slotId)} sx={{ color: 'text.disabled' }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {slot.projectId && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.current}</Typography>
                  <TextField
                    multiline minRows={3} fullWidth size="small"
                    value={entry?.current ?? ''}
                    onChange={(e) => updateEntry(slot.projectId!, 'current', e.target.value)}
                    sx={{ mt: 0.75 }}
                    placeholder="금주 업무"
                  />
                </Box>
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.next}</Typography>
                  <TextField
                    multiline minRows={3} fullWidth size="small"
                    value={entry?.next ?? ''}
                    onChange={(e) => updateEntry(slot.projectId!, 'next', e.target.value)}
                    sx={{ mt: 0.75 }}
                    placeholder="차주 계획"
                  />
                </Box>
              </Box>
            )}
          </Paper>
        );
      })}

      {/* 읽기 전용 모드 */}
      {!canEdit && readonlyEntries.map((e, idx) => {
        const project = projects.find((p) => p.id === e.project_id);
        const name = project?.name ?? e.project_name ?? '';
        return (
          <Paper key={e.project_id ?? `snap-${idx}`} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1.5, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.current}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{e.current_work || '-'}</Typography>
              </Box>
              <Box sx={{ p: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.next}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{e.next_work || '-'}</Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaved(false)} sx={{ width: '100%' }}>
          작성 완료 되었습니다.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonalReport;
