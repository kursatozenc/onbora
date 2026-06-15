'use client';
/**
 * InterviewChat — Reusable full-screen interview UI
 * Used in both:
 *  - SetupWizard step 3 (HR admin interview)
 *  - NewHireIntake (new hire interview)
 */
import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export interface InterviewQuestion {
  question: string;
  placeholder?: string;
}

interface InterviewChatProps {
  agentName: string;
  agentRole: string;
  agentEmoji: string;
  agentColor: string;
  introMessage: string;
  questions: InterviewQuestion[];
  onComplete: (answers: string[]) => void;
  completionTitle?: string;
  completionMessage?: string;
  ctaLabel?: string;
}

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}

export default function InterviewChat({
  agentName,
  agentRole,
  agentEmoji,
  agentColor,
  introMessage,
  questions,
  onComplete,
  completionTitle = 'All done!',
  completionMessage = 'Thank you for sharing. I\'ve captured everything.',
  ctaLabel = 'Continue →',
}: InterviewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: introMessage },
    { role: 'ai', text: questions[0]?.question || '' },
  ]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isComplete) {
      inputRef.current?.focus();
    }
  }, [currentQuestion, isComplete]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isComplete) return;

    const answer = inputValue.trim();
    setInputValue('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text: answer }]);

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    const nextQuestion = currentQuestion + 1;

    if (nextQuestion < questions.length) {
      // Show typing then next question
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: questions[nextQuestion].question },
      ]);
      setCurrentQuestion(nextQuestion);
    } else {
      // Interview complete
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setIsTyping(false);
      setIsComplete(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const progress = ((currentQuestion + (isComplete ? 1 : 0)) / questions.length) * 100;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 400,
        maxHeight: 560,
        position: 'relative',
      }}
    >
      {/* Progress bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Question {Math.min(currentQuestion + (isComplete ? 1 : 0), questions.length)} of {questions.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            bgcolor: 'rgba(42,38,32,0.10)',
            '& .MuiLinearProgress-bar': { bgcolor: agentColor },
          }}
        />
      </Box>

      {/* Chat messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pr: 0.5,
          pb: 1,
        }}
      >
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              flexDirection: msg.role === 'ai' ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            {msg.role === 'ai' && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: agentColor,
                  fontSize: '1rem',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {agentEmoji}
              </Avatar>
            )}
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.25,
                maxWidth: '80%',
                ...(msg.role === 'ai'
                  ? {
                      bgcolor: `${agentColor}14`,
                      borderRadius: '4px 18px 18px 18px',
                      color: 'text.primary',
                    }
                  : {
                      bgcolor: agentColor,
                      borderRadius: '18px 18px 4px 18px',
                      color: '#fff',
                    }),
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                {msg.text}
              </Typography>
            </Paper>
          </Box>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: agentColor,
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              {agentEmoji}
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: `${agentColor}14`,
                borderRadius: '4px 18px 18px 18px',
                display: 'flex',
                gap: 0.5,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  className="typing-dot"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: agentColor,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </Paper>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* Completion card or input */}
      {isComplete ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 2,
            bgcolor: 'rgba(79, 160, 141, 0.10)',
            border: '1px solid rgba(79, 160, 141, 0.28)',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <CheckCircleOutlineIcon
            sx={{ fontSize: 40, color: '#4FA08D', mb: 1 }}
          />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {completionTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {completionMessage}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => onComplete(answers)}
            sx={{ bgcolor: agentColor, '&:hover': { bgcolor: agentColor, opacity: 0.92 } }}
          >
            {ctaLabel}
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            alignItems: 'flex-end',
          }}
        >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              questions[currentQuestion]?.placeholder || 'Type your answer...'
            }
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#fff',
              },
            }}
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            sx={{
              bgcolor: agentColor,
              color: '#fff',
              width: 42,
              height: 42,
              flexShrink: 0,
              '&:hover': { bgcolor: agentColor, opacity: 0.88 },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Agent identifier */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1.5, textAlign: 'center', display: 'block' }}
      >
        {agentName} · {agentRole}
      </Typography>
    </Box>
  );
}
