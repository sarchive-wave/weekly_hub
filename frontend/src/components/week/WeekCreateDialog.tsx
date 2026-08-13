import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControl, InputLabel, Select, MenuItem, Typography,
} from '@mui/material';
import { weekApi } from '../../api/weekApi';
import type { Week } from '../../types';

interface Props {
  open: boolean;
  initial?: Week | null;   // null이면 생성
  onClose: () => void;
  onSaved: (week: Week) => void;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const WeekCreateDialog: React.FC<Props> = ({ open, initial, onClose, onSaved }) => {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [weekNum, setWeekNum] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = `${month}월 ${weekNum}주차`;

  // 초기화
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setYear(initial.year); setMonth(initial.month); setWeekNum(initial.week_num);
      setStartDate(initial.start_date || ''); setEndDate(initial.end_date || '');
    } else {
      setYear(currentYear); setMonth(currentMonth); setWeekNum(1);
    }
  }, [open, initial]);

  // 생성 모드에서만 해당 주 목요일 자동 계산(수정 모드는 기존 날짜 보존)
  useEffect(() => {
    if (!open || initial) return;
    const firstDay = new Date(year, month - 1, 1);
    const firstDow = firstDay.getDay();
    const daysToMonday = firstDow === 0 ? -6 : 1 - firstDow;
    const monday = new Date(year, month - 1, 1 + daysToMonday + (weekNum - 1) * 7);
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    const iso = thursday.toISOString().split('T')[0];
    setStartDate(iso);
    setEndDate(iso);
  }, [year, month, weekNum, open, initial]);

  const handleSubmit = async () => {
    if (startDate && endDate && endDate < startDate) {
      alert('종료일이 시작일보다 빠를 수 없습니다.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { year, month, week_num: weekNum, title, start_date: startDate || null, end_date: endDate || null };
      const saved = initial ? await weekApi.update(initial.id, payload) : await weekApi.create(payload);
      onSaved(saved);
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? '주차 수정' : '주차 추가'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>연도</InputLabel>
              <Select value={year} label="연도" onChange={(e) => setYear(Number(e.target.value))}>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <MenuItem key={y} value={y}>{y}년</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>월</InputLabel>
              <Select value={month} label="월" onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <MenuItem key={m} value={m}>{m}월</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>주차</InputLabel>
              <Select value={weekNum} label="주차" onChange={(e) => setWeekNum(Number(e.target.value))}>
                {[1, 2, 3, 4, 5].map((w) => (
                  <MenuItem key={w} value={w}>{w}주차</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              날짜 범위 (선택사항)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                type="date" size="small" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ flex: 1 }} inputProps={{ style: { fontSize: 13 } }}
              />
              <Typography variant="body2" color="text.secondary">~</Typography>
              <TextField
                type="date" size="small" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ flex: 1 }} inputProps={{ style: { fontSize: 13 } }}
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>{initial ? '저장' : '추가'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeekCreateDialog;
