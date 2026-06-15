'use client';
/**
 * NewHireIntake — 3-question intake interview for new hires
 * Runs on first visit to the employee view, before chat unlocks.
 * Results are stored as NewHireContext and injected into all agent system prompts.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import InterviewChat from './InterviewChat';
import { useOnbora } from '@/context/OnboraContext';

const NEW_HIRE_QUESTIONS = [
  {
    question: "What's your role? Tell me a little about your background and what brought you here.",
    placeholder: 'e.g. I\'m joining as a Product Designer — I was previously at a fintech startup...',
  },
  {
    question: "What are you most excited to learn or explore in your first few weeks here?",
    placeholder: 'e.g. I\'m excited to understand the product roadmap and meet the design team...',
  },
  {
    question: "Is there anything you're nervous or curious about? No wrong answers — I want to help.",
    placeholder: 'e.g. I\'m a bit nervous about the pace — I want to make sure I ramp up quickly...',
  },
];

export default function NewHireIntake({ onComplete }: { onComplete: () => void }) {
  const { state, dispatch } = useOnbora();
  const companyName = state.companyContext?.name || 'the team';

  const handleInterviewComplete = (answers: string[]) => {
    const [role, excitement, concerns] = answers;

    dispatch({
      type: 'SET_NEW_HIRE_CONTEXT',
      context: { role, excitement, concerns },
    });
    dispatch({ type: 'SET_NEW_HIRE_INTERVIEW_COMPLETE' });
    onComplete();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        px: { xs: 2, sm: 3 },
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box sx={{ maxWidth: 640, width: '100%', mb: 4, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'rgba(224,101,74,0.10)',
            px: 2,
            py: 0.75,
            borderRadius: 10,
            mb: 3,
          }}
        >
          <Chip
            label={`Welcome to ${companyName}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ border: 'none', bgcolor: 'transparent', fontSize: '0.8rem' }}
          />
        </Box>

        <Typography variant="h4" fontWeight={500} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          Your AI team already knows the company.
        </Typography>
        <Typography variant="h6" color="primary.main" fontWeight={400} gutterBottom>
          Now let them know you.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: 'auto' }}>
          Maya will ask you 3 quick questions. Your answers help the whole team give you
          advice that actually fits your situation — not just generic onboarding scripts.
        </Typography>
      </Box>

      {/* Interview card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          maxWidth: 640,
          width: '100%',
          border: '1px solid rgba(60,40,20,0.14)',
          borderRadius: 3,
          bgcolor: '#fff',
        }}
      >
        {/* Agent intro */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#E0654A',
              fontSize: '1.5rem',
            }}
          >
            👋
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Maya · Welcome Guide
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I'll get you connected with the right people right away
            </Typography>
          </Box>
        </Box>

        <InterviewChat
          agentName="Maya"
          agentRole="Welcome Guide"
          agentEmoji="👋"
          agentColor="#E0654A"
          introMessage={`Hi! I'm Maya, your Welcome Guide at ${companyName}. Before I introduce you to the rest of the team, I'd love to learn a bit about you. It'll only take a minute, and it helps everyone on the team give you advice that's actually relevant to your situation.`}
          questions={NEW_HIRE_QUESTIONS}
          onComplete={handleInterviewComplete}
          completionTitle="Perfect — I'm on it! 🎉"
          completionMessage="I've shared your background with the team. They're ready to give you personalized guidance. Let's go meet everyone!"
          ctaLabel="Meet your AI team →"
        />
      </Paper>
    </Box>
  );
}
