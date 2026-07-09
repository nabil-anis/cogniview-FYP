
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
import { Info, InfoTopic } from './pages/Info';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    const init = async () => {
      const user = db.auth.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await navigateUser(user);
      }
    };
    init();

    // Intercept and demote Vapi/LiveKit ejection and meeting end errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.map(arg => {
        if (!arg) return "";
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch(e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      if (msg.includes("ejection") || msg.includes("Meeting has ended") || msg.includes("Room closed") || msg.includes("Meeting ended due to ejection")) {
        console.warn("[Demoted Error to Warn] Vapi connection finished:", ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    const handleWindowError = (event: ErrorEvent) => {
      const msg = event?.message || "";
      if (msg.includes("ejection") || msg.includes("Meeting has ended") || msg.includes("Room closed") || msg.includes("Meeting ended due to ejection")) {
        event.preventDefault();
        console.log("[Silenced Unhandled Error]:", msg);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message || String(event?.reason || "");
      if (msg.includes("ejection") || msg.includes("Meeting has ended") || msg.includes("Room closed") || msg.includes("Meeting ended due to ejection")) {
        event.preventDefault();
        console.log("[Silenced Unhandled Rejection]:", msg);
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
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
  let brandPrimary = '#8B5CF6'; // Premium Amethyst Violet for Recruiter
  let brandPrimaryRgb = '139, 92, 246';
  
  if (activeRole === 'interviewee') {
    brandPrimary = '#0D9488'; // Vibrant Teal for Candidate
    brandPrimaryRgb = '13, 148, 136';
  } else if (activeRole === 'recruiter') {
    brandPrimary = '#8B5CF6'; // Premium Amethyst Violet
    brandPrimaryRgb = '139, 92, 246';
  } else {
    // Visitor default
    brandPrimary = '#E2E8F0'; // Sleek Platinum/Silver
    brandPrimaryRgb = '226, 232, 240';
  }

  // Dynamic Ambient Color (Vivid teal for Candidate, Vivid violet for Recruiter)
  const ambientColor = activeRole === 'interviewee' ? '#14B8A6' : '#8B5CF6';
  const ambientColorRgb = activeRole === 'interviewee' ? '20, 184, 166' : '139, 92, 246';

  // Background modes (Solid dark premium surfaces)
  const bgPrimary = currentPage === 'landing' ? '#000000' : '#0B0F19';
  const bgPrimaryRgb = currentPage === 'landing' ? '0, 0, 0' : '11, 15, 25';
  const bgCard = currentPage === 'landing' ? '#1C1C1E' : '#151D30';
  const borderPrimary = currentPage === 'landing' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)';

  const renderPage = () => {
    if (currentPage.startsWith('info-')) {
      const topic = currentPage.replace('info-', '') as InfoTopic;
      return <Info topic={topic} onBack={() => {
        if (currentUser) {
          if (currentUser.role === 'recruiter') {
            setCurrentPage('dashboard');
          } else {
            setCurrentPage('candidate-dashboard');
          }
        } else {
          setCurrentPage('landing');
        }
      }} />;
    }

    if (!currentUser) {
      if (currentPage === 'login-recruiter') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} initialRole="recruiter" />;
      if (currentPage === 'login-candidate') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} initialRole="interviewee" />;
      if (currentPage === 'login') return <Auth onAuth={handleAuth} onBack={() => setCurrentPage('landing')} />;
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
      if (currentPage === 'interview-room') return <InterviewRoom user={currentUser} onComplete={() => setCurrentPage('candidate-dashboard')} onBack={() => setCurrentPage('candidate-dashboard')} />;
      return <IntervieweeDashboard user={currentUser} onNavigate={setCurrentPage} />;
    }

    return <div className="p-20 text-center text-white">Unauthorized Access</div>;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30 selection:text-white overflow-x-hidden font-sans text-gray-200 bg-black">
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
        
        /* Eliminate cheap gradients - replace with elegant solid color */
        .text-transparent.bg-clip-text.bg-gradient-to-r.from-\\[\\#007AFF\\] {
          background-image: none !important;
          background-clip: unset !important;
          -webkit-background-clip: unset !important;
          -webkit-text-fill-color: var(--brand-primary) !important;
          color: var(--brand-primary) !important;
        }
        .bg-gradient-to-b.from-\\[\\#007AFF\\]\\/10 {
          background-image: linear-gradient(to bottom, rgba(var(--brand-primary-rgb), 0.04), transparent) !important;
        }
        .bg-gradient-to-b.from-\\[\\#007AFF\\] {
          background-image: none !important;
          background-color: var(--brand-primary) !important;
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
      `}</style>

      {/* Top Navigation Bar - HyperOS Style: Simple, blurred, distinct */}
      {currentUser && currentPage !== 'interview-room' && (
        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-2 md:gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigateUser(currentUser)}
            >
              <div 
                className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-[10px] md:rounded-[14px] flex items-center justify-center shadow-lg transition-colors"
                style={{ shadowColor: brandPrimary }}
              >
                <div className="w-4 h-4 md:w-5 md:h-5 bg-black rounded-md"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm md:text-base font-bold text-white leading-none">Cogniview</span>
                <span 
                  className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1 md:mt-1.5 px-1.5 md:px-2 py-0.5 rounded-full bg-white/5 border border-white/5"
                  style={{ color: brandPrimary }}
                >
                  {currentUser.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </span>
              </div>
            </div>
            
            {/* User Controls */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 bg-white/5 p-1 md:pl-4 md:pr-2 md:py-1.5 rounded-full border border-white/5">
                <span className="text-xs md:text-sm font-medium text-white/90 hidden md:inline">{currentUser.name}</span>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/10"
                  style={{ backgroundColor: brandPrimary }}
                >
                  {currentUser.name.charAt(0)}
                </div>
              </div>
              
              <button 
                onClick={logout} 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 text-white/60 hover:text-white"
                title="Sign Out"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
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
              background: `linear-gradient(90deg, transparent 0%, ${ambientColor} 50%, transparent 100%)`,
              boxShadow: `0 0 15px rgba(${ambientColorRgb}, 0.9)`,
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
