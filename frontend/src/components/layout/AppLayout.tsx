import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, Button,
} from '@mui/material';
import { AccountCircle as AccountCircleIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChangePasswordDialog from './ChangePasswordDialog';

interface Props {
  children: React.ReactNode;
}

const NAV = [
  { label: '대시보드', path: '/' },
  { label: '프로젝트', path: '/projects' },
  { label: '종료', path: '/closed' },
  { label: '주간회의', path: '/weekly' },
];

const AppLayout: React.FC<Props> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [pwOpen, setPwOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#1E293B' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, mr: 3 }}
            onClick={() => navigate('/')}
          >
            AI Weekly Hub
          </Typography>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {NAV.map((item) => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.65)',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  borderBottom: isActive(item.path) ? '2px solid #60A5FA' : '2px solid transparent',
                  borderRadius: 0,
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {isAdmin && (
            <IconButton color="inherit" onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          )}
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <AccountCircleIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled sx={{ fontSize: 14, color: 'text.secondary' }}>
              {user?.display_name}
            </MenuItem>
            <MenuItem onClick={() => { setPwOpen(true); setAnchorEl(null); }}>
              비밀번호 변경
            </MenuItem>
            <MenuItem onClick={() => { logout(); navigate('/login'); }}>
              로그아웃
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, p: 3 }}>
        {children}
      </Box>
      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </Box>
  );
};

export default AppLayout;
