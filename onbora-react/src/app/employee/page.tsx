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
    <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ letterSpacing: '-0.01em' }}>
        Onbora<Box component="span" sx={{ color: 'primary.main' }}>.</Box>
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
