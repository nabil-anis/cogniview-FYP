
import React, { useState, useEffect, useRef } from 'react';
import { Button, Card } from '../../components/Shared';
import { db } from '../../services/db';
import { Interview, Profile } from '../../types';

export const RecruiterDashboard: React.FC<{ user: Profile, onNavigate: (page: string) => void }> = ({ user, onNavigate }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localUser, setLocalUser] = useState(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      const all = await db.interviews.getAll();
      setInterviews(all.filter(i => i.recruiterId === user.id));
    };
    fetchInterviews();
  }, [user.id]);

  const handleCopyCode = (e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation(); // Prevent navigation to details
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const updatedProfile = { ...localUser, logoUrl: base64 };
      
      // Optimistic update
      setLocalUser(updatedProfile);
      
      // Persist
      try {
        await db.auth.login(updatedProfile); // Updates localStorage and DB
      } catch (err) {
        console.error("Failed to save logo", err);
        alert("Failed to upload logo.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 p-4 md:p-6 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Action Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="flex items-center gap-4">
            {/* Logo Upload Area */}
            <div 
              className="relative group w-14 h-14 md:w-16 md:h-16 rounded-xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/30 transition-all flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {localUser.logoUrl ? (
                <img src={localUser.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white/20 group-hover:text-white/40">+</span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] font-bold uppercase tracking-widest text-white">Upload</span>
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleLogoUpload}
              />
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Recruitment</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">Manage your active pipelines.</p>
            </div>
          </div>
          <Button onClick={() => onNavigate('create-interview')} variant="primary" size="md" className="shadow-[0_0_20px_rgba(255,255,255,0.1)] w-full md:w-auto">
            + New Assessment
          </Button>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Active Jobs - Large Square */}
          <div className="md:col-span-2 bg-[#1C1C1E] border border-white/5 rounded-[24px] p-5 md:p-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-60 h-60 bg-[#007AFF]/10 blur-[80px] rounded-full group-hover:bg-[#007AFF]/20 transition-all duration-700"></div>
             
             <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px] md:min-h-[160px]">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-10 bg-white/10 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md border border-white/5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                   </div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border border-white/10 px-2 py-0.5 rounded-full">Live</span>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-4xl md:text-5xl font-medium text-white tracking-tighter mb-1">{interviews.length}</h3>
                  <p className="text-sm text-white/60 font-medium">Active Assessments</p>
                  <p className="text-xs text-white/30 mt-0.5">Currently accepting responses</p>
                </div>
             </div>
          </div>
          
          {/* Candidates - Tall Rect */}
          <div className="bg-[#2C2C2E] border border-white/5 rounded-[24px] p-5 md:p-6 flex flex-col justify-between h-full min-h-[140px] md:min-h-[160px] relative overflow-hidden group">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full pointer-events-none"></div>
             <div className="relative z-10 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
             </div>
             <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-1">0</h3>
                <p className="text-xs text-white/50 font-medium">Candidates Processed</p>
             </div>
          </div>

          {/* System Status - Tall Rect */}
          <div className="bg-[#1C1C1E] border border-white/5 rounded-[24px] p-5 md:p-6 flex flex-col justify-between h-full min-h-[140px] md:min-h-[160px]">
             <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             </div>
             <div>
                <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight mb-1">Stable</h3>
                <p className="text-xs text-white/50 font-medium">System Status</p>
                <p className="text-[10px] text-white/30 mt-0.5">v2.5.0 Latest</p>
             </div>
          </div>
        </div>

        {/* Assessments List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-medium text-white">Your Assessments</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {interviews.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-[#222] rounded-[24px] bg-[#111]/50">
                <p className="text-sm text-gray-500 mb-3">No assessments found</p>
                <Button onClick={() => onNavigate('create-interview')} variant="secondary" size="sm">Create New</Button>
              </div>
            ) : (
              interviews.map(i => (
                <div 
                  key={i.id} 
                  onClick={() => onNavigate(`results-${i.id}`)}
                  className="group bg-[#1C1C1E] border border-white/[0.06] p-4 rounded-[20px] flex items-center justify-between cursor-pointer hover:bg-[#2C2C2E] transition-all duration-300"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] bg-[#2C2C2E] group-hover:bg-[#3C3C3E] border border-white/5 flex items-center justify-center text-base md:text-lg font-bold text-white transition-colors flex-shrink-0">
                      {i.jobRole.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white mb-0.5 truncate">{i.title || i.jobRole}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                         <span>{i.companyName}</span>
                         <span className="w-0.5 h-0.5 rounded-full bg-gray-600"></span>
                         <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 md:gap-6 pl-4 flex-shrink-0">
                     <div 
                        className="text-right hidden sm:block cursor-pointer group/copy relative z-10"
                        onClick={(e) => handleCopyCode(e, i.code, i.id)}
                        title="Click to copy code"
                     >
                       <p className={`text-[9px] uppercase tracking-wider mb-0.5 transition-colors ${copiedId === i.id ? 'text-green-500 font-bold' : 'text-gray-500'}`}>
                         {copiedId === i.id ? 'Copied!' : 'Access Code'}
                       </p>
                       <div className="flex items-center justify-end gap-1.5">
                         <p className="font-mono text-sm font-medium text-[#007AFF] group-hover/copy:text-white transition-colors">{i.code}</p>
                         <div className={`w-4 h-4 flex items-center justify-center rounded-full bg-white/10 transition-all duration-300 ${copiedId === i.id ? 'bg-green-500/20 text-green-500 scale-100' : 'opacity-0 group-hover/copy:opacity-100 -translate-x-2 group-hover/copy:translate-x-0'}`}>
                           {copiedId === i.id ? (
                             <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                           ) : (
                             <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                           )}
                         </div>
                       </div>
                     </div>
                     
                     {/* Mobile Code View with Copy Action */}
                     <div 
                       className="sm:hidden flex flex-col items-end cursor-pointer active:scale-95 transition-transform"
                       onClick={(e) => handleCopyCode(e, i.code, i.id)}
                     >
                       <p className={`text-[8px] uppercase tracking-wider transition-colors ${copiedId === i.id ? 'text-green-500 font-bold' : 'text-gray-500'}`}>
                         {copiedId === i.id ? 'Copied' : 'Code'}
                       </p>
                       <div className="flex items-center gap-1.5">
                         <p className="font-mono text-xs font-bold text-[#007AFF]">{i.code}</p>
                         <div className={`w-4 h-4 rounded-full flex items-center justify-center bg-white/5 ${copiedId === i.id ? 'text-green-500 bg-green-500/10' : 'text-white/30'}`}>
                            {copiedId === i.id ? (
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                         </div>
                       </div>
                     </div>

                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
