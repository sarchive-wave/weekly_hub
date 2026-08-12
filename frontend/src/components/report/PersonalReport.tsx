import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Paper, TextField, IconButton, Select, MenuItem, FormControl,
  Snackbar, Alert,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
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
  const { user, isAdmin } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [entries, setEntries] = useState<Record<number, { current: string; next: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canEdit = isAdmin || user?.id === userId;
  const dateLabels = getWeekDateLabels(weekStartDate, weekYear, weekMonth, weekNum);

  const load = useCallback(async () => {
    setLoading(true);
    const [rep, projs] = await Promise.all([reportApi.get(weekId, userId), projectApi.list()]);
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

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{displayName}의 주간보고</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{todayLabel()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {canEdit && (
            <IconButton
              onClick={addSlot}
              sx={{
                bgcolor: 'primary.main', color: 'white', width: 36, height: 36,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          {canEdit ? (
            <Button
              size="small"
              variant={report?.status === 'done' ? 'contained' : 'outlined'}
              color={report?.status === 'done' ? 'primary' : 'inherit'}
              onClick={handleToggleDone}
              sx={{
                fontWeight: 600,
                color: report?.status === 'done' ? 'white' : 'text.disabled',
                borderColor: report?.status === 'done' ? undefined : '#CBD5E1',
              }}
            >
              작성완료
            </Button>
          ) : (
            <Box sx={{
              px: 2, py: 0.5, borderRadius: 4,
              bgcolor: report?.status === 'done' ? 'primary.main' : 'grey.300',
              color: report?.status === 'done' ? 'white' : 'text.secondary',
              fontSize: 13, fontWeight: 600,
            }}>
              {report?.status === 'done' ? '작성완료' : '미작성'}
            </Box>
          )}
        </Box>
      </Box>

      {/* 빈 상태 */}
      {canEdit && slots.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8, border: '2px dashed #E2E8F0', borderRadius: 2, py: 6, color: 'text.secondary' }}>
          <AddIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
          <Typography>오른쪽 + 버튼으로 프로젝트를 추가하세요.</Typography>
        </Box>
      )}
      {!canEdit && readonlyEntries.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>아직 작성된 내용이 없습니다.</Typography>
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
          <Paper key={slot.slotId} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            {/* 카드 헤더: 프로젝트 선택 */}
            <Box sx={{ bgcolor: '#1E293B', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select
                  value={slot.projectId ?? ''}
                  onChange={(e) => selectProject(slot.slotId, Number(e.target.value))}
                  sx={{
                    color: slot.projectId ? 'white' : 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                    '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiSelect-select': { py: 0.5, fontSize: 15 },
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
                  renderValue={(val) => val ? projects.find((p) => p.id === val)?.name : '프로젝트를 선택하세요'}
                >
                  {available.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => removeSlot(slot.slotId)} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* 프로젝트 선택 전: 안내 문구 */}
            {!slot.projectId && (
              <Box sx={{ px: 3, py: 3, color: 'text.disabled', textAlign: 'center', fontSize: 14 }}>
                위에서 프로젝트를 선택하면 작성란이 표시됩니다.
              </Box>
            )}

            {/* 프로젝트 선택 후: 금주/차주 입력 */}
            {slot.projectId && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <Box sx={{ p: 2, borderRight: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.current}</Typography>
                  <TextField
                    multiline minRows={4} fullWidth size="small"
                    value={entry?.current ?? ''}
                    onChange={(e) => updateEntry(slot.projectId!, 'current', e.target.value)}
                    sx={{ mt: 1 }}
                    placeholder="금주 업무 내용을 입력하세요"
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.next}</Typography>
                  <TextField
                    multiline minRows={4} fullWidth size="small"
                    value={entry?.next ?? ''}
                    onChange={(e) => updateEntry(slot.projectId!, 'next', e.target.value)}
                    sx={{ mt: 1 }}
                    placeholder="차주 업무 내용을 입력하세요"
                  />
                </Box>
              </Box>
            )}
          </Paper>
        );
      })}

      {/* 읽기 전용 모드 */}
      {!canEdit && readonlyEntries.map((e) => {
        const project = projects.find((p) => p.id === e.project_id);
        return (
          <Paper key={e.project_id} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#1E293B', px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>{project?.name ?? ''}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ p: 2, borderRight: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.current}</Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{e.current_work || '-'}</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{dateLabels.next}</Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{e.next_work || '-'}</Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}

      {/* 저장 버튼 */}
      {canEdit && slots.some((s) => s.projectId !== null) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} sx={{ px: 4 }}>
            저장
          </Button>
        </Box>
      )}

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
