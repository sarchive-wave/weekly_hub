import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs, Paper } from '@mui/material';
import AppLayout from '../components/layout/AppLayout';
import AccountTab from '../components/settings/AccountTab';
import ProjectTab from '../components/settings/ProjectTab';

const SettingsPage: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>설정</Typography>
        <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E2E8F0', px: 2 }}>
            <Tab label="계정 관리" />
            <Tab label="프로젝트 관리" />
          </Tabs>
          <Box sx={{ p: 3 }}>
            {tab === 0 && <AccountTab />}
            {tab === 1 && <ProjectTab />}
          </Box>
        </Paper>
      </Box>
    </AppLayout>
  );
};

export default SettingsPage;
