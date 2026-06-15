'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useOnbora, Message } from '@/context/OnboraContext';
import { AGENTS } from './AgentSidebar';

function parseSuggestions(text: string): { cleanText: string; suggestions: string[] } {
  const suggestionMatch = text.match(/SUGGESTIONS:\s*(.+?)(?:\n|$)/i);
  if (!suggestionMatch) return { cleanText: text.trim(), suggestions: [] };

  const cleanText = text.replace(/SUGGESTIONS:\s*.+?(?:\n|$)/i, '').trim();
  const suggestions = suggestionMatch[1]
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  return { cleanText, suggestions };
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center', py: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          className="typing-dot"
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: color,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </Box>
  );
}

export default function ChatView() {
  const { state, dispatch } = useOnbora();
  const { currentAgent, conversationHistory, companyContext, newHireContext } = state;

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agent = AGENTS.find((a) => a.id === currentAgent)!;
  const messages = useMemo(
    () => conversationHistory[currentAgent] || [],
    [conversationHistory, currentAgent]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when agent switches
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentAgent]);

  // Show greeting on first message for each agent
  const getGreeting = () => {
    const newHireName = newHireContext?.name;
    const greetings: Record<string, string> = {
      maya: `Hi${newHireName ? ` ${newHireName}` : ''}! I'm Maya, your Welcome Guide. I'm here to make your first days feel smooth and fun. Ask me anything about getting settled in! 👋`,
      alex: `Hi! I'm Alex, your HR Assistant. I know the policies, benefits, and procedures inside and out. What can I help you with? 📋`,
      jordan: `Hey! I'm Jordan, your Culture Guide. I'll help you understand how this company really works — not just the official handbook version. What would you like to know? 🌟`,
      sam: `Hello! I'm Sam, your Tech Specialist. I can help you get all your tools and systems set up. What do you need help with? 💻`,
      buddy: `Hey${newHireName ? ` ${newHireName}` : ''}! I'm Buddy, your Peer Connector. I'm here to help you meet people and feel like you belong. Let's get you plugged in! 🤝`,
      coach: `Hi${newHireName ? ` ${newHireName}` : ''}! I'm Coach, your Role Coach. I'll help you ramp up fast and make a real impact in your first 30, 60, and 90 days. What's your role? 🎯`,
    };
    return greetings[currentAgent] || greetings.maya;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      role: 'user',
      message: text.trim(),
      agentId: currentAgent,
      timestamp: Date.now(),
    };

    dispatch({ type: 'ADD_MESSAGE', agentId: currentAgent, message: userMsg });
    setInputValue('');
    setIsTyping(true);

    try {
      // Try Claude multi-agent system first
      let data: { response?: string; agentId?: string; wasRouted?: boolean; isFallback?: boolean; error?: string } | null = null;

      const agentsRes = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          agentId: currentAgent,
          companyContext,
          conversationHistory: [...messages, userMsg],
          newHireContext,
        }),
      });

      if (agentsRes.ok) {
        data = await agentsRes.json();
      }

      // Fall back to Gemini for agents it knows (maya/alex/jordan/sam)
      if (!data || data.error) {
        const geminiAgents = ['maya', 'alex', 'jordan', 'sam'];
        const agentForGemini = geminiAgents.includes(currentAgent) ? currentAgent : 'maya';
        const fallbackRes = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            agentType: agentForGemini,
            companyContext,
            conversationHistory: [...messages, userMsg],
            newHireContext,
            isSmartMode: false,
          }),
        });
        data = { ...(await fallbackRes.json()), isFallback: true };
      }

      const resolvedAgentId = (data?.agentId as typeof currentAgent) || currentAgent;
      const { cleanText, suggestions } = parseSuggestions(data?.response || '');

      const aiMsg: Message = {
        role: 'assistant',
        message: cleanText,
        agentId: resolvedAgentId,
        timestamp: Date.now(),
        suggestions,
        isFallback: data?.isFallback,
      };

      // If routed to a different agent, add message to that agent's thread too
      if (data?.wasRouted && resolvedAgentId !== currentAgent) {
        dispatch({ type: 'ADD_MESSAGE', agentId: resolvedAgentId, message: aiMsg });
        // Also add a brief handoff note to the current agent's thread
        dispatch({
          type: 'ADD_MESSAGE',
          agentId: currentAgent,
          message: {
            role: 'assistant',
            message: `Great question! Let me pass you to ${AGENTS.find((a) => a.id === resolvedAgentId)?.name || 'a specialist'} who can help better with that. Check their tab for the response!`,
            agentId: currentAgent,
            timestamp: Date.now(),
          },
        });
      } else {
        dispatch({ type: 'ADD_MESSAGE', agentId: currentAgent, message: aiMsg });
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg: Message = {
        role: 'assistant',
        message: "I'm having trouble connecting right now. Please try again in a moment.",
        agentId: currentAgent,
        timestamp: Date.now(),
        isFallback: true,
      };
      dispatch({ type: 'ADD_MESSAGE', agentId: currentAgent, message: errMsg });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Get the last AI message's suggestions
  const lastAiMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const currentSuggestions = lastAiMsg?.suggestions || [];

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#F1E8DA',
      }}
    >
      {/* Agent header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#FBF5EA',
          borderBottom: '1px solid rgba(60,40,20,0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: agent.color,
            fontSize: '1.25rem',
          }}
        >
          {agent.emoji}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {agent.name}
            </Typography>
            <Chip
              label={agent.role}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: `${agent.color}18`,
                color: agent.color,
                fontWeight: 600,
                border: 'none',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {agent.description}
          </Typography>
        </Box>
        {newHireContext && (
          <Tooltip title={`Personalized for: ${newHireContext.role}`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: 'rgba(224,101,74,0.10)',
                px: 1.25,
                py: 0.5,
                borderRadius: 10,
                cursor: 'default',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                Personalized
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Chat messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, sm: 3 },
          py: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {/* Greeting bubble when no messages */}
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: agent.color, fontSize: '1.1rem', flexShrink: 0, mt: 0.25 }}>
              {agent.emoji}
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                maxWidth: '75%',
                bgcolor: '#fff',
                border: '1px solid rgba(60,40,20,0.14)',
                borderRadius: '4px 18px 18px 18px',
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {getGreeting()}
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <Box
            key={msg.timestamp}
            sx={{
              display: 'flex',
              flexDirection: msg.role === 'assistant' ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            {msg.role === 'assistant' && (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: agent.color,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {agent.emoji}
              </Avatar>
            )}
            <Box sx={{ maxWidth: '75%' }}>
              <Paper
                elevation={0}
                sx={{
                  px: 2,
                  py: 1.5,
                  ...(msg.role === 'assistant'
                    ? {
                        bgcolor: '#fff',
                        border: '1px solid rgba(60,40,20,0.14)',
                        borderRadius: '4px 18px 18px 18px',
                        color: 'text.primary',
                      }
                    : {
                        bgcolor: agent.color,
                        borderRadius: '18px 18px 4px 18px',
                        color: '#fff',
                      }),
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </Typography>
              </Paper>
              {msg.isFallback && (
                <Typography variant="caption" color="text.disabled" sx={{ pl: 1, display: 'block', mt: 0.25 }}>
                  Offline response
                </Typography>
              )}
            </Box>
          </Box>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: agent.color, fontSize: '1.1rem', flexShrink: 0 }}>
              {agent.emoji}
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: '#fff',
                border: '1px solid rgba(60,40,20,0.14)',
                borderRadius: '4px 18px 18px 18px',
              }}
            >
              <TypingIndicator color={agent.color} />
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Suggestion pills */}
      {currentSuggestions.length > 0 && !isTyping && (
        <Box
          sx={{
            px: 3,
            pb: 1.5,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            bgcolor: '#F1E8DA',
          }}
        >
          {currentSuggestions.map((s) => (
            <Chip
              key={s}
              label={s}
              className="suggestion-chip"
              onClick={() => handleSuggestion(s)}
              variant="outlined"
              size="small"
              sx={{
                borderColor: `${agent.color}40`,
                color: agent.color,
                bgcolor: `${agent.color}08`,
                fontWeight: 500,
                fontSize: '0.78rem',
                '&:hover': {
                  bgcolor: `${agent.color}14`,
                  borderColor: agent.color,
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Input area */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#FBF5EA',
          borderTop: '1px solid rgba(60,40,20,0.14)',
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${agent.name} anything...`}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: '#fff',
              '&:hover': { bgcolor: '#fff' },
              '&.Mui-focused': { bgcolor: '#fff' },
            },
          }}
        />
        <IconButton
          onClick={() => sendMessage(inputValue)}
          disabled={!inputValue.trim() || isTyping}
          sx={{
            bgcolor: agent.color,
            color: '#fff',
            width: 42,
            height: 42,
            flexShrink: 0,
            '&:hover': { bgcolor: agent.color, opacity: 0.88 },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
