import React, { useEffect, useState } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, Switch, Checkbox, FormControlLabel, Stack, Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LockReset as LockResetIcon } from '@mui/icons-material';
import { userApi } from '../../api/userApi';
import type { User } from '../../types';

const POSITIONS = ['센터장', '팀장', '차장', '과장', '대리'];

const AccountTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', display_name: '', role: 'user', position: '', team: '', in_dashboard: true, in_weekly: true });
  const [editForm, setEditForm] = useState({ username: '', display_name: '', role: 'user', is_active: true, position: '', team: '', in_dashboard: true, in_weekly: true });
  const [newPw, setNewPw] = useState('');

  useEffect(() => { userApi.list().then(setUsers); }, []);

  const handleCreate = async () => {
    if (!form.username.trim()) { alert('아이디를 입력하세요.'); return; }
    if (form.password.length < 6) { alert('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (!form.display_name.trim()) { alert('이름을 입력하세요.'); return; }
    try {
      await userApi.create(form);
      setCreateOpen(false);
      setForm({ username: '', password: '', display_name: '', role: 'user', position: '', team: '', in_dashboard: true, in_weekly: true });
      const list = await userApi.list();   // 서버에서 최신 목록 재조회
      setUsers(list);
    } catch (e: any) {
      alert(e.response?.data?.detail || '생성에 실패했습니다. (네트워크/서버 상태를 확인하세요)');
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editForm.username.trim()) { alert('아이디를 입력하세요.'); return; }
    try {
      const updated = await userApi.update(editTarget.id, editForm);
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      setEditTarget(null);
    } catch (e: any) { alert(e.response?.data?.detail || '수정에 실패했습니다.'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await userApi.delete(deleteTarget.id);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    await userApi.resetPassword(resetTarget.id, newPw);
    setResetTarget(null);
    setNewPw('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>계정 추가</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>아이디</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>직책</TableCell>
              <TableCell>소속</TableCell>
              <TableCell>역할</TableCell>
              <TableCell>참여</TableCell>
              <TableCell>상태</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.display_name}</TableCell>
                <TableCell>{u.position || '-'}</TableCell>
                <TableCell>{u.team || '-'}</TableCell>
                <TableCell>
                  <Chip label={u.role === 'admin' ? '관리자' : '일반'} size="small" color={u.role === 'admin' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {u.in_dashboard && <Chip size="small" label="대시보드" sx={{ height: 20, fontSize: 11 }} />}
                    {u.in_weekly && <Chip size="small" label="주간보고" sx={{ height: 20, fontSize: 11 }} />}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={u.is_active ? '활성' : '비활성'} size="small" color={u.is_active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => { setEditTarget(u); setEditForm({ username: u.username, display_name: u.display_name, role: u.role, is_active: u.is_active, position: u.position || '', team: u.team || '', in_dashboard: u.in_dashboard ?? true, in_weekly: u.in_weekly ?? true }); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setResetTarget(u)}>
                    <LockResetIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* 계정 생성 */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>계정 추가</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="아이디" size="small" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} fullWidth />
            <TextField label="비밀번호" type="password" size="small" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} fullWidth />
            <TextField label="이름" size="small" value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>직책</InputLabel>
              <Select value={form.position} label="직책" onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
                <MenuItem value="">미지정</MenuItem>
                {POSITIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="소속/팀" size="small" value={form.team} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>역할</InputLabel>
              <Select value={form.role} label="역할" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <MenuItem value="user">일반 사용자</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>참여</Typography>
              <Stack direction="row" spacing={1}>
                <FormControlLabel control={<Checkbox size="small" checked={form.in_dashboard} onChange={(e) => setForm((f) => ({ ...f, in_dashboard: e.target.checked }))} />} label="대시보드" />
                <FormControlLabel control={<Checkbox size="small" checked={form.in_weekly} onChange={(e) => setForm((f) => ({ ...f, in_weekly: e.target.checked }))} />} label="주간보고" />
              </Stack>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit">취소</Button>
          <Button onClick={handleCreate} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>

      {/* 계정 수정 */}
      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>계정 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="아이디" size="small" value={editForm.username} onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))} fullWidth />
            <TextField label="이름" size="small" value={editForm.display_name} onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>직책</InputLabel>
              <Select value={editForm.position} label="직책" onChange={(e) => setEditForm((f) => ({ ...f, position: e.target.value }))}>
                <MenuItem value="">미지정</MenuItem>
                {POSITIONS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="소속/팀" size="small" value={editForm.team} onChange={(e) => setEditForm((f) => ({ ...f, team: e.target.value }))} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>역할</InputLabel>
              <Select value={editForm.role} label="역할" onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                <MenuItem value="user">일반 사용자</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>참여</Typography>
              <Stack direction="row" spacing={1}>
                <FormControlLabel control={<Checkbox size="small" checked={editForm.in_dashboard} onChange={(e) => setEditForm((f) => ({ ...f, in_dashboard: e.target.checked }))} />} label="대시보드" />
                <FormControlLabel control={<Checkbox size="small" checked={editForm.in_weekly} onChange={(e) => setEditForm((f) => ({ ...f, in_weekly: e.target.checked }))} />} label="주간보고" />
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Switch checked={editForm.is_active} onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))} />
              <span>활성 계정</span>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleEdit} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      {/* 비밀번호 초기화 */}
      <Dialog open={Boolean(resetTarget)} onClose={() => setResetTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>비밀번호 초기화</DialogTitle>
        <DialogContent>
          <TextField label="새 비밀번호" type="password" size="small" value={newPw} onChange={(e) => setNewPw(e.target.value)} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleReset} variant="contained">초기화</Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>계정 삭제</DialogTitle>
        <DialogContent>"{deleteTarget?.display_name}" 계정을 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountTab;
