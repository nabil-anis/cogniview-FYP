
import { Profile, Interview, InterviewSession, InterviewResponse, EvaluationResult } from '../types';
import { supabase } from './supabase';

const CURRENT_USER_KEY = 'cogniview_current_user_v2';

// Helpers to map between App (camelCase) and DB (snake_case)
const mapProfileToDb = (p: Profile) => ({
  id: p.id,
  email: p.email,
  name: p.name,
  role: p.role,
  company_name: p.companyName,
  logo_url: p.logoUrl
});

const mapProfileFromDb = (p: any): Profile => ({
  id: p.id,
  email: p.email,
  name: p.name,
  role: p.role,
  companyName: p.company_name,
  logoUrl: p.logo_url
});

const mapInterviewToDb = (i: Interview) => ({
  id: i.id,
  recruiter_id: i.recruiterId,
  company_name: i.companyName,
  job_role: i.jobRole,
  code: i.code,
  title: i.title,
  questions: i.questions, // JSON
  parameters: i.parameters, // JSON
  status: i.status,
  created_at: new Date(i.createdAt).toISOString()
});

const mapInterviewFromDb = (i: any): Interview => ({
  id: i.id,
  recruiterId: i.recruiter_id,
  companyName: i.company_name,
  jobRole: i.job_role,
  code: i.code,
  title: i.title,
  questions: i.questions,
  parameters: i.parameters,
  status: i.status,
  createdAt: new Date(i.created_at).getTime()
});

const mapSessionToDb = (s: InterviewSession) => ({
  id: s.id,
  interview_id: s.interviewId,
  interview_title: s.interviewTitle,
  company_name: s.companyName,
  candidate_id: s.candidateId,
  candidate_name: s.candidateName,
  candidate_email: s.candidateEmail,
  status: s.status,
  decision: s.decision,
  started_at: new Date(s.startedAt).toISOString(),
  completed_at: s.completedAt ? new Date(s.completedAt).toISOString() : null,
  termination_reason: s.terminationReason
});

const mapSessionFromDb = (s: any): InterviewSession => ({
  id: s.id,
  interviewId: s.interview_id,
  interviewTitle: s.interview_title,
  companyName: s.company_name,
  candidateId: s.candidate_id,
  candidateName: s.candidate_name,
  candidateEmail: s.candidate_email,
  status: s.status,
  decision: s.decision,
  startedAt: new Date(s.started_at).getTime(),
  completedAt: s.completed_at ? new Date(s.completed_at).getTime() : undefined,
  terminationReason: s.termination_reason
});

const mapResponseToDb = (r: InterviewResponse) => ({
  id: r.id,
  session_id: r.sessionId,
  question_id: r.questionId,
  question_text: r.questionText,
  response_text: r.responseText,
  timestamp: new Date(r.timestamp).toISOString()
});

const mapResponseFromDb = (r: any): InterviewResponse => ({
  id: r.id,
  sessionId: r.session_id,
  questionId: r.question_id,
  questionText: r.question_text,
  responseText: r.response_text,
  timestamp: new Date(r.timestamp).getTime()
});

const mapEvaluationToDb = (e: EvaluationResult) => ({
  id: e.id,
  response_id: e.responseId,
  overall_score: e.overallScore,
  parameter_scores: e.parameterScores, // JSON
  analysis: e.analysis // JSON
});

const mapEvaluationFromDb = (e: any): EvaluationResult => ({
  id: e.id,
  responseId: e.response_id,
  overallScore: e.overall_score,
  parameterScores: e.parameter_scores,
  analysis: e.analysis
});

export const db = {
  profiles: {
    getByEmail: async (email: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('email', email).single();
      return data ? mapProfileFromDb(data) : undefined;
    },
    save: async (profile: Profile) => {
      await supabase.from('profiles').upsert(mapProfileToDb(profile));
    }
  },
  interviews: {
    getAll: async () => {
      const { data } = await supabase.from('interviews').select('*');
      return (data || []).map(mapInterviewFromDb);
    },
    getByCode: async (code: string) => {
      const { data } = await supabase.from('interviews').select('*').eq('code', code.toUpperCase()).single();
      return data ? mapInterviewFromDb(data) : undefined;
    },
    save: async (interview: Interview) => {
      await supabase.from('interviews').upsert(mapInterviewToDb(interview));
    },
    delete: async (id: string) => {
      await supabase.from('interviews').delete().eq('id', id);
    }
  },
  sessions: {
    save: async (session: InterviewSession) => {
      await supabase.from('sessions').upsert(mapSessionToDb(session));
    },
    getAll: async () => {
      const { data } = await supabase.from('sessions').select('*');
      return (data || []).map(mapSessionFromDb);
    },
    getById: async (id: string) => {
      const { data } = await supabase.from('sessions').select('*').eq('id', id).single();
      return data ? mapSessionFromDb(data) : undefined;
    },
    getByCandidateId: async (candidateId: string) => {
      const { data } = await supabase.from('sessions').select('*').eq('candidate_id', candidateId);
      return (data || []).map(mapSessionFromDb);
    },
    update: async (session: InterviewSession) => {
      await supabase.from('sessions').upsert(mapSessionToDb(session));
    }
  },
  responses: {
    save: async (res: InterviewResponse) => {
      await supabase.from('responses').upsert(mapResponseToDb(res));
    },
    getBySession: async (sessionId: string) => {
      const { data } = await supabase.from('responses').select('*').eq('session_id', sessionId);
      return (data || []).map(mapResponseFromDb);
    }
  },
  evaluations: {
    save: async (ev: EvaluationResult) => {
      await supabase.from('evaluations').upsert(mapEvaluationToDb(ev));
    },
    getBySession: async (sessionId: string) => {
      // Logic: Get response IDs for session, then find evaluation for one of them
      const { data: responses } = await supabase.from('responses').select('id').eq('session_id', sessionId);
      if (!responses || responses.length === 0) return undefined;
      
      const responseIds = responses.map(r => r.id);
      const { data: evals } = await supabase.from('evaluations').select('*').in('response_id', responseIds).limit(1);
      
      return evals && evals.length > 0 ? mapEvaluationFromDb(evals[0]) : undefined;
    }
  },
  auth: {
    // Keep using LocalStorage for session persistence to avoid full Auth refactor
    getCurrentUser: () => {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    },
    login: async (profile: Profile) => {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
      // Ensure profile exists in DB
      await db.profiles.save(profile);
    },
    logout: () => localStorage.removeItem(CURRENT_USER_KEY)
  }
};
