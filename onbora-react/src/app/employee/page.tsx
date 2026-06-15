'use client';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import AgentSidebar from '@/components/AgentSidebar';
import ChatView from '@/components/ChatView';
import NewHireIntake from '@/components/NewHireIntake';
import { useOnbora } from '@/context/OnboraContext';

// Onbora block wordmark — mirrors the landing page mark (indigo tile, amber dot).
function OnboraMark() {
  return (
    <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}>
      <Box
        sx={{
          position: 'relative', width: 26, height: 26, borderRadius: '7px',
          bgcolor: '#4A3FA0', display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        <Box component="span" sx={{ fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 700, fontSize: 16, color: '#F1E8DA', lineHeight: 1 }}>
          O
        </Box>
        <Box sx={{ position: 'absolute', right: 4.5, bottom: 4.5, width: 3.5, height: 3.5, borderRadius: '50%', bgcolor: '#E6A53C' }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ letterSpacing: '-0.01em' }}>
        Onbora
      </Typography>
    </Box>
  );
}

export default function EmployeePage() {
  const { state } = useOnbora();
  const { newHireInterviewComplete } = state;

  // If new hire hasn't done their intake interview, show it first
  if (!newHireInterviewComplete) {
    return <NewHireIntake onComplete={() => {}} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* AppBar */}
      <AppBar
        position="static"
        color="transparent"
        sx={{ bgcolor: '#FBF5EA', flexShrink: 0 }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <OnboraMark />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            · Employee Onboarding
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button component={Link} href="/setup" size="small" color="inherit">
            HR Setup
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main layout: sidebar + chat */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <AgentSidebar />
        <ChatView />
      </Box>
    </Box>
  );
}
