import { createTheme } from '@mui/material';

export type ColorMode = 'light' | 'dark';

export const getTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#3B82F6' },
      warning: { main: '#F59E0B' },
      ...(mode === 'light'
        ? {
            background: { default: '#F8FAFC', paper: '#FFFFFF' },
            divider: '#E2E8F0',
          }
        : {
            background: { default: '#0B1220', paper: '#141C2B' },
            divider: '#293548',
          }),
    },
    typography: {
      fontFamily: '"Noto Sans KR", "Roboto", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: { root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 } },
      },
      MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
    },
  });
