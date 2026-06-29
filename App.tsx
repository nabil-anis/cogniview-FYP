
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

  const renderPage = () => {
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
      if (currentPage === 'interview-room') return <InterviewRoom user={currentUser} onComplete={() => setCurrentPage('candidate-dashboard')} />;
      return <IntervieweeDashboard user={currentUser} onNavigate={setCurrentPage} />;
    }

    return <div className="p-20 text-center text-white">Unauthorized Access</div>;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col selection:bg-blue-500/30 selection:text-white overflow-x-hidden font-sans text-gray-200">
      {/* Top Navigation Bar - HyperOS Style: Simple, blurred, distinct */}
      {currentUser && currentPage !== 'interview-room' && (
        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-2xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {/* Logo Area */}
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigateUser(currentUser)}
            >
              <div className="w-10 h-10 bg-white rounded-[14px] flex items-center justify-center shadow-lg shadow-white/5">
                <div className="w-5 h-5 bg-black rounded-md"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-white leading-none">Cogniview</span>
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">
                  {currentUser.role === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </span>
              </div>
            </div>
            
            {/* User Controls */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 bg-white/5 pl-4 pr-2 py-1.5 rounded-full border border-white/5">
                <span className="text-sm font-medium text-white/90">{currentUser.name}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#007AFF] to-[#0062cc] flex items-center justify-center text-xs font-bold text-white shadow-inner border border-white/10">
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
      
      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
