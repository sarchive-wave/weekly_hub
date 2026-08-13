import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { weekApi } from '../../api/weekApi';
import type { OverallSummary } from '../../types';

interface Props {
  weekId: number;
  title: string;
}

const OverallReport: React.FC<Props> = ({ weekId, title }) => {
  const [summary, setSummary] = useState<OverallSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    weekApi.getSummary(weekId)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [weekId]);

  const openPreview = () => {
    if (!summary) return;
    const win = window.open('', '_blank', 'width=860,height=700,scrollbars=yes');
    if (!win) return;

    const projects = summary.projects;
    const PINNED = '휴가 및 교육';

    const renderItems = (items: string[], isPinned: boolean) =>
      items.length === 0
        ? `<span class="empty">${isPinned ? 'N/A' : '-'}</span>`
        : items.map((w) => `<div class="item">• ${w.replace(/\n/g, '<br>')}</div>`).join('');

    const currentSection = projects.map((p) => {
      const isPinned = p.project_name === PINNED;
      return `
        <div class="project-block${isPinned ? ' pinned' : ''}">
          <div class="project-name">${p.project_name}</div>
          <div class="content">${renderItems(p.current_work, isPinned)}</div>
        </div>`;
    }).join('');

    const nextSection = projects.map((p) => {
      const isPinned = p.project_name === PINNED;
      return `
        <div class="project-block${isPinned ? ' pinned' : ''}">
          <div class="project-name">${p.project_name}</div>
          <div class="content">${renderItems(p.next_work, isPinned)}</div>
        </div>`;
    }).join('');

    win.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title} 주간보고 미리보기</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; background: #F8FAFC; color: #1E293B; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #64748B; margin-bottom: 28px; }
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .section { background: white; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
    .section-header { padding: 12px 18px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: white; }
    .section-header.current { background: #0F172A; }
    .section-header.next { background: #0F172A; }
    .section-body { padding: 12px 0; }
    .project-block { padding: 10px 18px; border-bottom: 1px solid #F1F5F9; }
    .project-block:last-child { border-bottom: none; }
    .project-block.pinned .project-name { color: #1E40AF; }
    .project-name { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
    .content { font-size: 13.5px; line-height: 1.65; color: #334155; }
    .item { margin-bottom: 3px; }
    .empty { color: #CBD5E1; font-style: italic; }
  </style>
</head>
<body>
  <h1>${title} 전체 주간보고</h1>
  <p class="subtitle">팀 전체 업무 취합본 · 텍스트를 드래그하여 복사할 수 있습니다.</p>
  <div class="columns">
    <div class="section">
      <div class="section-header current">금주 업무</div>
      <div class="section-body">${currentSection}</div>
    </div>
    <div class="section">
      <div class="section-header next">차주 업무</div>
      <div class="section-body">${nextSection}</div>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>{title} 전체 주간보고</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<OpenInNewIcon fontSize="small" />}
          onClick={openPreview}
          disabled={!summary || summary.projects.length === 0}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          미리보기
        </Button>
      </Box>
      {summary?.projects.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          아직 작성된 주간보고가 없습니다.
        </Typography>
      )}
      {summary?.projects.map((project) => {
        const isPinned = project.project_name === '휴가 및 교육';
        return (
          <Paper key={project.project_id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: isPinned ? '#1E3A8A' : '#0F172A', px: 2.5, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={600} color="white">{project.project_name}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <Box sx={{ p: 2.5, borderRight: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  금주 업무
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {project.current_work.length === 0
                    ? <Typography variant="body2" color="text.disabled">{isPinned ? 'N/A' : '-'}</Typography>
                    : project.current_work.map((w, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>• {w}</Typography>
                    ))}
                </Box>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  차주 업무
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {project.next_work.length === 0
                    ? <Typography variant="body2" color="text.disabled">{isPinned ? 'N/A' : '-'}</Typography>
                    : project.next_work.map((w, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>• {w}</Typography>
                    ))}
                </Box>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

export default OverallReport;
