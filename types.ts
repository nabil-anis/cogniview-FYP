
export type UserRole = 'recruiter' | 'interviewee' | 'admin';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  logoUrl?: string; // Base64 or URL
  theme?: {
    primary: string;
    accent: string;
  };
}

export interface EvaluationParameter {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface Question {
  id: string;
  text: string;
  variants: string[];
}

export interface Interview {
  id: string;
  recruiterId: string;
  companyName: string;
  jobRole: string;
  code: string;
  title?: string;
  questions: Question[];
  parameters: EvaluationParameter[];
  status: 'draft' | 'active' | 'archived';
  createdAt: number;
}

export type SessionDecision = 'pending' | 'passed' | 'failed';

export interface InterviewSession {
  id: string;
  interviewId: string;
  interviewTitle: string;
  companyName: string;
  candidateId: string; 
  candidateName: string;
  candidateEmail: string;
  status: 'in_progress' | 'completed' | 'abandoned' | 'terminated_early';
  decision: SessionDecision;
  startedAt: number;
  completedAt?: number;
  terminationReason?: string;
}

export interface InterviewResponse {
  id: string;
  sessionId: string;
  questionId: string;
  questionText: string;
  responseText: string;
  timestamp: number;
}

export interface EvaluationResult {
  id: string;
  responseId: string;
  overallScore: number;
  parameterScores: Record<string, number>;
  analysis: {
    summary: string;
    strengths: { title: string; description: string; evidence: string }[];
    weaknesses: { title: string; description: string; suggestions: string }[];
    recommendation: string;
    confidence: number;
  };
}
