import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Alert,
} from '@mui/material';
import { authApi } from '../../api/authApi';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<Props> = ({ open, onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setCurrent(''); setNext(''); setConfirm(''); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (next !== confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return; }
    if (next.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    setSubmitting(true);
    try {
      await authApi.changePassword(current, next);
      handleClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>비밀번호 변경</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="현재 비밀번호" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} size="small" fullWidth />
          <TextField label="새 비밀번호" type="password" value={next} onChange={(e) => setNext(e.target.value)} size="small" fullWidth />
          <TextField label="새 비밀번호 확인" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} size="small" fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">취소</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>변경</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
