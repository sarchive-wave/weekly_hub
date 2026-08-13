import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Chip, Stack, Typography, TextField, InputAdornment, TablePagination,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Group as GroupIcon } from '@mui/icons-material';
import ProjectFormDialog from '../project/ProjectFormDialog';
import MembersDialog from '../project/MembersDialog';
import { projectApi } from '../../api/projectApi';
import type { Project } from '../../types';

const PAGE_SIZE = 10;

const ProjectAdminTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [membersTarget, setMembersTarget] = useState<Project | null>(null);
  const [keyword, setKeyword] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'code' | 'name' | 'type' | 'status'>('all');
  const [page, setPage] = useState(0);

  const load = () => { projectApi.list().then(setProjects); };
  useEffect(load, []);

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (p: Project) => { setEditTarget(p); setFormOpen(true); };

  const handleDelete = async (p: Project) => {
    if (!confirm(`"${p.name}" 프로젝트를 삭제하시겠습니까?\n관련 주간보고 항목도 함께 삭제됩니다.`)) return;
    try { await projectApi.remove(p.id); load(); }
    catch (e: any) { alert(e.response?.data?.detail || '삭제 실패'); }
  };

  // 검색(코드·명·상태) + 완료는 맨 뒤로 정렬
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const fieldsOf = (p: Project) => {
      switch (searchField) {
        case 'code': return [p.code];
        case 'name': return [p.name];
        case 'type': return [p.type_name];
        case 'status': return [p.status_name];
        default: return [p.code, p.name, p.type_name, p.status_name];
      }
    };
    const matched = projects.filter((p) => {
      if (!kw) return true;
      return fieldsOf(p).some((v) => (v ?? '').toLowerCase().includes(kw));
    });
    return matched
      .map((p, i) => ({ p, i }))
      .sort((a, b) => {
        const da = a.p.status_name === '완료' ? 1 : 0;
        const db = b.p.status_name === '완료' ? 1 : 0;
        return da - db || a.i - b.i;  // 완료 뒤로, 그 외 기존 순서 유지
      })
      .map((x) => x.p);
  }, [projects, keyword, searchField]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const onSearch = (v: string) => { setKeyword(v); setPage(0); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>프로젝트 목록</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>프로젝트 등록</Button>
      </Box>

      {/* 검색: 구분자 선택 + 검색어 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>검색 항목</InputLabel>
          <Select
            value={searchField}
            label="검색 항목"
            onChange={(e) => { setSearchField(e.target.value as typeof searchField); setPage(0); }}
          >
            <MenuItem value="all">전체</MenuItem>
            <MenuItem value="code">코드</MenuItem>
            <MenuItem value="name">프로젝트명</MenuItem>
            <MenuItem value="type">유형</MenuItem>
            <MenuItem value="status">상태</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small" fullWidth placeholder="검색어 입력"
          value={keyword} onChange={(e) => onSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell>코드</TableCell>
              <TableCell>프로젝트명</TableCell>
              <TableCell>유형</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>노출</TableCell>
              <TableCell align="right">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>{p.code}</Typography></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                <TableCell>{p.type_name ?? '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={p.status_name ?? '-'} color={p.status_name === '완료' ? 'default' : 'primary'} sx={{ height: 20, fontSize: 11 }} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {p.show_in_dashboard && <Chip size="small" label="대시보드" sx={{ height: 20, fontSize: 11 }} />}
                    {p.show_in_weekly && <Chip size="small" label="주간보고" sx={{ height: 20, fontSize: 11 }} />}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" title="팀원 배정" onClick={() => setMembersTarget(p)}><GroupIcon fontSize="small" /></IconButton>
                  <IconButton size="small" title="수정" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" title="삭제" onClick={() => handleDelete(p)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.disabled', py: 3 }}>
                {keyword ? '검색 결과가 없습니다.' : '등록된 프로젝트가 없습니다.'}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {filtered.length > PAGE_SIZE && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={safePage}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / 총 ${count}`}
        />
      )}

      <ProjectFormDialog
        open={formOpen}
        initial={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={() => load()}
      />

      <MembersDialog
        open={!!membersTarget}
        projectId={membersTarget?.id ?? 0}
        onClose={() => setMembersTarget(null)}
        onSaved={() => { setMembersTarget(null); load(); }}
      />
    </Box>
  );
};

export default ProjectAdminTab;
