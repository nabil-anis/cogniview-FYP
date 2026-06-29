
import React from 'react';
import { motion } from 'framer-motion';

// --- Icons ---
const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#007AFF]"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);

const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#007AFF]"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#007AFF]"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const AnalyticsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#007AFF]"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
);

// --- Component ---
export const Landing: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const floatingIcons = [
    { icon: <BrainIcon />, label: "Cognitive AI", position: { x: "20%", y: "20%" } },
    { icon: <MicIcon />, label: "Verbal", position: { x: "75%", y: "25%" } },
    { icon: <ShieldIcon />, label: "Secure", position: { x: "15%", y: "65%" } },
    { icon: <AnalyticsIcon />, label: "Insight", position: { x: "80%", y: "60%" } },
  ];

  const brands = [
    { name: "Acme", logo: "ACME CORP" },
    { name: "Globex", logo: "GLOBEX" },
    { name: "Soylent", logo: "SOYLENT" },
    { name: "Initech", logo: "INITECH" },
    { name: "Umbrella", logo: "UMBRELLA" },
    { name: "Stark", logo: "STARK IND" },
    { name: "Cyberdyne", logo: "CYBERDYNE" },
  ];

  const teamMembers = [
    { name: "Muhammad Hassan Nadeem", id: "Se221109", role: "AI Lead" },
    { name: "Muhammad Hamza Irfan", id: "Se221114", role: "Backend" },
    { name: "Abdul Rehman Paracha", id: "SE221068", role: "Frontend" },
    { name: "M.Ahsan", id: "SE221099", role: "QA" },
  ];

  return (
    <section className="relative w-full min-h-screen flex flex-col overflow-hidden bg-black text-white selection:bg-[#007AFF] selection:text-white font-sans">
      {/* Radial Glow Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            width: "1200px",
            height: "1200px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 flex flex-row justify-between items-center px-6 lg:px-12 py-5 border-b border-white/5 bg-black/50 backdrop-blur-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
             <div className="w-3.5 h-3.5 bg-black rounded-sm"></div>
          </div>
          <div className="text-lg text-white font-medium">
            Cogniview
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex flex-row items-center gap-6" aria-label="Main navigation">
          {["For Recruiters", "For Candidates", "Enterprise", "Security"].map((label, index) => (
            <button
              key={index}
              className="hover:text-[#007AFF] transition-colors text-xs font-medium text-white/70"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Contact Button */}
        <button
          onClick={() => onNavigate('login-recruiter')}
          className="px-5 py-2 rounded-full transition-all hover:bg-white/5 hover:border-white/40 group border border-white/20 text-xs font-medium text-white"
        >
          Sign In <span className="inline-block transition-transform group-hover:translate-x-1 ml-1">→</span>
        </button>
      </motion.header>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-24">
        {/* Floating Icons */}
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute hidden md:flex flex-col items-center gap-2"
            style={{ left: item.position.x, top: item.position.y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -15, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: 0.3 + index * 0.1 },
              scale: { duration: 0.6, delay: 0.3 + index * 0.1 },
              y: {
                duration: 4 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/5 backdrop-blur-md border border-[#007AFF]/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,122,255,0.1)]">
              {item.icon}
            </div>
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-2">
              {item.label}
            </span>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center text-center max-w-3xl gap-6"
        >
          {/* Logo Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg"
          >
            <span className="text-[9px] font-bold text-[#007AFF] tracking-widest uppercase">
              Intelligence Engine v2.5
            </span>
          </motion.div>

          {/* Title - Reduced Size */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            The Future of
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#5AC8FA] to-[#007AFF]">
              Verbal Intelligence.
            </span>
          </h1>

          {/* Subtitle - Reduced Size */}
          <p className="text-sm md:text-base text-white/60 max-w-lg leading-relaxed">
            Automate your initial screening with the world's most advanced verbal AI interviewer. Objective, bias-free, and infinitely scalable.
          </p>

          {/* CTA Buttons - Reduced Size */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('login-recruiter')}
              className="px-8 py-3 rounded-xl transition-all group relative overflow-hidden bg-[#007AFF] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,122,255,0.25)]"
            >
              <span className="relative z-10">Start Hiring Now</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => onNavigate('login-candidate')}
              className="px-8 py-3 rounded-xl transition-all group relative overflow-hidden glass border border-white/20 hover:bg-white/10 text-sm font-semibold text-white"
            >
              <span className="relative z-10">Start Your Interview</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Brand Slider - Condensed */}
      <div className="relative z-10 w-full overflow-hidden border-t border-white/5 bg-black/20 backdrop-blur-sm py-8">
        <div className="text-center mb-6">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Trusted by forward-thinking teams</span>
        </div>
        
        <div className="absolute left-0 top-0 bottom-0 z-10 w-[150px] bg-gradient-to-r from-black to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 z-10 w-[150px] bg-gradient-to-l from-black to-transparent pointer-events-none" />

        <motion.div
          className="flex items-center"
          animate={{ x: [0, -(brands.length * 160)] }}
          transition={{
            x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" },
          }}
          style={{ gap: "60px", paddingLeft: "60px" }}
        >
          {[...brands, ...brands, ...brands].map((brand, index) => (
            <div key={index} className="flex-shrink-0 flex items-center justify-center opacity-30 hover:opacity-80 transition-opacity cursor-default w-[100px]">
              <span className="text-sm font-bold tracking-tighter">{brand.logo}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bento Grid Architecture Section - Condensed */}
      <div id="architecture" className="relative z-20 w-full max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-6">
           <div className="space-y-2">
             <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] text-[9px] font-bold uppercase tracking-widest">
                Final Year Project
             </span>
             <h2 className="text-3xl font-bold tracking-tight text-white">Project Specs</h2>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min">
           {/* Cell 1: Core Innovation */}
           <div className="md:col-span-2 row-span-2 glass rounded-[24px] p-8 border border-white/10 relative overflow-hidden group min-h-[300px]">
              <div className="absolute top-0 right-0 w-60 h-60 bg-[#007AFF]/20 blur-[80px] rounded-full group-hover:bg-[#007AFF]/30 transition-all duration-700"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center mb-4 shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Multimodal Intelligence</h3>
                    <p className="text-white/60 leading-relaxed text-xs md:text-sm">
                      Moving beyond simple text-to-text processing, Cogniview utilizes raw PCM audio streaming to analyze tone, confidence, and hesitation markers in real-time.
                    </p>
                 </div>
                 <div className="flex gap-2 flex-wrap mt-6">
                    {['React 19', 'Multimodal AI', 'WebRTC', 'Tailwind'].map(tag => (
                       <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/70">
                         {tag}
                       </span>
                    ))}
                 </div>
              </div>
           </div>

           {/* Cell 2: Stats */}
           <div className="md:col-span-2 glass rounded-[24px] p-6 border border-white/10 flex items-center justify-between relative overflow-hidden">
               <div className="relative z-10">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">System Latency</p>
                  <p className="text-3xl font-bold text-white">&lt; 40ms <span className="text-xs text-white/40 font-normal">avg</span></p>
               </div>
               <div className="w-14 h-14 rounded-full border-2 border-[#007AFF]/20 border-t-[#007AFF] animate-spin"></div>
           </div>

           {/* Cell 3: Team Roster (Merged) */}
           <div className="md:col-span-2 glass rounded-[24px] p-6 border border-white/10 flex flex-col relative overflow-hidden">
               <h3 className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-4">Development Team</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {teamMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-[#007AFF] font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-white">{member.name}</p>
                           <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{member.id}</p>
                        </div>
                    </div>
                 ))}
               </div>
           </div>
        </div>
      </div>

      {/* Footer - Condensed */}
      <footer className="relative z-10 w-full border-t border-white/5 bg-black py-12 px-6">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-black rounded-[1px]"></div>
                </div>
                <span className="font-bold text-sm text-white">Cogniview</span>
              </div>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                Reimagining recruitment through autonomous, bias-free artificial intelligence.
              </p>
            </div>
            
            <div className="flex gap-12">
               <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Platform</h4>
                  <ul className="space-y-1.5 text-xs text-white/60">
                     <li className="hover:text-white cursor-pointer transition-colors">Recruiters</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Candidates</li>
                  </ul>
               </div>
               <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Legal</h4>
                  <ul className="space-y-1.5 text-xs text-white/60">
                     <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
                     <li className="hover:text-white cursor-pointer transition-colors">Terms</li>
                  </ul>
               </div>
            </div>
         </div>
         <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[9px] text-white/30 uppercase tracking-widest">
            <p>© 2024 Cogniview Inc.</p>
            <p>Designed by FYP Group 12</p>
         </div>
      </footer>
    </section>
  );
};
