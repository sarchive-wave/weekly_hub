import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Grid, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Popover,
} from '@mui/material';
import { Add as AddIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { weekApi } from '../api/weekApi';
import type { Week } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import WeekCard from '../components/week/WeekCard';
import WeekCreateDialog from '../components/week/WeekCreateDialog';

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const MainPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Week | null>(null);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // 년도 팝오버
  const [yearAnchor, setYearAnchor] = useState<HTMLElement | null>(null);
  // 월 팝오버
  const [monthAnchor, setMonthAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    weekApi.list().then(setWeeks).finally(() => setLoading(false));
  }, []);

  const filteredWeeks = useMemo(
    () => weeks.filter((w) => w.year === selectedYear && w.month === selectedMonth),
    [weeks, selectedYear, selectedMonth]
  );

  const handlePrevMonth = () => {
    if (selectedMonth === 1) { setSelectedYear((y) => y - 1); setSelectedMonth(12); }
    else setSelectedMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) { setSelectedYear((y) => y + 1); setSelectedMonth(1); }
    else setSelectedMonth((m) => m + 1);
  };

  const handleCreated = (week: Week) => {
    setWeeks((prev) => [week, ...prev]);
    setSelectedYear(week.year);
    setSelectedMonth(week.month);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await weekApi.delete(deleteTarget.id);
    setWeeks((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // 년도 팝오버: 현재 년도 기준 ±5년 목록
  const yearOptions = Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>주간보고 전체</Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              주차 추가
            </Button>
          )}
        </Box>

        {/* 월 네비게이터 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 0.5 }}>
          <IconButton onClick={handlePrevMonth} size="small">
            <ChevronLeftIcon />
          </IconButton>

          {/* 년도 클릭 */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#F1F5F9' } }}
            onClick={(e) => setYearAnchor(e.currentTarget)}
          >
            {selectedYear}년
          </Typography>

          {/* 월 클릭 */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#F1F5F9' } }}
            onClick={(e) => setMonthAnchor(e.currentTarget)}
          >
            {selectedMonth}월
          </Typography>

          <IconButton onClick={handleNextMonth} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* 년도 팝오버 */}
        <Popover
          open={Boolean(yearAnchor)}
          anchorEl={yearAnchor}
          onClose={() => setYearAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ py: 1 }}>
            {yearOptions.map((y) => (
              <Box
                key={y}
                onClick={() => { setSelectedYear(y); setYearAnchor(null); }}
                sx={{
                  px: 3, py: 0.8, cursor: 'pointer', textAlign: 'center',
                  fontWeight: y === selectedYear ? 700 : 400,
                  color: y === selectedYear ? 'primary.main' : 'text.primary',
                  bgcolor: y === selectedYear ? '#EFF6FF' : 'transparent',
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                {y}년
              </Box>
            ))}
          </Box>
        </Popover>

        {/* 월 팝오버 */}
        <Popover
          open={Boolean(monthAnchor)}
          anchorEl={monthAnchor}
          onClose={() => setMonthAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.5, width: 200 }}>
            {MONTHS.map((label, i) => {
              const m = i + 1;
              const selected = m === selectedMonth;
              return (
                <Box
                  key={m}
                  onClick={() => { setSelectedMonth(m); setMonthAnchor(null); }}
                  sx={{
                    px: 1, py: 1, cursor: 'pointer', textAlign: 'center', borderRadius: 1,
                    fontWeight: selected ? 700 : 400,
                    color: selected ? 'white' : 'text.primary',
                    bgcolor: selected ? 'primary.main' : 'transparent',
                    fontSize: 14,
                    '&:hover': { bgcolor: selected ? 'primary.dark' : '#F1F5F9' },
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Box>
        </Popover>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
        ) : filteredWeeks.length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 8 }}>
            <Typography color="text.secondary">
              {selectedYear}년 {selectedMonth}월에 등록된 주차가 없습니다.
            </Typography>
            {isAdmin && (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ mt: 2 }}>
                주차 추가하기
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredWeeks.map((week) => (
              <Grid item xs={12} sm={6} md={4} key={week.id}>
                <WeekCard
                  week={week}
                  onClick={() => navigate(`/weeks/${week.id}`)}
                  onDelete={() => setDeleteTarget(week)}
                  isAdmin={isAdmin}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <WeekCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>주차 삭제</DialogTitle>
        <DialogContent>
          <Typography>"{deleteTarget?.title}"를 삭제하시겠습니까?<br />해당 주차의 모든 주간보고가 함께 삭제됩니다.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default MainPage;
