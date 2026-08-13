import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Stack,
  ToggleButtonGroup, ToggleButton, Button, IconButton, Table, TableBody,
  TableHead, TableRow, TableCell, Tooltip,
} from '@mui/material';
import {
  ViewModule as ViewModuleIcon, ViewList as ViewListIcon, Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppLayout from '../components/layout/AppLayout';
import ProjectFormDialog from '../components/project/ProjectFormDialog';
import { dashboardApi } from '../api/dashboardApi';
import { projectApi } from '../api/projectApi';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardResponse, DashboardItem } from '../types';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];
const colorFor = (s?: string | null) => {
  const key = s || '?';
  const sum = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const todayLabel = () => {
  const d = new Date();
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${DAYS[d.getDay()]})`;
};

// 팀원 이름 칩 (최대 4명 + 외 N)
const MemberNames: React.FC<{ names: string[] }> = ({ names }) => {
  if (names.length === 0) return null;
  const shown = names.slice(0, 4);
  const rest = names.length - shown.length;
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
      {shown.map((n) => (
        <Chip key={n} label={n} size="small" variant="outlined"
          sx={{ height: 22, fontSize: 12, bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }} />
      ))}
      {rest > 0 && <Chip label={`외 ${rest}`} size="small" sx={{ height: 22, fontSize: 12 }} />}
    </Stack>
  );
};

const TypeChip: React.FC<{ name?: string | null }> = ({ name }) =>
  name ? <Chip label={name} size="small" sx={{ height: 20, fontSize: 11, bgcolor: colorFor(name) + '18', color: colorFor(name), fontWeight: 600 }} /> : <>-</>;

// ── 카드 ────────────────────────────────────────────────────
const SortableCard: React.FC<{ item: DashboardItem; onOpen: () => void }> = ({ item, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.project_id });
  const accent = colorFor(item.type_name);
  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      onClick={onOpen}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        position: 'relative', border: '1px solid #E2E8F0', borderRadius: 3, p: 2.25, pl: 2.75,
        height: '100%', cursor: 'pointer', overflow: 'hidden', bgcolor: 'white',
        opacity: isDragging ? 0.5 : 1,
        '&:before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: accent },
        '&:hover': { boxShadow: '0 6px 18px rgba(15,23,42,0.10)', borderColor: accent },
        transition: 'box-shadow .15s, border-color .15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <TypeChip name={item.type_name} />
        <IconButton size="small" {...attributes} {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{ cursor: 'grab', color: '#CBD5E1', '&:active': { cursor: 'grabbing' } }}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.25, lineHeight: 1.3 }}>
        {item.code ? `${item.code} ` : ''}{item.name}
      </Typography>
      <Stack spacing={1}>
        <Typography variant="body2" sx={{ color: 'text.primary' }}>PM · {item.pm_name ?? '미지정'}</Typography>
        <Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.4 }}>팀원</Typography>
          <MemberNames names={item.member_names} />
        </Box>
      </Stack>
    </Paper>
  );
};

// ── 리스트 행 (유형 · 코드 · 명 · PM · 팀원) ─────────────────
const SortableRow: React.FC<{ item: DashboardItem; onOpen: () => void }> = ({ item, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.project_id });
  return (
    <TableRow
      ref={setNodeRef}
      hover
      onClick={onOpen}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ cursor: 'pointer', opacity: isDragging ? 0.5 : 1, bgcolor: isDragging ? '#F1F5F9' : undefined }}
    >
      <TableCell sx={{ px: 0.5, width: 34 }}>
        <IconButton size="small" {...attributes} {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{ cursor: 'grab', color: '#CBD5E1' }}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell><TypeChip name={item.type_name} /></TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {item.code && <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.disabled', mr: 0.75 }}>{item.code}</Box>}
          {item.name}
        </Typography>
      </TableCell>
      <TableCell><Typography variant="body2">{item.pm_name ?? '미지정'}</Typography></TableCell>
      <TableCell sx={{ maxWidth: 300 }}><MemberNames names={item.member_names} /></TableCell>
    </TableRow>
  );
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [view, setView] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = () => {
    setLoading(true);
    dashboardApi.get().then((d) => { setData(d); setItems(d.items); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.project_id === active.id);
    const newIndex = items.findIndex((i) => i.project_id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    projectApi.setMyOrder(next.map((i) => i.project_id)).catch(() => {});
  };

  const activeCount = data?.by_status.find((s) => s.name === '진행중')?.count ?? 0;

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1240, mx: 'auto' }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>프로젝트 대시보드</Typography>
            <Typography variant="caption" color="text.secondary">
              진행중 {activeCount} · 전체 {data?.total ?? 0} · 드래그로 순서를 바꿀 수 있어요
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{todayLabel()}</Typography>
            <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
              <ToggleButton value="card" sx={{ px: 1.2 }}><Tooltip title="카드"><ViewModuleIcon fontSize="small" /></Tooltip></ToggleButton>
              <ToggleButton value="list" sx={{ px: 1.2 }}><Tooltip title="리스트"><ViewListIcon fontSize="small" /></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            {isAdmin && (
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>프로젝트 등록</Button>
            )}
          </Stack>
        </Box>

        {/* 유형별 요약 */}
        {data && data.by_type.length > 0 && (
          <Stack direction="row" spacing={0.75} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 0.75 }}>
            {data.by_type.map((t) => (
              <Chip key={t.name} size="small" label={`${t.name} ${t.count}`}
                sx={{ bgcolor: colorFor(t.name) + '18', color: colorFor(t.name), fontWeight: 600 }} />
            ))}
          </Stack>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Paper elevation={0} sx={{ border: '1px dashed #CBD5E1', borderRadius: 3, py: 8, textAlign: 'center', color: 'text.secondary' }}>
            <Typography>진행중인 프로젝트가 없습니다.</Typography>
            {isAdmin && <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)} sx={{ mt: 2 }}>프로젝트 등록</Button>}
          </Paper>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {view === 'card' ? (
              <SortableContext items={items.map((i) => i.project_id)} strategy={rectSortingStrategy}>
                <Grid container spacing={2}>
                  {items.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.project_id}>
                      <SortableCard item={item} onOpen={() => navigate(`/projects/${item.project_id}`)} />
                    </Grid>
                  ))}
                </Grid>
              </SortableContext>
            ) : (
              <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ px: 0.5 }} />
                      <TableCell>유형</TableCell>
                      <TableCell>프로젝트</TableCell>
                      <TableCell>PM</TableCell>
                      <TableCell>팀원</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <SortableContext items={items.map((i) => i.project_id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => (
                        <SortableRow key={item.project_id} item={item} onOpen={() => navigate(`/projects/${item.project_id}`)} />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </Paper>
            )}
          </DndContext>
        )}
      </Box>

      <ProjectFormDialog open={formOpen} initial={null} onClose={() => setFormOpen(false)} onSaved={() => load()} />
    </AppLayout>
  );
};

export default DashboardPage;
