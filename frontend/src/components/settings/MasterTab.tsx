import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, List, ListItem, ListItemText, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Paper,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { metaApi } from '../../api/metaApi';
import type { ProjectMeta } from '../../types';

const MetaSection: React.FC<{ kind: string; title: string }> = ({ kind, title }) => {
  const [items, setItems] = useState<ProjectMeta[]>([]);
  const [dialog, setDialog] = useState<{ mode: 'create' | 'edit'; target?: ProjectMeta } | null>(null);
  const [name, setName] = useState('');

  const load = () => { metaApi.list(kind).then(setItems); };
  useEffect(load, [kind]);

  const openCreate = () => { setName(''); setDialog({ mode: 'create' }); };
  const openEdit = (m: ProjectMeta) => { setName(m.name); setDialog({ mode: 'edit', target: m }); };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (dialog?.mode === 'edit' && dialog.target) {
        await metaApi.update(kind, dialog.target.id, { name });
      } else {
        await metaApi.create(kind, { name });
      }
      setDialog(null);
      load();
    } catch (e: any) { alert(e.response?.data?.detail || '저장 실패'); }
  };

  const handleDelete = async (m: ProjectMeta) => {
    if (!confirm(`"${m.name}"을(를) 삭제하시겠습니까?`)) return;
    try { await metaApi.remove(kind, m.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || '삭제 실패'); }
  };

  return (
    <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openCreate}>추가</Button>
      </Box>
      <List disablePadding>
        {items.map((m) => (
          <ListItem key={m.id} disablePadding secondaryAction={
            <Box>
              <IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(m)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          } sx={{ borderBottom: '1px solid #F1F5F9', py: 0.5 }}>
            <ListItemText primary={m.name} />
          </ListItem>
        ))}
        {items.length === 0 && <Typography variant="body2" color="text.disabled" sx={{ py: 2 }}>항목이 없습니다.</Typography>}
      </List>

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{title} {dialog?.mode === 'edit' ? '수정' : '추가'}</DialogTitle>
        <DialogContent>
          <TextField label="이름" size="small" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} color="inherit">취소</Button>
          <Button onClick={handleSave} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const MasterTab: React.FC = () => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}><MetaSection kind="type" title="프로젝트 유형" /></Grid>
    <Grid item xs={12} sm={6}><MetaSection kind="status" title="프로젝트 상태" /></Grid>
  </Grid>
);

export default MasterTab;
