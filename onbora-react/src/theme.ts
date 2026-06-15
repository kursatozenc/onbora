'use client';
import { createTheme } from '@mui/material/styles';

// Fauna · Playful Blocks — shared visual language with the landing page.
// Warm almond canvas, coral primary, teal secondary, rounded Hanken Grotesk.
const FAUNA = {
  almond: '#F1E8DA',
  paper: '#FBF5EA',
  ink: '#2A2620',
  inkLine: 'rgba(60,40,20,0.14)',
  coral: '#E0654A',
  coralDark: '#C9543B',
  coralLight: '#E8836C',
  teal: '#4FA08D',
  tealDark: '#3E8576',
};

const theme = createTheme({
  palette: {
    primary: {
      main: FAUNA.coral,
      light: FAUNA.coralLight,
      dark: FAUNA.coralDark,
      contrastText: '#fff',
    },
    secondary: {
      main: FAUNA.teal,
      light: '#6FB6A4',
      dark: FAUNA.tealDark,
      contrastText: '#fff',
    },
    background: {
      default: FAUNA.almond,
      paper: FAUNA.paper,
    },
    text: {
      primary: FAUNA.ink,
      secondary: 'rgba(42,38,32,0.66)',
    },
    divider: FAUNA.inkLine,
  },
  typography: {
    fontFamily: '"Hanken Grotesk", system-ui, -apple-system, sans-serif',
    h1: { fontWeight: 700, fontSize: '3.5rem', lineHeight: 1.08, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '2.25rem', lineHeight: 1.12, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.15, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4, letterSpacing: '0.02em' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        sizeLarge: { padding: '14px 30px', fontSize: '1rem' },
        sizeSmall: { padding: '7px 18px', fontSize: '0.8125rem' },
        outlinedPrimary: {
          borderColor: FAUNA.ink,
          color: FAUNA.ink,
          '&:hover': { borderColor: FAUNA.ink, backgroundColor: 'rgba(42,38,32,0.06)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          boxShadow: 'none',
          border: `1px solid ${FAUNA.inkLine}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 14 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 22 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${FAUNA.inkLine}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          '&.Mui-selected': {
            backgroundColor: 'rgba(224,101,74,0.10)',
            '&:hover': { backgroundColor: 'rgba(224,101,74,0.15)' },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 5 },
      },
    },
  },
});

export default theme;
