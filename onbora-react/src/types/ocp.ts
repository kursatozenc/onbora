// Onboarding Context Profile (OCP)
//
// The canonical artifact produced by Onbora's setup process.
// Structured around Hackman's Team Design model (Team OS) + project-specific context.
// Two contributors: HR layer (policy/company) and Manager layer (team/project).
// Neither blocks the other — the profile enriches progressively.

// ─── Completion tracking ──────────────────────────────────────────────────────

export type CompletionLevel = 'empty' | 'partial' | 'complete';

export interface FieldCompletion {
  goals: CompletionLevel;
  roles: CompletionLevel;
  tasks: CompletionLevel;
  norms: CompletionLevel;
  rituals: CompletionLevel;
  projectContext: CompletionLevel;
  hrLayer: CompletionLevel;
}

// ─── Team OS — extracted by Hackman framework ─────────────────────────────────

export interface TeamGoals {
  mission: string;                        // what the team exists to do
  quarterlyPriorities: string[];          // top 3-5 current priorities
  successDefinition: string;             // how the team knows it's winning
  metrics: string[];                      // how progress is measured
}

export interface TeamRole {
  name: string;
  responsibilities: string;
  decisionRights: string;                 // what they can decide alone
  collaborators: string[];               // key people they work with
}

export interface TeamRoles {
  members: TeamRole[];
  goToForWhat: Record<string, string>;   // "for X, go to Y"
  decisionProcess: string;              // how the team makes decisions
  escalationPath: string;
}

export interface TeamTasks {
  coreDeliverables: string[];
  recurringRhythms: string[];            // e.g. "weekly planning every Monday"
  toolsAndSystems: string[];
  deliveryCadence: string;
}

export interface TeamNorms {
  explicitRules: string[];               // written/stated rules
  unwrittenRules: string[];              // what actually matters but isn't documented
  communicationStyle: string;            // async vs sync, directness, etc.
  psychologicalSafetyNotes: string;     // what makes this team safe/unsafe to speak up
  whatAnnoysTheTeam: string[];          // friction points — honest capture
}

export interface TeamRituals {
  officialMeetings: string[];            // what's on the calendar
  unofficialRhythms: string[];          // what actually happens (the pulse)
  howTeamMarksMilestones: string;       // celebrations, retros, etc.
  onboardingTraditions: string[];       // what new people typically do
}

export interface TeamOS {
  goals: Partial<TeamGoals>;
  roles: Partial<TeamRoles>;
  tasks: Partial<TeamTasks>;
  norms: Partial<TeamNorms>;
  rituals: Partial<TeamRituals>;
  lastUpdatedBy: 'hr' | 'manager' | 'both';
  lastUpdatedAt: string;                // ISO timestamp
}

// ─── HR Layer — company/policy context ────────────────────────────────────────

export interface HRLayer {
  companyName: string;
  companySize: string;
  industry: string;
  benefits: string;
  policies: string[];
  complianceNotes: string;
  hrContact: string;
  documentContent: string;              // extracted PDF text
  documentNames: string[];
  completedAt: string | null;           // ISO timestamp, null if not yet filled
}

// ─── Project Context — per onboarding session ─────────────────────────────────

export interface Milestone {
  name: string;
  dueDate: string;
  status: 'upcoming' | 'in-progress' | 'at-risk' | 'complete';
  owner: string;
}

export interface ProjectContext {
  projectName: string;
  projectScope: string;
  timeline: string;
  milestones: Milestone[];
  currentBlockers: string[];
  keyStakeholders: Array<{ name: string; role: string; relevance: string }>;
  expectations: {
    thirtyDays: string;
    sixtyDays: string;
    ninetyDays: string;
  };
  criticalResources: Array<{ name: string; url?: string; description: string }>;
}

// ─── Onboarding session — ties a person to a company's OCP ───────────────────

export type OnboardingScenario = 'new-employee' | 'internal-transfer' | 'ai-agent';

export interface OnboardingSession {
  id: string;
  companyId: string;
  scenario: OnboardingScenario;
  onboardeeName: string;
  onboardeeRole: string;
  onboardeeType: 'human' | 'ai-agent';
  intakeAnswers: {
    role: string;
    excitement: string;
    concerns: string;
  };
  projectContext: Partial<ProjectContext>;
  startedAt: string;
  completedAt: string | null;
}

// ─── The canonical OCP artifact ───────────────────────────────────────────────

export interface OnboardingContextProfile {
  id: string;
  companyId: string;
  version: number;
  teamOS: Partial<TeamOS>;
  hrLayer: Partial<HRLayer>;
  completion: FieldCompletion;
  createdAt: string;
  updatedAt: string;
}

// ─── Agent injection payload — what each agent receives ──────────────────────
// A structured subset of the OCP, serialized for a given agent's domain.

export interface AgentOCPPayload {
  companyName: string;
  industry: string;
  companySize: string;
  teamGoals: Partial<TeamGoals> | null;
  teamNorms: Partial<TeamNorms> | null;
  teamRituals: Partial<TeamRituals> | null;
  teamRoles: Partial<TeamRoles> | null;
  teamTasks: Partial<TeamTasks> | null;
  projectContext: Partial<ProjectContext> | null;
  documentSummary: string;
  onboardeeRole: string;
  onboardeeScenario: OnboardingScenario;
}

// ─── OCP completeness utilities ───────────────────────────────────────────────

export function computeCompletion(ocp: OnboardingContextProfile): FieldCompletion {
  const os = ocp.teamOS;
  const hr = ocp.hrLayer;

  const level = (obj: object | undefined | null, requiredKeys: string[]): CompletionLevel => {
    if (!obj) return 'empty';
    const filled = requiredKeys.filter(k => {
      const v = (obj as Record<string, unknown>)[k];
      return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
    });
    if (filled.length === 0) return 'empty';
    if (filled.length < requiredKeys.length) return 'partial';
    return 'complete';
  };

  return {
    goals: level(os?.goals, ['mission', 'successDefinition']),
    roles: level(os?.roles, ['members', 'decisionProcess']),
    tasks: level(os?.tasks, ['coreDeliverables', 'recurringRhythms']),
    norms: level(os?.norms, ['explicitRules', 'unwrittenRules']),
    rituals: level(os?.rituals, ['unofficialRhythms']),
    projectContext: 'empty',            // populated per-session, not at OCP level
    hrLayer: level(hr, ['companyName', 'industry', 'companySize']),
  };
}

export function ocpCompletionScore(completion: FieldCompletion): number {
  const weights: Record<keyof FieldCompletion, number> = {
    goals: 20,
    roles: 15,
    tasks: 15,
    norms: 20,
    rituals: 15,
    projectContext: 5,
    hrLayer: 10,
  };
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const level = completion[key as keyof FieldCompletion];
    if (level === 'complete') score += weight;
    else if (level === 'partial') score += weight * 0.5;
  }
  return Math.round(score);
}

// ─── OCP → agent injection ────────────────────────────────────────────────────

export function buildAgentPayload(
  ocp: OnboardingContextProfile,
  session: OnboardingSession
): AgentOCPPayload {
  return {
    companyName: ocp.hrLayer?.companyName ?? '',
    industry: ocp.hrLayer?.industry ?? '',
    companySize: ocp.hrLayer?.companySize ?? '',
    teamGoals: ocp.teamOS?.goals ?? null,
    teamNorms: ocp.teamOS?.norms ?? null,
    teamRituals: ocp.teamOS?.rituals ?? null,
    teamRoles: ocp.teamOS?.roles ?? null,
    teamTasks: ocp.teamOS?.tasks ?? null,
    projectContext: session.projectContext ?? null,
    documentSummary: ocp.hrLayer?.documentContent?.slice(0, 2000) ?? '',
    onboardeeRole: session.onboardeeRole,
    onboardeeScenario: session.scenario,
  };
}
