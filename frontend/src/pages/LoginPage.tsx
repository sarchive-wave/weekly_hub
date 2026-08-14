import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, ThemeProvider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTheme } from '../theme';

// 로그인 화면은 전역 다크모드와 무관하게 항상 라이트(흰 카드·검은 글자)로 렌더 → 입력 가시성/자동완성 보장
const lightTheme = getTheme('light');

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) { setError('아이디와 비밀번호를 입력해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000000' }}>
      <ThemeProvider theme={lightTheme}>
        <Card elevation={0} sx={{ width: 380, bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 3, color: '#0F172A' }}>AI Weekly Hub</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                size="small"
                fullWidth
                autoFocus
              />
              <TextField
                placeholder="비밀번호"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="small"
                fullWidth
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 1, py: 1.2 }}>
                로그인
              </Button>
            </Box>
          </CardContent>
        </Card>
      </ThemeProvider>
    </Box>
  );
};

export default LoginPage;
