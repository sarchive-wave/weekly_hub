import React, { useEffect, useState } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemText,
  Typography, Divider, CircularProgress, Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { weekApi } from '../api/weekApi';
import type { Week, MemberStatus } from '../types';
import AppLayout from '../components/layout/AppLayout';
import OverallReport from '../components/report/OverallReport';
import PersonalReport from '../components/report/PersonalReport';

const SIDEBAR_WIDTH = 240;

const statusColor: Record<string, string> = {
  none: '#94A3B8',
  draft: '#F59E0B',
  done: '#3B82F6',
};

const WeekDetailPage: React.FC = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const [week, setWeek] = useState<Week | null>(null);
  const [members, setMembers] = useState<MemberStatus[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const wId = Number(weekId);

  useEffect(() => {
    const load = async () => {
      const [allWeeks, m] = await Promise.all([weekApi.list(), weekApi.getMembers(wId)]);
      const found = allWeeks.find((w) => w.id === wId);
      setWeek(found ?? null);
      setMembers(m);
      setLoading(false);
    };
    load();
  }, [wId]);

  const handleStatusChange = (userId: number, newStatus: string) => {
    setMembers((prev) =>
      prev.map((m) => m.user_id === userId ? { ...m, status: newStatus as MemberStatus['status'] } : m)
    );
  };

  const selectedMember = members.find((m) => m.user_id === selectedUserId);

  if (loading) {
    return (
      <AppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ display: 'flex', mx: -3, mt: -3 }}>
        {/* 사이드바 */}
        <Box sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid #E2E8F0',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box sx={{ p: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              size="small"
              color="inherit"
              sx={{ color: 'text.secondary' }}
            >
              목록으로
            </Button>
          </Box>
          <Divider />
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {week?.title}
            </Typography>
          </Box>
          <List dense sx={{ px: 1 }}>
            {members.map((member) => (
              <ListItem key={member.user_id} disablePadding>
                <ListItemButton
                  selected={selectedUserId === member.user_id}
                  onClick={() => setSelectedUserId(member.user_id)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    '&.Mui-selected': { bgcolor: '#F1F5F9' },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: statusColor[member.status],
                      mr: 1.5,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText primary={member.display_name} primaryTypographyProps={{ fontSize: 14, fontWeight: selectedUserId === member.user_id ? 600 : 400 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 메인 콘텐츠 */}
        <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>
          {selectedUserId === null ? (
            <OverallReport weekId={wId} title={week?.title ?? ''} />
          ) : (
            <PersonalReport
              weekId={wId}
              userId={selectedUserId}
              displayName={selectedMember?.display_name ?? ''}
              onStatusChange={(status) => handleStatusChange(selectedUserId, status)}
            />
          )}
        </Box>
      </Box>
    </AppLayout>
  );
};

export default WeekDetailPage;
