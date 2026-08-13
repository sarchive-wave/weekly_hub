import React from 'react';
import { Card, CardContent, CardActionArea, Typography, Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Group as GroupIcon } from '@mui/icons-material';
import type { Week } from '../../types';

interface Props {
  week: Week;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin: boolean;
}

function calcDateRange(year: number, month: number, weekNum: number): string {
  const refDay = (weekNum - 1) * 7 + 1;
  const refDate = new Date(year, month - 1, refDay);
  const dayOfWeek = refDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() - daysFromMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${fmt(monday)} ~ ${fmt(sunday)}`;
}

function parseDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}

// 인접 주차가 확실히 구분되도록 주차 번호 기준으로 색 배정 (1주=파랑, 2주=초록, 3주=주황 ...)
const WEEK_PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];
const weekColor = (w: Week) => WEEK_PALETTE[(w.week_num - 1) % WEEK_PALETTE.length];

const WeekCard: React.FC<Props> = ({ week, onClick, onEdit, onDelete, isAdmin }) => {
  const dateRange = week.start_date && week.end_date
    ? parseDateRange(week.start_date, week.end_date)
    : calcDateRange(week.year, week.month, week.week_num);
  const accent = weekColor(week);

  return (
    <Card elevation={0} sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'relative', overflow: 'hidden',
      '&:before': { content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: accent },
      '&:hover': { borderColor: accent, boxShadow: '0 4px 12px rgba(0,0,0,0.14)' },
    }}>
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ pl: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: accent }}>{week.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{dateRange}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {week.done_members} / {week.total_members}명 완료
            </Typography>
          </Box>
          {week.total_members > 0 && (
            <Box sx={{ mt: 1.5, height: 5, bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{
                height: '100%',
                width: `${(week.done_members / week.total_members) * 100}%`,
                bgcolor: accent,
                borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </Box>
          )}
        </CardContent>
      </CardActionArea>
      {isAdmin && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex' }}>
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
    </Card>
  );
};

export default WeekCard;
