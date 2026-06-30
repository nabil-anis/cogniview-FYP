
import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { RecruiterDashboard } from './pages/recruiter/Dashboard';
import { CreateInterview } from './pages/recruiter/CreateInterview';
import { InterviewRoom } from './pages/interviewee/InterviewRoom';
import { IntervieweeDashboard } from './pages/interviewee/Dashboard';
import { Results } from './pages/recruiter/Results';
import { db } from './services/db';
import { Profile } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'night') return 'dark'; // Migrate legacy night value
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const init = async () => {
      const user = db.auth.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await navigateUser(user);
      }
    };
    init();
  }, []);

  const navigateUser = async (user: Profile) => {
    if (user.role === 'recruiter') {
      setCurrentPage('dashboard');
    } else {
      const sessions = await db.sessions.getByCandidateId(user.id);
      const active = sessions.find(s => s.status === 'in_progress');
      if (active) setCurrentPage('interview-room');
      else setCurrentPage('candidate-dashboard');
    }
  };

  const handleAuth = async () => {
    const user = db.auth.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      await navigateUser(user);
    }
  };

  const logout = () => {
    db.auth.logout();
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  // Theme calculations
  const activeRole = currentUser ? currentUser.role : (currentPage === 'login-candidate' ? 'interviewee' : (currentPage === 'login-recruiter' ? 'recruiter' : 'guest'));

  // Define dynamic brand accent
  let brandPrimary = '#3B82F6'; // Royal blue
  let brandPrimaryRgb = '59, 130, 246';
  
  if (activeRole === 'interviewee') {
    brandPrimary = '#10B981'; // Mint Green
    brandPrimaryRgb = '16, 185, 129';
  } else if (activeRole === 'recruiter') {
    brandPrimary = '#2563EB'; // Vibrant recruiter blue
    brandPrimaryRgb = '37, 99, 235';
  } else {
    // Visitor default
    brandPrimary = '#007AFF';
    brandPrimaryRgb = '0, 122, 255';
  }

  // Background modes:
  // - Light mode: Pristine pure white (#FFFFFF)
  // - Dark mode: Cosmic charcoal slate (#0B0F19)
  // - Landing page: Pure black (#000000)
  const bgPrimary = currentPage === 'landing' ? '#000000' : (themeMode === 'light' ? '#FFFFFF' : '#0B0F19');
  const bgPrimaryRgb = currentPage === 'landing' ? '0, 0, 0' : (themeMode === 'light' ? '255, 255, 255' : '11, 15, 25');
  const bgCard = currentPage === 'landing' ? '#1C1C1E' : (themeMode === 'light' ? '#F8FAFC' : '#151D30');
  const borderPrimary = currentPage === 'landing' ? 'rgba(255, 255, 255, 0.05)' : (themeMode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)');

  const renderPage = () => {
    if (!currentUser) {
      if (currentPage === 'login-recruiter') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} initialRole="recruiter" themeMode={themeMode} setThemeMode={setThemeMode} />;
      if (currentPage === 'login-candidate') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} initialRole="interviewee" themeMode={themeMode} setThemeMode={setThemeMode} />;
      if (currentPage === 'login') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} themeMode={themeMode} setThemeMode={setThemeMode} />;
      return <Landing onNavigate={setCurrentPage} />;
    }

    if (currentUser.role === 'recruiter') {
      if (currentPage === 'create-interview') return <CreateInterview user={currentUser} onBack={() => setCurrentPage('dashboard')} />;
      if (currentPage.startsWith('results-')) {
        return <Results interviewId={currentPage.split('-')[1]} onBack={() => setCurrentPage('dashboard')} />;
      }
      return <RecruiterDashboard user={currentUser} onNavigate={setCurrentPage} />;
    }

    if (currentUser.role === 'interviewee') {
      if (currentPage === 'interview-room') return <InterviewRoom user={currentUser} onComplete={() => setCurrentPage('candidate-dashboard')} />;
      return <IntervieweeDashboard user={currentUser} onNavigate={setCurrentPage} />;
    }

    return <div className="p-20 text-center text-white">Unauthorized Access</div>;
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-blue-500/30 selection:text-white overflow-x-hidden font-sans ${themeMode === 'light' && currentPage !== 'landing' ? 'theme-light text-slate-800 bg-white' : 'text-gray-200 bg-black'}`}>
      {/* Universal CSS Variables Injector for Dark/Light Themes & Recruiter/Candidate Accents */}
      <style>{`
        :root {
          --brand-primary: ${brandPrimary};
          --brand-primary-rgb: ${brandPrimaryRgb};
          --bg-primary: ${bgPrimary};
          --bg-primary-rgb: ${bgPrimaryRgb};
          --bg-card: ${bgCard};
          --border-primary: ${borderPrimary};
        }
        
        body, .bg-black, .bg-\\[\\#000000\\], .bg-neutral-950 {
          background-color: var(--bg-primary) !important;
        }
        
        .glass, .bg-\\[\\#1C1C1E\\],.bg-\\[\\#1c1c1e\\], .bg-\\[\\#2C2C2E\\], .bg-\\[\\#2c2c2e\\], .bg-[#1C1C1E], .bg-[#2C2C2E], .bg-zinc-900, .bg-neutral-900, .bg-slate-900 {
          background-color: var(--bg-card) !important;
          border-color: var(--border-primary) !important;
        }
        
        .border-white\\/5, .border-white\\/10, .border-white\\/\\[0\\.06\\], .border-white\\/\\[0\\.05\\], .border-white\\/20, .border-white\\/15, .border-zinc-800, .border-neutral-800 {
          border-color: var(--border-primary) !important;
        }
        
        .bg-\\[\\#007AFF\\] {
          background-color: var(--brand-primary) !important;
        }
        .text-\\[\\#007AFF\\] {
          color: var(--brand-primary) !important;
        }
        .border-\\[\\#007AFF\\] {
          border-color: var(--brand-primary) !important;
        }
        .bg-\\[\\#007AFF\\]\\/5 {
          background-color: rgba(var(--brand-primary-rgb), 0.05) !important;
        }
        .bg-\\[\\#007AFF\\]\\/10 {
          background-color: rgba(var(--brand-primary-rgb), 0.1) !important;
        }
        .bg-\\[\\#007AFF\\]\\/20 {
          background-color: rgba(var(--brand-primary-rgb), 0.2) !important;
        }
        .border-\\[\\#007AFF\\]\\/20 {
          border-color: rgba(var(--brand-primary-rgb), 0.2) !important;
        }
        .shadow-\\[\\#007AFF\\] {
          box-shadow: 0 0 15px var(--brand-primary) !important;
        }
        .shadow-\\[\\#007AFF\\]\\/20 {
          box-shadow: 0 10px 30px rgba(var(--brand-primary-rgb), 0.2) !important;
        }
        .shadow-\\[\\#007AFF\\]\\/25 {
          box-shadow: 0 10px 30px rgba(var(--brand-primary-rgb), 0.25) !important;
        }
        .border-t-\\[\\#007AFF\\] {
          border-top-color: var(--brand-primary) !important;
        }
        .border-r-\\[\\#007AFF\\] {
          border-right-color: var(--brand-primary) !important;
        }
        .text-transparent.bg-clip-text.bg-gradient-to-r.from-\\[\\#007AFF\\] {
          background-image: linear-gradient(to right, var(--brand-primary), #38BDF8, var(--brand-primary)) !important;
        }
        .bg-gradient-to-b.from-\\[\\#007AFF\\]\\/10 {
          background-image: linear-gradient(to bottom, rgba(var(--brand-primary-rgb), 0.1), transparent) !important;
        }
        .bg-gradient-to-b.from-\\[\\#007AFF\\] {
          background-image: linear-gradient(to bottom, var(--brand-primary), var(--brand-primary)) !important;
        }
        .hover\\:text-\\[\\#007AFF\\]:hover {
          color: var(--brand-primary) !important;
        }
        .focus\\:ring-\\[\\#007AFF\\]\\/50:focus {
          --tw-ring-color: rgba(var(--brand-primary-rgb), 0.5) !important;
        }
        .from-\\[\\#007AFF\\] {
          --tw-gradient-from: var(--brand-primary) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(var(--brand-primary-rgb), 0)) !important;
        }
        .to-\\[\\#0062cc\\] {
          --tw-gradient-to: rgba(var(--brand-primary-rgb), 0.8) !important;
        }

        /* --- Custom Keyframes & Utility classes for Ambient Glow Lines --- */
        @keyframes ambient-shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-ambient-shimmer {
          animation: ambient-shimmer 5s linear infinite;
        }

        /* --- Light Theme Overrides (Applied when themeMode === 'light') --- */
        .theme-light {
          color: #334155 !important;
        }
        .theme-light .text-white, 
        .theme-light h1, 
        .theme-light h2, 
        .theme-light h3, 
        .theme-light h4, 
        .theme-light h5, 
        .theme-light h6, 
        .theme-light .font-bold,
        .theme-light .font-semibold,
        .theme-light .text-slate-100,
        .theme-light .text-zinc-100 {
          color: #0F172A !important;
        }
        .theme-light .text-white\\/40, .theme-light .text-zinc-400, .theme-light .text-slate-400 {
          color: #64748B !important;
        }
        .theme-light .text-white\\/60, .theme-light .text-white\\/50, .theme-light .text-white\\/70, .theme-light .text-slate-300, .theme-light .text-zinc-300 {
          color: #475569 !important;
        }
        .theme-light .text-white\\/80, .theme-light .text-white\\/90 {
          color: #1E293B !important;
        }
        .theme-light .bg-white\\/5 {
          background-color: rgba(0, 0, 0, 0.04) !important;
        }
        .theme-light .bg-white\\/10 {
          background-color: rgba(0, 0, 0, 0.07) !important;
        }
        .theme-light .hover\\:bg-white\\/5:hover {
          background-color: rgba(0, 0, 0, 0.04) !important;
        }
        .theme-light .hover\\:bg-white\\/10:hover {
          background-color: rgba(0, 0, 0, 0.07) !important;
        }
        .theme-light input, .theme-light textarea, .theme-light select {
          background-color: #FFFFFF !important;
          color: #0F172A !important;
          border-color: rgba(0, 0, 0, 0.12) !important;
        }
        .theme-light input::placeholder, .theme-light textarea::placeholder {
          color: #94A3B8 !important;
        }
        .theme-light .glass {
          background-color: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(20px) !important;
          border-color: rgba(0, 0, 0, 0.08) !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05) !important;
        }
        .theme-light header {
          background-color: rgba(255, 255, 255, 0.8) !important;
          border-bottom-color: rgba(0, 0, 0, 0.06) !important;
        }
        .theme-light .border-white\\/5, .theme-light .border-white\\/10, .theme-light .border-white\\/20 {
          border-color: rgba(0, 0, 0, 0.08) !important;
        }
        .theme-light .shadow-lg {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>

      {/* Top Navigation Bar - HyperOS Style: Simple, blurred, distinct */}
      {currentUser && currentPage !== 'interview-room' && (
        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigateUser(currentUser)}
            >
              <div 
                className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shadow-lg transition-colors"
                style={{ shadowColor: brandPrimary }}
              >
                <div className="w-5 h-5 bg-black rounded-md"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-none">Cogniview</span>
                <span 
                  className="text-[10px] font-bold uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5"
                  style={{ color: brandPrimary }}
                >
                  {currentUser.role === 'recruiter' ? 'Recruiter Profile' : 'Candidate Portal'}
                </span>
              </div>
            </div>
            
            {/* Theme Mode & User Controls */}
            <div className="flex items-center gap-6">
              {/* Theme Mode Segmented Controller */}
              <div className="flex bg-white/5 p-1 rounded-full border border-white/5 items-center">
                <button 
                  onClick={() => setThemeMode('dark')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 uppercase tracking-wider ${themeMode === 'dark' ? 'bg-white text-black shadow-md' : 'text-white/40 hover:text-white/70'}`}
                  title="Space Dark Mode"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
                  Dark
                </button>
                <button 
                  onClick={() => setThemeMode('light')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 uppercase tracking-wider ${themeMode === 'light' ? 'bg-[#0F172A] text-white shadow-md' : 'text-white/40 hover:text-white/70'}`}
                  title="Pristine Light Mode"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>
                  Light
                </button>
              </div>

              <div className="flex items-center gap-4 bg-white/5 pl-4 pr-2 py-1.5 rounded-full border border-white/5">
                <span className="text-sm font-medium text-white/90">{currentUser.name}</span>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/10"
                  style={{ backgroundColor: brandPrimary }}
                >
                  {currentUser.name.charAt(0)}
                </div>
              </div>
              
              <button 
                onClick={logout} 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 text-white/60 hover:text-white"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Dynamic Ambient Light Lines (Not rendered on Landing page) */}
      {currentPage !== 'landing' && (
        <div className="w-full relative h-[4px] overflow-hidden bg-transparent z-40">
          {/* Main glowing band */}
          <div 
            className="absolute inset-0 w-full h-full transition-all duration-700 opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent 0%, var(--brand-primary) 50%, transparent 100%)`,
              boxShadow: themeMode === 'light' 
                ? `0 1px 6px rgba(var(--brand-primary-rgb), 0.3)` 
                : `0 0 15px rgba(var(--brand-primary-rgb), 0.7)`,
            }}
          />
          {/* Ambient running shine spark */}
          <div 
            className="absolute inset-y-0 w-[150px] animate-ambient-shimmer"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
            }}
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
