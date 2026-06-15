'use client';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentId = 'maya' | 'alex' | 'jordan' | 'sam' | 'buddy' | 'coach';

export interface Message {
  role: 'user' | 'assistant';
  message: string;
  agentId?: AgentId;
  timestamp: number;
  suggestions?: string[];
  isFallback?: boolean;
}

export interface FileContent {
  name: string;
  content: string;
  pages?: number;
}

export interface CompanyContext {
  name: string;
  size: string;
  industry: string;
  documents: string[];
  insights: Record<string, string>;
  culture: string[];                  // HR interview answers
  fullDocumentContent: string;
}

export interface NewHireContext {
  role: string;
  excitement: string;
  concerns: string;
  name?: string;
}

export interface OnboraState {
  // Setup
  setupStep: number;                   // 0=company info, 1=upload, 2=hr interview, 3=done
  companyContext: CompanyContext | null;
  uploadedFiles: FileContent[];
  hrInterviewComplete: boolean;

  // Employee
  currentAgent: AgentId;
  conversationHistory: Record<AgentId, Message[]>;
  newHireContext: NewHireContext | null;
  newHireInterviewComplete: boolean;

  // UI state
  isLoading: boolean;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: OnboraState = {
  setupStep: 0,
  companyContext: null,
  uploadedFiles: [],
  hrInterviewComplete: false,
  currentAgent: 'maya',
  conversationHistory: {
    maya: [],
    alex: [],
    jordan: [],
    sam: [],
    buddy: [],
    coach: [],
  },
  newHireContext: null,
  newHireInterviewComplete: false,
  isLoading: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_SETUP_STEP'; step: number }
  | { type: 'SET_COMPANY_CONTEXT'; context: CompanyContext }
  | { type: 'ADD_UPLOADED_FILE'; file: FileContent }
  | { type: 'SET_HR_INTERVIEW_COMPLETE' }
  | { type: 'ADD_HR_CULTURE_ANSWER'; answer: string }
  | { type: 'SET_CURRENT_AGENT'; agentId: AgentId }
  | { type: 'ADD_MESSAGE'; agentId: AgentId; message: Message }
  | { type: 'SET_NEW_HIRE_CONTEXT'; context: NewHireContext }
  | { type: 'SET_NEW_HIRE_INTERVIEW_COMPLETE' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET_SETUP' };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function onboraReducer(state: OnboraState, action: Action): OnboraState {
  switch (action.type) {
    case 'SET_SETUP_STEP':
      return { ...state, setupStep: action.step };

    case 'SET_COMPANY_CONTEXT':
      return { ...state, companyContext: action.context };

    case 'ADD_UPLOADED_FILE':
      return {
        ...state,
        uploadedFiles: [...state.uploadedFiles, action.file],
        companyContext: state.companyContext
          ? {
              ...state.companyContext,
              documents: [...state.companyContext.documents, action.file.name],
              fullDocumentContent:
                (state.companyContext.fullDocumentContent || '') +
                '\n\n' +
                action.file.content,
            }
          : state.companyContext,
      };

    case 'SET_HR_INTERVIEW_COMPLETE':
      return { ...state, hrInterviewComplete: true };

    case 'ADD_HR_CULTURE_ANSWER':
      return {
        ...state,
        companyContext: state.companyContext
          ? {
              ...state.companyContext,
              culture: [...state.companyContext.culture, action.answer],
            }
          : state.companyContext,
      };

    case 'SET_CURRENT_AGENT':
      return { ...state, currentAgent: action.agentId };

    case 'ADD_MESSAGE':
      return {
        ...state,
        conversationHistory: {
          ...state.conversationHistory,
          [action.agentId]: [
            ...state.conversationHistory[action.agentId],
            action.message,
          ],
        },
      };

    case 'SET_NEW_HIRE_CONTEXT':
      return { ...state, newHireContext: action.context };

    case 'SET_NEW_HIRE_INTERVIEW_COMPLETE':
      return { ...state, newHireInterviewComplete: true };

    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };

    case 'RESET_SETUP':
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface OnboraContextType {
  state: OnboraState;
  dispatch: React.Dispatch<Action>;
}

const OnboraContext = createContext<OnboraContextType | null>(null);

export function OnboraProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboraReducer, initialState);
  return (
    <OnboraContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboraContext.Provider>
  );
}

export function useOnbora() {
  const ctx = useContext(OnboraContext);
  if (!ctx) throw new Error('useOnbora must be used within OnboraProvider');
  return ctx;
}
