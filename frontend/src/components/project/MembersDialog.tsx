import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  Select, MenuItem, FormControl, InputLabel, IconButton, Typography,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { projectApi } from '../../api/projectApi';
import { userApi } from '../../api/userApi';
import type { User, ProjectMember } from '../../types';

interface Props {
  open: boolean;
  projectId: number;
  onClose: () => void;
  onSaved: (members: ProjectMember[]) => void;
}

interface Row { user_id: number | ''; role: string; }

const MembersDialog: React.FC<Props> = ({ open, projectId, onClose, onSaved }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    userApi.list().then(setUsers).catch(() => {});
    projectApi.getMembers(projectId).then((ms) => {
      setRows(ms.map((m) => ({ user_id: m.user_id, role: m.role })));
    });
  }, [open, projectId]);

  const addRow = () => setRows((r) => [...r, { user_id: '', role: 'member' }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const taken = rows.map((r) => r.user_id).filter((v) => v !== '') as number[];

  const handleSave = async () => {
    const members = rows
      .filter((r) => r.user_id !== '')
      .map((r) => ({ user_id: r.user_id as number, role: r.role }));
    setSaving(true);
    try {
      const saved = await projectApi.setMembers(projectId, members);
      onSaved(saved);
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>팀원 배정</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          {rows.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              아래 + 버튼으로 팀원을 추가하세요.
            </Typography>
          )}
          {rows.map((row, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>팀원</InputLabel>
                <Select
                  label="팀원"
                  value={row.user_id}
                  onChange={(e) => setRow(i, { user_id: Number(e.target.value) })}
                >
                  {users
                    .filter((u) => u.id === row.user_id || !taken.includes(u.id))
                    .map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}{u.position ? ` (${u.position})` : ''}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel>역할</InputLabel>
                <Select label="역할" value={row.role} onChange={(e) => setRow(i, { role: e.target.value })}>
                  <MenuItem value="pm">PM</MenuItem>
                  <MenuItem value="member">팀원</MenuItem>
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => removeRow(i)}><CloseIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button startIcon={<AddIcon />} onClick={addRow} sx={{ alignSelf: 'flex-start' }}>팀원 추가</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>저장</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembersDialog;
