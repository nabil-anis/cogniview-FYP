
import React, { useState, useEffect } from 'react';
import { Button, Card } from '../../components/Shared';
import { db } from '../../services/db';
import { aiService } from '../../services/gemini';
import { Interview, InterviewSession, EvaluationResult, SessionDecision } from '../../types';

export const Results: React.FC<{ interviewId: string, onBack: () => void }> = ({ interviewId, onBack }) => {
  const [interview, setInterview] = useState<Interview | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const allInterviews = await db.interviews.getAll();
        const i = allInterviews.find(x => x.id === interviewId);
        if (i) {
          setInterview(i);
          const allSessions = await db.sessions.getAll();
          setSessions(allSessions.filter(s => s.interviewId === interviewId));
        }
    };
    fetchData();
  }, [interviewId]);

  const updateDecision = async (decision: SessionDecision) => {
    if (!selectedSession) return;
    const updated = { ...selectedSession, decision };
    await db.sessions.update(updated);
    setSelectedSession(updated);
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
    
    // Show toast notification "Email sent"
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const runEvaluation = async (session: InterviewSession) => {
    if (session.status === 'terminated_early') {
      setSelectedSession(session);
      setEvaluation(null);
      return;
    }

    setLoading(true);
    setSelectedSession(session);
    setEvaluation(null); // Reset prev evaluation while loading
    
    try {
      const existing = await db.evaluations.getBySession(session.id);
      if (existing) {
        setEvaluation(existing);
        setLoading(false);
        return;
      }

      const responses = await db.responses.getBySession(session.id);
      const result = await aiService.evaluateCandidate(
        interview!.jobRole,
        interview!.parameters,
        responses.map(r => ({ q: r.questionText, a: r.responseText }))
      );

      const ev: EvaluationResult = {
        id: Math.random().toString(36).substr(2, 9),
        responseId: responses[0]?.id || 'none',
        ...result
      };
      await db.evaluations.save(ev);
      setEvaluation(ev);
    } catch (e) {
      console.error(e);
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!interview) return null;

  // --- CANDIDATE POOL VIEW (List) ---
  if (!selectedSession) {
    const uniqueCandidates = new Set(sessions.map(s => s.candidateEmail)).size;

    return (
      <div className="min-h-screen bg-black text-white px-4 md:px-8 pb-12 pt-32 animate-in fade-in duration-700">
         <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#007AFF]/10 to-transparent pointer-events-none"></div>
         
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-[0.2em]">Analytics Terminal</p>
              <h1 className="text-3xl font-bold tracking-tight text-white">{interview.title || interview.jobRole}</h1>
            </div>
            <Button variant="ghost" onClick={onBack} className="rounded-xl px-4 h-10 font-medium border border-white/10 hover:bg-white/10 w-full md:w-auto text-white text-xs">Exit</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass p-6 rounded-[24px] border border-white/10 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/10 blur-[50px] rounded-full"></div>
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Total Sessions</p>
               <p className="text-5xl font-semibold text-white">{sessions.length}</p>
               <p className="text-[10px] text-white/30 mt-2 uppercase tracking-wider">{uniqueCandidates} Unique Candidates</p>
            </div>
            <div className="glass p-6 rounded-[24px] border border-white/10 text-center bg-[#007AFF] text-white shadow-[0_10px_30px_rgba(0,122,255,0.2)]">
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Shortlisted</p>
               <p className="text-5xl font-semibold">{sessions.filter(s => s.decision === 'passed').length}</p>
            </div>
            <div className="glass p-6 rounded-[24px] border border-white/10 text-center">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Rejected</p>
               <p className="text-5xl font-semibold text-white/50">{sessions.filter(s => s.decision === 'failed').length}</p>
            </div>
          </div>

          <div className="glass rounded-[24px] border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-bold tracking-tight text-white">Candidate Pool</h2>
            </div>
            <div className="divide-y divide-white/5">
              {sessions.length === 0 ? (
                <div className="p-12 text-center text-white/20 font-bold uppercase tracking-widest text-xs">Waiting for data transmission...</div>
              ) : (
                sessions.map(s => {
                  // Logic to calculate attempts
                  const candidateHistory = sessions.filter(h => h.candidateId === s.candidateId).sort((a, b) => a.startedAt - b.startedAt);
                  const attemptIndex = candidateHistory.findIndex(h => h.id === s.id) + 1;
                  const totalAttempts = candidateHistory.length;
                  const isMultiAttempt = totalAttempts > 1;

                  return (
                    <div key={s.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/5 transition-all cursor-pointer group gap-4" onClick={() => runEvaluation(s)}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg flex-shrink-0 ${s.status === 'terminated_early' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20'}`}>
                          {s.candidateName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-base text-white tracking-tight leading-none truncate">{s.candidateName}</p>
                            {isMultiAttempt && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                                Attempt {attemptIndex}/{totalAttempts}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-white/40 truncate">{s.candidateEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center w-full md:w-auto justify-between md:justify-end md:space-x-8 pl-14 md:pl-0">
                        <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1">
                          <span className={`px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            s.decision === 'passed' ? 'bg-[#007AFF]/20 text-[#007AFF]' : 
                            s.decision === 'failed' ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/40'
                          }`}>
                            {s.decision}
                          </span>
                          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(s.startedAt).toLocaleDateString()} {new Date(s.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all">
                           <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
       <div className="w-12 h-12 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin"></div>
       <h2 className="text-sm font-bold text-white tracking-widest uppercase animate-pulse">Generating Insights...</h2>
    </div>
  );

  // --- DETAILS VIEW (Bento Grid) ---
  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-8 pb-12 pt-32 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigation & Actions */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSelectedSession(null)} className="p-3 glass rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
              <svg className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-bold tracking-tight text-white leading-none">{selectedSession.candidateName}</h1>
                 {/* Show attempt badge in details view as well if applicable */}
                 {(() => {
                    const attempts = sessions.filter(s => s.candidateId === selectedSession.candidateId).length;
                    return attempts > 1 ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                            {attempts} Attempts Found
                        </span>
                    ) : null;
                 })()}
              </div>
              <p className="text-[10px] font-bold text-[#007AFF] uppercase tracking-[0.2em] mt-1.5">Comprehensive Analysis</p>
            </div>
          </div>
        </div>

        {selectedSession.status === 'terminated_early' ? (
           <div className="bg-red-500/10 p-12 rounded-[24px] text-center space-y-6 border border-red-500/20 mt-8">
             <div className="text-5xl mb-2">🚫</div>
             <h2 className="text-3xl font-bold text-red-500 tracking-tight uppercase">Flagged</h2>
             <p className="text-lg font-medium text-white/80 max-w-xl mx-auto">"{selectedSession.terminationReason}"</p>
           </div>
        ) : evaluation ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            
            {/* Block 1: Overall Fit Score (Large Square) */}
            <div className="col-span-1 md:col-span-1 row-span-1 md:row-span-2 bg-[#1C1C1E] rounded-[24px] p-6 flex flex-col items-center justify-between border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/20 blur-[50px] rounded-full group-hover:bg-[#007AFF]/30 transition-colors duration-500"></div>
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 relative z-10 w-full text-center">Fit Score</p>
               <div className="relative z-10 flex flex-col items-center">
                  <span className="text-7xl font-semibold tracking-tighter text-white">{Math.round(evaluation.overallScore)}</span>
                  <div className="w-8 h-1 bg-[#007AFF] rounded-full mt-3"></div>
               </div>
               <p className="text-center text-white/50 text-[10px] font-medium max-w-[120px] relative z-10">Calculated based on {interview.parameters.length} weighted parameters.</p>
            </div>

            {/* Block 2: Recommendation (Wide Rectangle) */}
            <div className="col-span-1 md:col-span-2 bg-[#2C2C2E] rounded-[24px] p-6 flex flex-col justify-center border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#007AFF]/10 to-transparent pointer-events-none"></div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#007AFF] mb-1.5">AI Recommendation</p>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{evaluation.analysis.recommendation}</h2>
            </div>

             {/* Block 3: Confidence (Square) */}
             <div className="col-span-1 md:col-span-1 bg-[#1C1C1E] rounded-[24px] p-6 flex flex-col items-center justify-center border border-white/5 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#007AFF] flex items-center justify-center mb-3">
                   <span className="text-xs font-bold text-white">{Math.round(evaluation.analysis.confidence * 100)}%</span>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Confidence</p>
            </div>

            {/* Block 4: Key Strength (Square) */}
             <div className="col-span-1 md:col-span-1 bg-[#1C1C1E] rounded-[24px] p-6 flex flex-col justify-between border border-white/5">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500 mb-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Top Strength</p>
                   <p className="text-base font-bold text-white leading-tight line-clamp-2">{evaluation.analysis.strengths[0]?.title || "N/A"}</p>
                </div>
            </div>

            {/* Block 5: Summary (Large/Tall Rectangle) */}
            <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 bg-[#1C1C1E] rounded-[24px] p-8 border border-white/5 flex flex-col">
               <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Executive Summary</p>
               <p className="text-base text-white/80 leading-relaxed font-medium">"{evaluation.analysis.summary}"</p>
               
               <div className="mt-auto pt-6">
                  <div className="h-px w-full bg-white/10 mb-4"></div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                     {Object.entries(evaluation.parameterScores).map(([key, score]) => (
                        <div key={key} className="flex-shrink-0 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                           <span className="text-[9px] font-bold text-white/40 block mb-0.5 uppercase tracking-wider">{key}</span>
                           <span className="text-sm font-bold text-white">{score}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Block 6: Weakness (Square) */}
            <div className="col-span-1 md:col-span-1 bg-[#1C1C1E] rounded-[24px] p-6 flex flex-col justify-between border border-white/5">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500 mb-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">Area of Focus</p>
                   <p className="text-base font-bold text-white leading-tight line-clamp-2">{evaluation.analysis.weaknesses[0]?.title || "None"}</p>
                </div>
            </div>

          </div>

          {/* Action Buttons (Inline) */}
          <div className="flex justify-center items-center gap-4 mt-12 mb-6">
             <Button 
                onClick={() => updateDecision('failed')} 
                variant="ghost" 
                className={`w-32 rounded-full h-10 text-[10px] font-bold uppercase tracking-widest transition-all ${
                   selectedSession.decision === 'failed' ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#1C1C1E] border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
             >
                Reject
             </Button>
             <Button 
                onClick={() => updateDecision('passed')} 
                variant="ghost" 
                className={`w-32 rounded-full h-10 text-[10px] font-bold uppercase tracking-widest transition-all ${
                   selectedSession.decision === 'passed' ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-[#1C1C1E] border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
             >
                Approve
             </Button>
          </div>
          </>
        ) : null}

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-10 right-10 bg-white text-black px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 z-50 flex items-center gap-3">
             <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
             </div>
             <div>
                <p className="text-xs font-bold">Email Sent</p>
                <p className="text-[10px] text-black/60">Candidate has been notified.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
