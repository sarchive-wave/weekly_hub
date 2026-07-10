import React, { useEffect, useState } from 'react';
import {
  Box, Button, List, ListItem, ListItemText, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectApi } from '../../api/projectApi';
import type { Project } from '../../types';

const SortableItem: React.FC<{
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ project, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      disablePadding
      secondaryAction={
        <Box>
          <IconButton size="small" onClick={onEdit}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={onDelete}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      }
      sx={{ bgcolor: 'white', mb: 0.5, border: '1px solid #E2E8F0', borderRadius: 1, pr: 10 }}
    >
      <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', mx: 0.5 }}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <ListItemText primary={project.name} />
    </ListItem>
  );
};

const ProjectTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [name, setName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { projectApi.list().then(setProjects); }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      const newOrder = arrayMove(projects, oldIndex, newIndex);
      setProjects(newOrder);
      await projectApi.reorder(newOrder.map((p) => p.id));
    }
  };

  const handleCreate = async () => {
    try {
      const p = await projectApi.create(name);
      setProjects((prev) => [...prev, p]);
      setCreateOpen(false);
      setName('');
    } catch (e: any) { alert(e.response?.data?.detail || '생성 실패'); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    try {
      const updated = await projectApi.update(editTarget.id, name);
      setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setEditTarget(null);
      setName('');
    } catch (e: any) { alert(e.response?.data?.detail || '수정 실패'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await projectApi.delete(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setName(''); setCreateOpen(true); }}>프로젝트 추가</Button>
      </Box>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <List disablePadding>
            {projects.map((p) => (
              <SortableItem
                key={p.id}
                project={p}
                onEdit={() => { setEditTarget(p); setName(p.name); }}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>
      {projects.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>등록된 프로젝트가 없습니다.</Box>
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>프로젝트 추가</DialogTitle>
        <DialogContent>
          <TextField label="프로젝트명" size="small" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit">취소</Button>
          <Button onClick={handleCreate} variant="contained">추가</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>프로젝트 수정</DialogTitle>
        <DialogContent>
          <TextField label="프로젝트명" size="small" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mt: 1 }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleEdit} variant="contained">저장</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>프로젝트 삭제</DialogTitle>
        <DialogContent>"{deleteTarget?.name}" 프로젝트를 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">삭제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectTab;
