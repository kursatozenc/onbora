'use client';
import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InterviewChat from './InterviewChat';
import { useOnbora } from '@/context/OnboraContext';
import type { CompanyContext } from '@/context/OnboraContext';

const STEPS = ['Company Info', 'Upload Documents', 'Culture Interview'];

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-1000', label: '501–1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Consulting', 'Media & Entertainment', 'Non-profit', 'Other',
];

const HR_QUESTIONS = [
  {
    question: "Tell me about your company's core values. What principles guide how people work together here?",
    placeholder: 'e.g. We prioritize transparency, move fast, and celebrate learning from failure...',
  },
  {
    question: "What does success look like in the first 90 days for a new hire? What should they focus on?",
    placeholder: 'e.g. Build relationships first, understand the roadmap, ship one small win...',
  },
  {
    question: "What's one thing about your culture that's hard to explain in a document — something newcomers always need to learn by experience?",
    placeholder: 'e.g. Our meetings are debate-heavy — speak up or your idea won\'t be heard...',
  },
];

interface UploadedFile {
  name: string;
  status: 'uploading' | 'done' | 'error';
  content?: string;
  error?: string;
  progress?: number;
}

// ─── Step 1: Company Info ─────────────────────────────────────────────────────

function CompanyInfoStep({
  onNext,
}: {
  onNext: (data: { name: string; size: string; industry: string }) => void;
}) {
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [industry, setIndustry] = useState('');

  const canContinue = name.trim() && size && industry;

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Tell us about your company
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        This helps your AI team understand who they're working for.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <TextField
          label="Company name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
          placeholder="Acme Corp"
        />

        <TextField
          select
          label="Company size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          fullWidth
        >
          {COMPANY_SIZES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          fullWidth
        >
          {INDUSTRIES.map((ind) => (
            <MenuItem key={ind} value={ind}>
              {ind}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          disabled={!canContinue}
          onClick={() => onNext({ name: name.trim(), size, industry })}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}

// ─── Step 2: Document Upload ──────────────────────────────────────────────────

function DocumentUploadStep({
  onNext,
  onBack,
}: {
  onNext: (files: UploadedFile[]) => void;
  onBack: () => void;
}) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const fileEntry: UploadedFile = {
      name: file.name,
      status: 'uploading',
      progress: 0,
    };
    setFiles((prev) => [...prev, fileEntry]);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const res = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? {
                ...f,
                status: data.success ? 'done' : 'error',
                content: data.textContent,
                error: data.success ? undefined : data.message,
              }
            : f
        )
      );
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleFiles = (selectedFiles: FileList) => {
    Array.from(selectedFiles)
      .filter((f) => f.type === 'application/pdf')
      .forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const doneFiles = files.filter((f) => f.status === 'done');
  const isUploading = files.some((f) => f.status === 'uploading');

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Upload company documents
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Share your employee handbook, culture deck, benefits guide, or any onboarding materials.
        Your AI team will read them so they can answer real questions.
      </Typography>

      {/* Drop zone */}
      <Paper
        elevation={0}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 5,
          border: `2px dashed`,
          borderColor: isDragging ? 'primary.main' : 'rgba(60,40,20,0.22)',
          borderRadius: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragging ? 'rgba(224,101,74,0.06)' : 'transparent',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(224,101,74,0.06)',
          },
        }}
      >
        <CloudUploadIcon
          sx={{ fontSize: 48, color: 'primary.main', mb: 1, opacity: 0.7 }}
        />
        <Typography variant="h6" fontWeight={500} gutterBottom>
          Drop PDF files here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse · PDF files only · up to 10 MB each
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          hidden
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </Paper>

      {/* File list */}
      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.name}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                mb: 1,
                border: '1px solid',
                borderColor:
                  file.status === 'error'
                    ? 'error.light'
                    : file.status === 'done'
                    ? 'success.light'
                    : 'divider',
              }}
            >
              <ListItemIcon>
                {file.status === 'done' ? (
                  <CheckCircleIcon color="success" />
                ) : file.status === 'error' ? (
                  <InsertDriveFileIcon color="error" />
                ) : (
                  <InsertDriveFileIcon color="primary" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  file.status === 'uploading'
                    ? 'Processing...'
                    : file.status === 'error'
                    ? file.error
                    : `Ready · ${file.content ? Math.round(file.content.length / 100) / 10 : 0}k chars extracted`
                }
                secondaryTypographyProps={{
                  color:
                    file.status === 'error'
                      ? 'error.main'
                      : file.status === 'done'
                      ? 'success.main'
                      : 'text.secondary',
                }}
              />
              {file.status === 'uploading' && (
                <LinearProgress sx={{ width: 80, ml: 1 }} />
              )}
              {file.status === 'done' && (
                <Chip label="Ready" color="success" size="small" />
              )}
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {files.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              You can skip this step
            </Typography>
          )}
          <Button
            variant="contained"
            size="large"
            disabled={isUploading}
            onClick={() => onNext(doneFiles)}
          >
            {files.length === 0 ? 'Skip for now' : 'Continue'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Step 3: HR Interview ─────────────────────────────────────────────────────

function HRInterviewStep({
  companyName,
  onComplete,
  onBack,
}: {
  companyName: string;
  onComplete: (answers: string[]) => void;
  onBack: () => void;
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: '#4FA08D',
            fontSize: '1.5rem',
          }}
        >
          🌟
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Now, let me learn your culture
          </Typography>
          <Typography color="text.secondary">
            I'm Jordan, your Culture Guide. I'll ask you 3 questions about {companyName || 'your company'}.
            Your answers help your entire AI team give advice that actually fits your workplace.
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: 'rgba(79,160,141,0.06)',
          border: '1px solid rgba(79,160,141,0.18)',
          borderRadius: 3,
        }}
      >
        <InterviewChat
          agentName="Jordan"
          agentRole="Culture Guide"
          agentEmoji="🌟"
          agentColor="#4FA08D"
          introMessage={`Hi! I'm Jordan, ${companyName ? `${companyName}'s` : 'your'} Culture Guide. Documents tell me the what — but I want to learn the how. Let me ask you 3 questions.`}
          questions={HR_QUESTIONS}
          onComplete={onComplete}
          completionTitle="Culture captured! 🎉"
          completionMessage={`Thank you. I've captured what makes ${companyName || 'your company'} unique. Your entire AI team is now ready to give advice that actually fits your culture.`}
          ctaLabel="Launch your AI team →"
        />
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} size="small">
          Back
        </Button>
      </Box>
    </Box>
  );
}

// ─── SetupWizard (main) ────────────────────────────────────────────────────────

export default function SetupWizard({
  onSetupComplete,
}: {
  onSetupComplete: () => void;
}) {
  const { dispatch } = useOnbora();
  const [activeStep, setActiveStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState<{
    name: string;
    size: string;
    industry: string;
  } | null>(null);

  const handleCompanyInfo = (data: { name: string; size: string; industry: string }) => {
    setCompanyInfo(data);

    // Initialize company context in state
    dispatch({
      type: 'SET_COMPANY_CONTEXT',
      context: {
        name: data.name,
        size: data.size,
        industry: data.industry,
        documents: [],
        insights: {},
        culture: [],
        fullDocumentContent: '',
      },
    });
    setActiveStep(1);
  };

  const handleDocumentsDone = (files: UploadedFile[]) => {
    // Add uploaded files to context
    files.forEach((file) => {
      if (file.content) {
        dispatch({
          type: 'ADD_UPLOADED_FILE',
          file: { name: file.name, content: file.content },
        });
      }
    });
    setActiveStep(2);
  };

  const handleInterviewComplete = (answers: string[]) => {
    // Save culture answers
    answers.forEach((answer) => {
      dispatch({ type: 'ADD_HR_CULTURE_ANSWER', answer });
    });
    dispatch({ type: 'SET_HR_INTERVIEW_COMPLETE' });
    onSetupComplete();
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 } }}>
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 5 }}>
        {STEPS.map((label, i) => (
          <Step key={label} completed={activeStep > i}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      {activeStep === 0 && (
        <CompanyInfoStep onNext={handleCompanyInfo} />
      )}
      {activeStep === 1 && (
        <DocumentUploadStep
          onNext={handleDocumentsDone}
          onBack={() => setActiveStep(0)}
        />
      )}
      {activeStep === 2 && (
        <HRInterviewStep
          companyName={companyInfo?.name || ''}
          onComplete={handleInterviewComplete}
          onBack={() => setActiveStep(1)}
        />
      )}
    </Box>
  );
}
