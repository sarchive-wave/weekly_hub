import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs, Paper } from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import AccountTab from '../components/settings/AccountTab';
import ProjectAdminTab from '../components/settings/ProjectAdminTab';
import MasterTab from '../components/settings/MasterTab';
import PermissionTab from '../components/settings/PermissionTab';
import ProjectLogTab from '../components/settings/ProjectLogTab';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>설정</Typography>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
            <Tab label="프로젝트 관리" />
            <Tab label="유형·상태 관리" />
            <Tab label="인력 관리" />
            <Tab label="시스템 관리" />
            <Tab label="관리이력" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tab === 0 && <ProjectAdminTab />}
            {tab === 1 && <MasterTab />}
            {tab === 2 && <AccountTab />}
            {tab === 3 && <PermissionTab />}
            {tab === 4 && <ProjectLogTab />}
          </Box>
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default SettingsPage;
