import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { projectApi } from '../../api/projectApi';
import { metaApi } from '../../api/metaApi';
import { userApi } from '../../api/userApi';
import type { Project, ProjectMeta, User, ProjectPayload } from '../../types';

interface Props {
  open: boolean;
  initial?: Project | null;   // null이면 생성
  onClose: () => void;
  onSaved: (p: Project) => void;
}

const empty: ProjectPayload = {
  name: '', code: '', description: '', type_id: null, pm_user_id: null,
  start_date: null, end_date: null, nas_path: '', git_url: '',
};

const ProjectFormDialog: React.FC<Props> = ({ open, initial, onClose, onSaved }) => {
  const [form, setForm] = useState<ProjectPayload>(empty);
  const [types, setTypes] = useState<ProjectMeta[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    metaApi.list('type').then(setTypes).catch(() => {});
    userApi.list().then(setUsers).catch(() => {});
    if (initial) {
      setForm({
        name: initial.name, code: initial.code ?? '', description: initial.description ?? '',
        type_id: initial.type_id ?? null, pm_user_id: initial.pm_user_id ?? null,
        start_date: initial.start_date ?? null, end_date: initial.end_date ?? null,
        nas_path: initial.nas_path ?? '', git_url: initial.git_url ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [open, initial]);

  const set = (k: keyof ProjectPayload, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { alert('프로젝트명을 입력하세요.'); return; }
    setSaving(true);
    try {
      const payload: ProjectPayload = {
        ...form,
        code: form.code || undefined,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      const saved = initial
        ? await projectApi.update(initial.id, payload)
        : await projectApi.create(payload);
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
      <DialogTitle>{initial ? '프로젝트 수정' : '프로젝트 등록'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1 }}>
          <TextField label="프로젝트명 *" size="small" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <TextField label="코드 (미입력 시 자동)" size="small" value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} />
          <FormControl size="small">
            <InputLabel>유형</InputLabel>
            <Select label="유형" value={form.type_id ?? ''} onChange={(e) => set('type_id', e.target.value === '' ? null : Number(e.target.value))}>
              <MenuItem value="">미지정</MenuItem>
              {types.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>PM</InputLabel>
            <Select label="PM" value={form.pm_user_id ?? ''} onChange={(e) => set('pm_user_id', e.target.value === '' ? null : Number(e.target.value))}>
              <MenuItem value="">미지정</MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="시작일" type="date" size="small" InputLabelProps={{ shrink: true }} value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} />
          <TextField label="마감예정일" type="date" size="small" InputLabelProps={{ shrink: true }} value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} />
          <TextField label="NAS 공유폴더" size="small" value={form.nas_path ?? ''} onChange={(e) => set('nas_path', e.target.value)} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="Git 저장소" size="small" value={form.git_url ?? ''} onChange={(e) => set('git_url', e.target.value)} sx={{ gridColumn: '1 / -1' }} />
          <TextField label="소개" size="small" multiline minRows={2} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} sx={{ gridColumn: '1 / -1' }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">취소</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{initial ? '저장' : '등록'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectFormDialog;
