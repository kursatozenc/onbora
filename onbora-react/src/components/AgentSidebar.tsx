'use client';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { useOnbora, AgentId } from '@/context/OnboraContext';

export const AGENTS: {
  id: AgentId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  description: string;
  specialties: string[];
}[] = [
  {
    id: 'maya',
    name: 'Maya',
    role: 'Welcome Guide',
    emoji: '👋',
    color: '#E0654A',
    description: 'First-day experience, office orientation, getting settled',
    specialties: ['First day', 'Office tour', 'Introductions'],
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'HR Assistant',
    emoji: '📋',
    color: '#4A3FA0',
    description: 'Benefits, policies, paperwork, HR procedures',
    specialties: ['Benefits', 'Policies', 'Payroll'],
  },
  {
    id: 'jordan',
    name: 'Jordan',
    role: 'Culture Guide',
    emoji: '🌟',
    color: '#4FA08D',
    description: 'Company values, unwritten rules, team dynamics',
    specialties: ['Culture', 'Values', 'Team'],
  },
  {
    id: 'sam',
    name: 'Sam',
    role: 'Tech Specialist',
    emoji: '💻',
    color: '#E6A53C',
    description: 'Tech setup, software access, IT troubleshooting',
    specialties: ['Setup', 'Software', 'IT'],
  },
  {
    id: 'buddy',
    name: 'Buddy',
    role: 'Peer Connector',
    emoji: '🤝',
    color: '#D98A8A',
    description: 'Social integration, meeting colleagues, team events',
    specialties: ['Social', 'Team events', 'Connections'],
  },
  {
    id: 'coach',
    name: 'Coach',
    role: 'Role Coach',
    emoji: '🎯',
    color: '#5B86B3',
    description: 'Role-specific success, 30/60/90 day plan, early wins',
    specialties: ['30/60/90', 'Early wins', 'Growth'],
  },
];

export default function AgentSidebar() {
  const { state, dispatch } = useOnbora();
  const { currentAgent, conversationHistory } = state;

  const selectAgent = (agentId: AgentId) => {
    dispatch({ type: 'SET_CURRENT_AGENT', agentId });
  };

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: '#FBF5EA',
        borderRight: '1px solid rgba(60,40,20,0.14)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Your AI Team
        </Typography>
      </Box>

      {/* Agent list */}
      <List sx={{ flex: 1, px: 1.5, py: 0.5, overflowY: 'auto' }}>
        {AGENTS.map((agent) => {
          const isActive = currentAgent === agent.id;
          const msgCount = conversationHistory[agent.id]?.length || 0;

          return (
            <ListItemButton
              key={agent.id}
              selected={isActive}
              onClick={() => selectAgent(agent.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                py: 1.5,
                px: 1.5,
                alignItems: 'flex-start',
                '&.Mui-selected': {
                  bgcolor: `${agent.color}14`,
                },
                '&.Mui-selected:hover': {
                  bgcolor: `${agent.color}22`,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, mt: 0.25 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: isActive ? agent.color : `${agent.color}22`,
                    fontSize: '1.1rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {agent.emoji}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {agent.name}
                    </Typography>
                    {isActive && (
                      <Chip
                        label="Active"
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          bgcolor: agent.color,
                          color: '#fff',
                          fontWeight: 600,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {agent.role}
                    </Typography>
                    {msgCount > 0 && (
                      <Typography variant="caption" color="text.disabled" display="block">
                        {msgCount} message{msgCount !== 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      {/* Specialties for active agent */}
      {(() => {
        const agent = AGENTS.find((a) => a.id === currentAgent);
        return agent ? (
          <Box sx={{ p: 2, pb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              {agent.name} specializes in
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {agent.specialties.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  size="small"
                  sx={{
                    bgcolor: `${agent.color}15`,
                    color: agent.color,
                    fontWeight: 500,
                    border: 'none',
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Box>
          </Box>
        ) : null;
      })()}
    </Box>
  );
}
