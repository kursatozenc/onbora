'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import SetupWizard from '@/components/SetupWizard';
import { useOnbora } from '@/context/OnboraContext';

// Onbora block wordmark — mirrors the landing page mark (indigo tile, amber dot).
function OnboraMark() {
  return (
    <Box
      component={Link}
      href="/"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none' }}
    >
      <Box
        sx={{
          position: 'relative', width: 28, height: 28, borderRadius: '8px',
          bgcolor: '#4A3FA0', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        <Box component="span" sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, fontSize: 17, color: '#F1E8DA', lineHeight: 1 }}>
          O
        </Box>
        <Box sx={{ position: 'absolute', right: 5, bottom: 5, width: 4, height: 4, borderRadius: '50%', bgcolor: '#E6A53C' }} />
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ letterSpacing: '-0.01em' }}>
        Onbora
      </Typography>
    </Box>
  );
}

function SetupComplete() {
  const { state } = useOnbora();
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 8,
      }}
    >
      <Avatar
        sx={{
          width: 72,
          height: 72,
          bgcolor: 'rgba(79, 160, 141, 0.14)',
          mb: 3,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 42, color: '#4FA08D' }} />
      </Avatar>
      <Typography variant="h4" fontWeight={500} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
        Your AI team is ready!
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 440, mb: 4, lineHeight: 1.7 }}>
        {state.companyContext?.name || 'Your company'}'s AI onboarding team is now briefed and ready
        to guide new hires. Share the employee link to get started.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid rgba(60,40,20,0.14)',
          borderRadius: 2,
          maxWidth: 440,
          width: '100%',
          bgcolor: '#FBF5EA',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Employee onboarding link
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {typeof window !== 'undefined' ? `${window.location.origin}/employee` : '/employee'}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" size="large" component={Link} href="/employee">
          Preview employee view →
        </Button>
        <Button variant="outlined" size="large" component={Link} href="/">
          Back to home
        </Button>
      </Box>
    </Box>
  );
}

export default function SetupPage() {
  const [setupComplete, setSetupComplete] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="sticky"
        color="transparent"
        sx={{ bgcolor: 'rgba(251,245,234,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <Toolbar>
          <OnboraMark />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            · Setup
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: { xs: 4, md: 6 } }}>
        {setupComplete ? (
          <SetupComplete />
        ) : (
          <SetupWizard onSetupComplete={() => setSetupComplete(true)} />
        )}
      </Box>
    </Box>
  );
}
