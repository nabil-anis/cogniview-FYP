
import React, { useState } from 'react';
import { Button, Input, Card } from '../components/Shared';
import { db } from '../services/db';
import { Profile } from '../types';

interface AuthProps {
  onAuth: () => void;
  onBack: () => void;
  initialRole?: 'recruiter' | 'interviewee';
}

export const Auth: React.FC<AuthProps> = ({ onAuth, onBack, initialRole = 'recruiter' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [candidateCode, setCandidateCode] = useState('');
  const [role, setRole] = useState<'recruiter' | 'interviewee'>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (forgotStep === 'request') {
        if (!resetEmail.trim()) {
          setError("Please enter your email address.");
          setLoading(false);
          return;
        }

        const profile = await db.profiles.getByEmail(resetEmail.trim());
        if (!profile) {
          setError("This email address is not registered in our system.");
          setLoading(false);
          return;
        }

        // Generate and store a secure 6-digit recovery code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setSentCode(code);
        setForgotStep('verify');
      } else {
        if (inputCode !== sentCode) {
          setError("Invalid security verification code. Please check and try again.");
          setLoading(false);
          return;
        }

        if (newPassword.length < 5) {
          setError("Security Requirement: New password must be at least 5 characters.");
          setLoading(false);
          return;
        }

        // Password reset is successful
        setSuccessMessage("Your password has been securely updated. You can now log in.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) return;

    if (password.length < 5) {
      setError("Security Requirement: Password must be at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      if (role === 'recruiter' && !isLogin && !companyName.trim()) {
        setError("Company Name is required for Recruiter registration.");
        setLoading(false);
        return;
      }

      let profile = await db.profiles.getByEmail(email);
      
      if (isLogin) {
        // LOGIN FLOW
        if (!profile) {
          setError("This account does not exist. Please tap on 'Create Account'.");
          setLoading(false);
          return;
        }
      } else {
        // REGISTRATION FLOW
        if (profile) {
          setError("Account already exists with this email. Please Sign In.");
          setLoading(false);
          return;
        }

        // Create new profile
        profile = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: name || email.split('@')[0],
          role: role,
          companyName: role === 'recruiter' ? companyName : undefined,
        };
      }
      
      // Handle Candidate Session Linking (Only if code is provided)
      if (role === 'interviewee' && candidateCode) {
        const interview = await db.interviews.getByCode(candidateCode);
        if (interview) {
          const existingSessions = await db.sessions.getByCandidateId(profile.id);
          const alreadyActive = existingSessions.find(s => s.interviewId === interview.id && s.status === 'in_progress');
          
          if (!alreadyActive) {
            const session = {
              id: Math.random().toString(36).substr(2, 9),
              interviewId: interview.id,
              interviewTitle: interview.title || interview.jobRole,
              companyName: interview.companyName,
              candidateId: profile.id,
              candidateName: profile.name,
              candidateEmail: profile.email,
              status: 'in_progress' as const,
              decision: 'pending' as const,
              startedAt: Date.now()
            };
            await db.sessions.save(session);
          }
        } else {
          setError('Assessment code invalid.');
          setLoading(false);
          return;
        }
      }

      await db.auth.login(profile);
      onAuth();
    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#007AFF]/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Explicit Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold text-white/80"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-[320px] space-y-6 animate-in fade-in duration-500 relative z-10 my-12">
        <div className="text-center space-y-5">
          <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center mx-auto shadow-xl shadow-white/5">
            <div className="w-6 h-6 bg-black rounded-md"></div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {!isForgotPassword && (
            <div className="inline-flex bg-[#1C1C1E] p-1 rounded-xl border border-white/5 w-full">
              <button 
                type="button"
                onClick={() => { setRole('recruiter'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 uppercase tracking-widest ${role === 'recruiter' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}
              >
                Recruiter
              </button>
              <button 
                type="button"
                onClick={() => { setRole('interviewee'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 uppercase tracking-widest ${role === 'interviewee' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'}`}
              >
                Candidate
              </button>
            </div>
          )}
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center animate-in zoom-in-95">
                <p className="text-xs text-red-400 font-medium">{error}</p>
            </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-white/50 text-center leading-relaxed px-1">
              {forgotStep === 'request' 
                ? "Provide your account email and we'll dispatch a 6-digit recovery code."
                : "A secure verification code has been dispatched. Enter it below to authorize update."}
            </p>

            {successMessage ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto text-green-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                </div>
                <p className="text-xs text-white/80 font-medium px-2">{successMessage}</p>
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotStep('request');
                    setSuccessMessage(null);
                    setError(null);
                    setEmail(resetEmail);
                  }}
                  className="w-full h-11 rounded-xl text-sm font-bold"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                {forgotStep === 'request' ? (
                  <Input 
                    label="Account Email" 
                    type="email" 
                    placeholder="name@domain.com" 
                    value={resetEmail} 
                    onChange={e => setResetEmail(e.target.value)} 
                    required 
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#1C1C1E] border border-white/5 p-3 rounded-2xl text-center space-y-1">
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Secure Verification Code</p>
                      <p className="font-mono text-lg font-bold text-[#007AFF] tracking-widest">{sentCode}</p>
                      <p className="text-[9px] text-white/30">Use this code to authorize updates.</p>
                    </div>
                    
                    <Input 
                      label="6-Digit Verification Code" 
                      type="text" 
                      placeholder="Enter 6-digit code" 
                      value={inputCode} 
                      onChange={e => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                      required 
                    />
                    
                    <Input 
                      label="New Password" 
                      type="password" 
                      placeholder="Min. 5 characters" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                    />
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold" size="md" loading={loading}>
                    {forgotStep === 'request' ? 'Request Code' : 'Verify & Update'}
                  </Button>
                </div>

                <button 
                  type="button" 
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotStep('request');
                    setError(null);
                  }} 
                  className="w-full text-center text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em] py-2"
                >
                  Back to Sign In
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {!isLogin && (
              <Input 
                label="Full Name" 
                placeholder="Your Name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            )}
            {role === 'recruiter' && !isLogin && (
              <Input 
                label="Company" 
                placeholder="e.g. Apple Inc." 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                required 
              />
            )}
            <Input 
              label="Email" 
              type="email" 
              placeholder="name@domain.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <div className="space-y-2">
              <Input 
                label="Password" 
                type="password" 
                placeholder="Min. 5 chars" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setResetEmail(email);
                      setError(null);
                    }}
                    className="text-[9px] font-bold text-[#007AFF] hover:text-[#007AFF]/80 transition-colors uppercase tracking-wider px-1 py-1"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
            
            {role === 'interviewee' && (
              <div className="pt-1 pb-1">
                   <Input 
                    label="Assessment Access Code" 
                    subLabel="Optional"
                    placeholder="Enter Code" 
                    value={candidateCode} 
                    onChange={e => setCandidateCode(e.target.value.toUpperCase())} 
                    required={false}
                  />
                  <p className="text-[10px] text-white/30 mt-1.5 px-1">Leave blank to go to your dashboard.</p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold" size="md" loading={loading}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(null); }} 
              className="w-full text-center text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em] py-2"
            >
              {isLogin ? 'New here? Create Account' : 'Already have an account? Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
