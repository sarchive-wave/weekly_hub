import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs, Paper } from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import AccountTab from '../components/settings/AccountTab';
import ProjectAdminTab from '../components/settings/ProjectAdminTab';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>설정</Typography>
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}>
            <Tab label="프로젝트 관리" />
            <Tab label="인력 관리" />
            <Tab label="시스템 관리" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tab === 0 && <ProjectAdminTab />}
            {tab === 1 && <AccountTab />}
            {tab === 2 && (
              <Box sx={{ color: 'text.secondary' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  권한은 계정 역할(관리자/일반)과 프로젝트별 역할(PM/팀원)로 관리됩니다.
                </Typography>
                <Typography variant="body2">· 관리자: 전체 관리 · PM: 담당 프로젝트 수정/완료/팀원배정 · 팀원: 조회 및 본인 주간보고</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
                  세분화 권한(role_permissions) 관리 화면은 추후 제공 예정입니다.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default SettingsPage;
