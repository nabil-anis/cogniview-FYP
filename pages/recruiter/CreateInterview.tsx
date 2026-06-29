
import React, { useState } from 'react';
import { Button, Input, Card } from '../../components/Shared';
import { db } from '../../services/db';
import { aiService } from '../../services/gemini';
import { Question, EvaluationParameter, Profile } from '../../types';

export const CreateInterview: React.FC<{ user: Profile, onBack: () => void }> = ({ user, onBack }) => {
  const [title, setTitle] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [companyName, setCompanyName] = useState(user.companyName || '');
  const [parameters, setParameters] = useState<EvaluationParameter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  
  const handleGenerateParams = async () => {
    if (!jobRole.trim()) return;
    setLoadingAI(true);
    const suggested = await aiService.generateParameters(jobRole);
    setParameters(suggested);
    setLoadingAI(false);
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    const q: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: newQuestion,
      variants: [newQuestion]
    };
    setQuestions([...questions, q]);
    setNewQuestion('');
  };

  const handleAddParam = () => {
    setParameters([...parameters, {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      weight: 0
    }]);
  };

  const updateParam = (id: string, field: keyof EvaluationParameter, value: any) => {
    setParameters(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeParam = (id: string) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    if (!jobRole || !companyName) {
      alert("Please fill in the job details.");
      return;
    }
    setSaving(true);
    try {
      const interview = {
        id: Math.random().toString(36).substr(2, 9),
        recruiterId: user.id,
        companyName,
        jobRole,
        code: Math.random().toString(36).substr(2, 6).toUpperCase(),
        title: title.trim() || jobRole,
        questions,
        parameters,
        status: 'active' as const,
        createdAt: Date.now()
      };
      await db.interviews.save(interview);
      alert(`Created ${interview.code}`);
      onBack();
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 pb-20 pt-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-4 z-40 bg-black/80 backdrop-blur-xl p-3 -mx-3 rounded-[16px] border border-white/5">
           <div className="flex items-center gap-3">
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#1C1C1E] flex items-center justify-center text-white hover:bg-[#2C2C2E] transition-colors border border-white/5">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>
              <h1 className="text-base font-semibold text-white">New Assessment</h1>
           </div>
           <Button onClick={handleSave} loading={saving} variant="primary" size="sm">
              Publish
           </Button>
        </div>

        <div className="space-y-6">
            
            {/* Section 1: Role Details (iOS/HyperOS Settings Group Style) */}
            <div className="space-y-2">
               <h2 className="text-xs font-medium text-gray-500 ml-3 uppercase tracking-wider">Role Details</h2>
               <div className="bg-[#1C1C1E] rounded-[24px] p-5 space-y-4 border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input 
                        label="Job Role" 
                        placeholder="e.g. Senior Product Designer" 
                        value={jobRole} 
                        onChange={e => setJobRole(e.target.value)}
                     />
                     <Input 
                        label="Internal ID" 
                        placeholder="Optional (e.g. DES-001)" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                     />
                  </div>
                  <Input 
                     label="Company Name" 
                     value={companyName} 
                     onChange={e => setCompanyName(e.target.value)} 
                  />
               </div>
            </div>

            {/* Section 2: Questions */}
            <div className="space-y-2">
               <h2 className="text-xs font-medium text-gray-500 ml-3 uppercase tracking-wider">Interview Script</h2>
               <div className="bg-[#1C1C1E] rounded-[24px] p-5 border border-white/5">
                  <div className="space-y-2 mb-4">
                     {questions.map((q, idx) => (
                        <div key={q.id} className="flex items-center gap-3 p-3 rounded-[16px] bg-[#2C2C2E] border border-transparent hover:border-white/10 transition-colors group">
                           <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/60">{idx + 1}</span>
                           <p className="text-xs text-white flex-1">{q.text}</p>
                           <button onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} className="text-white/20 hover:text-red-400 transition-colors p-1.5">
                              ×
                           </button>
                        </div>
                     ))}
                     {questions.length === 0 && (
                        <div className="text-center py-6 text-white/20 text-xs">No questions added yet.</div>
                     )}
                  </div>
                  
                  <div className="flex gap-2">
                     <input 
                        className="flex-1 bg-[#000] border border-white/10 rounded-full px-5 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
                        placeholder="Type a question..."
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddQuestion()}
                     />
                     <Button onClick={handleAddQuestion} variant="secondary" size="sm">Add</Button>
                  </div>
               </div>
            </div>

            {/* Section 3: Evaluation Matrix */}
            <div className="space-y-2">
               <div className="flex items-center justify-between ml-3 mr-1">
                  <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation Parameters</h2>
                  
                  <div className="flex gap-2">
                     {/* Add Custom Button */}
                     <button 
                        onClick={handleAddParam}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
                     >
                        <span className="text-xs font-bold text-white/60 group-hover:text-white">+</span>
                        <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">
                           Add Custom
                        </span>
                     </button>

                     {/* AI Auto-Generate Button */}
                     <button 
                        onClick={handleGenerateParams} 
                        disabled={!jobRole || loadingAI}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 hover:bg-[#007AFF] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <svg className="w-3 h-3 text-[#007AFF] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-[10px] font-bold text-[#007AFF] group-hover:text-white transition-colors">
                           {loadingAI ? 'Generating...' : 'Auto-Generate'}
                        </span>
                     </button>
                  </div>
               </div>
               
               <div className="bg-[#1C1C1E] rounded-[24px] p-2 border border-white/5 space-y-1">
                 {parameters.map(p => (
                   <div key={p.id} className="p-3 rounded-[18px] bg-[#2C2C2E] flex flex-col gap-2 group border border-transparent hover:border-white/5 transition-all">
                      <div className="flex items-center gap-2">
                         <input 
                            className="flex-1 bg-transparent text-sm font-medium text-white placeholder-white/20 outline-none"
                            value={p.name}
                            onChange={(e) => updateParam(p.id, 'name', e.target.value)}
                            placeholder="Criterion Name"
                         />
                         <div className="flex items-center bg-black/30 rounded-full px-2 py-0.5 border border-white/5">
                            <input 
                                type="number"
                                className="w-6 bg-transparent text-right text-xs font-mono text-[#007AFF] outline-none"
                                value={p.weight}
                                onChange={(e) => updateParam(p.id, 'weight', e.target.value)}
                            />
                            <span className="text-[10px] text-white/40 ml-0.5">%</span>
                         </div>
                         <button onClick={() => removeParam(p.id)} className="w-6 h-6 rounded-full flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all">×</button>
                      </div>
                      <input 
                         className="w-full bg-transparent text-xs text-white/50 placeholder-white/10 outline-none"
                         value={p.description}
                         onChange={(e) => updateParam(p.id, 'description', e.target.value)}
                         placeholder="Brief description of this parameter"
                      />
                   </div>
                 ))}
                 
                 {parameters.length > 0 ? (
                   <div className="flex justify-end px-4 py-3">
                       <span className={`text-[10px] font-bold ${parameters.reduce((s, p) => s + Number(p.weight), 0) === 100 ? 'text-green-500' : 'text-red-500'}`}>
                           Total Weight: {parameters.reduce((s, p) => s + Number(p.weight), 0)}%
                       </span>
                   </div>
                 ) : (
                    <div className="py-12 text-center">
                       <p className="text-white/20 text-xs mb-1">No evaluation criteria defined.</p>
                       <p className="text-white/10 text-[10px]">Use Auto-Generate or Add Custom to create parameters.</p>
                    </div>
                 )}
               </div>
            </div>

        </div>
      </div>
    </div>
  );
};
