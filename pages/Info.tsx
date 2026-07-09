import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  User, 
  Building2, 
  ShieldCheck, 
  Scale, 
  ArrowLeft, 
  CheckCircle, 
  Zap, 
  Activity, 
  Cpu, 
  Lock, 
  Eye, 
  Database,
  BarChart4,
  Check
} from 'lucide-react';

export type InfoTopic = 'for-recruiters' | 'for-candidates' | 'enterprise' | 'security' | 'privacy' | 'terms';

interface InfoProps {
  topic: InfoTopic;
  onBack: () => void;
}

export const Info: React.FC<InfoProps> = ({ topic, onBack }) => {
  // Topic static configuration
  const config = {
    'for-recruiters': {
      title: 'For Recruiters',
      subtitle: 'AI-Powered Automated Screening & Talent Evaluation',
      badge: 'Recruiter Platform',
      icon: <Briefcase className="w-8 h-8 text-[#8B5CF6]" />,
      accentColor: '#8B5CF6',
      heroBg: 'from-[#8B5CF6]/10',
      description: 'Streamline your sourcing pipelines and make hiring objective. Cogniview automates initial technical and verbal screening, allowing you to evaluate thousands of candidates simultaneously without human bottleneck.',
      features: [
        {
          title: 'Customized Conversational AI',
          description: 'Design specific interview scenarios targeting exact job requirements, technologies, and corporate values.',
          icon: <Cpu className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Adaptive Follow-up Engine',
          description: 'Our speech agent dynamically probes deep, asking intelligent secondary questions based on the candidate’s spoken answers.',
          icon: <Zap className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Detailed Analytical Insights',
          description: 'Receive rich reports containing full, high-accuracy transcripts, communication skills scoring, and comprehensive feedback.',
          icon: <BarChart4 className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Integrate Existing Tools',
          description: 'Sync evaluation scores and profile reports seamlessly with Workday, Greenhouse, Lever, and standard API systems.',
          icon: <Database className="w-5 h-5 text-[#8B5CF6]" />
        }
      ],
      stats: [
        { label: 'Time Saved', value: '82%' },
        { label: 'Evaluation Speed', value: 'Instant' },
        { label: 'Sourcing Scale', value: 'Infinite' }
      ]
    },
    'for-candidates': {
      title: 'For Candidates',
      subtitle: 'Bias-Free, Relaxed, and High-Performance Verbal Interviews',
      badge: 'Candidate Hub',
      icon: <User className="w-8 h-8 text-[#0D9488]" />,
      accentColor: '#0D9488',
      heroBg: 'from-[#0D9488]/10',
      description: 'Your voice, your skills, your schedule. Cogniview provides a calm, pressure-free assessment environment designed to evaluate what truly matters—your problem-solving ability and structured communication.',
      features: [
        {
          title: 'Comfortable & Flexible',
          description: 'Skip scheduling anxiety. Take the interview whenever you perform best, in a quiet and distraction-free environment.',
          icon: <CheckCircle className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Paced Voice Recognition',
          description: 'Speak naturally. Our advanced audio detector pauses when you pause, letting you compose thoughts without rush.',
          icon: <Activity className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Transparent Feedback',
          description: 'Get constructive performance statistics after review, helping you understand core communication strengths.',
          icon: <BarChart4 className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Protected Identity & Privacy',
          description: 'Your data is strictly secured. Transcripts are processed solely for the evaluation of the job role you applied for.',
          icon: <Lock className="w-5 h-5 text-[#0D9488]" />
        }
      ],
      stats: [
        { label: 'Stress Level', value: 'Reduced' },
        { label: 'Standard Duration', value: '15-20m' },
        { label: 'Device Support', value: 'Universal' }
      ]
    },
    'enterprise': {
      title: 'Enterprise Solution',
      subtitle: 'Global Operations, Custom LLMs, and Premium Infrastructure',
      badge: 'Enterprise Specs',
      icon: <Building2 className="w-8 h-8 text-[#8B5CF6]" />,
      accentColor: '#8B5CF6',
      heroBg: 'from-[#8B5CF6]/10',
      description: 'Scale global sourcing operations with extreme confidence. Built for multi-region coordination, customized speech modeling, and deep, secure corporate integrations.',
      features: [
        {
          title: 'Bespoke Model Training',
          description: 'Fine-tune our models on your company’s internal glossary, tech stack, acronyms, and specialized engineering benchmarks.',
          icon: <Cpu className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'High Concurrency Streaming',
          description: 'Guaranteed support for thousands of concurrent, high-fidelity verbal audio sessions anywhere in the world without packet drop.',
          icon: <Zap className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Dedicated Account Engineering',
          description: 'Enterprise plans include an integration squad, a dedicated Solutions Architect, and 99.99% Core Service Uptime SLAs.',
          icon: <Activity className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Tenant-isolated Deployments',
          description: 'Option to run speech processing nodes, databases, and evaluation logs securely inside your private cloud environment (AWS/GCP).',
          icon: <Database className="w-5 h-5 text-[#8B5CF6]" />
        }
      ],
      stats: [
        { label: 'Uptime Guarantee', value: '99.99%' },
        { label: 'Max Concurrency', value: 'Unlimited' },
        { label: 'SLA Response', value: '< 1 Hour' }
      ]
    },
    'security': {
      title: 'Security & Trust',
      subtitle: 'Advanced Protection, Anti-Fraud Detection, and Encryption Standards',
      badge: 'Compliance & Auditing',
      icon: <ShieldCheck className="w-8 h-8 text-[#8B5CF6]" />,
      accentColor: '#8B5CF6',
      heroBg: 'from-[#8B5CF6]/10',
      description: 'Security is at the heart of Cogniview. From end-to-end encryption of speech buffers to rigid real-time anti-cheating, we maintain strict defense-in-depth across our infrastructure.',
      features: [
        {
          title: 'AES-256 & TLS 1.3 Encryption',
          description: 'All audio signals, transcripts, and evaluation files are encrypted in-transit and static database records are protected at rest.',
          icon: <Lock className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Real-time Anti-Cheating Suite',
          description: 'Proprietary computer-vision tracking identifies eye-gaze anomalies, secondary display usage, and multiple face presence.',
          icon: <Eye className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Comprehensive Audit Logs',
          description: 'Every database access, recruiter action, and configuration edit is securely captured with granular, unalterable metadata.',
          icon: <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'SOC2 Type II Prepared',
          description: 'Our backend follows strict SOC2 guidelines, undergoing third-party verification, penetration testing, and access reviews.',
          icon: <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
        }
      ],
      stats: [
        { label: 'Encryption Standard', value: 'AES-256' },
        { label: 'Gaze Capture Rate', value: '30 fps' },
        { label: 'Identity Protection', value: 'Maximum' }
      ]
    },
    'privacy': {
      title: 'Privacy Policy',
      subtitle: 'Data Sanitization, GDPR Compliance, and Candidate Protection',
      badge: 'Legal & Consent',
      icon: <ShieldCheck className="w-8 h-8 text-[#0D9488]" />,
      accentColor: '#0D9488',
      heroBg: 'from-[#0D9488]/10',
      description: 'Your speech data represents your identity. We handle every byte of data with maximum transparency and respect. We never sell profile data or train public consumer models using your private voice records.',
      features: [
        {
          title: 'Strict Data Minimization',
          description: 'We only store transcripts and core evaluation vectors essential to the role you have explicitly consented to join.',
          icon: <Check className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Right to Erasure (GDPR)',
          description: 'Candidates have complete autonomy to request the full deletion of their voice files, communication profiles, and transcripts.',
          icon: <Check className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Regional Data Storage',
          description: 'Organizations can select physical storage regions (US, EU, or APAC) to fully adhere to national residency regulations.',
          icon: <Database className="w-5 h-5 text-[#0D9488]" />
        },
        {
          title: 'Transient Audio Processing',
          description: 'Vocal frequencies are parsed live inside transient CPU threads and immediately discarded, preventing permanent voice harvesting.',
          icon: <Activity className="w-5 h-5 text-[#0D9488]" />
        }
      ],
      stats: [
        { label: 'GDPR / CCPA', value: 'Compliant' },
        { label: 'Data Retention', value: '30 Days' },
        { label: 'Third-Party Selling', value: 'Never' }
      ]
    },
    'terms': {
      title: 'Terms of Service',
      subtitle: 'Agreement, Acceptable Use, and Operational Standards',
      badge: 'Legal Agreement',
      icon: <Scale className="w-8 h-8 text-[#8B5CF6]" />,
      accentColor: '#8B5CF6',
      heroBg: 'from-[#8B5CF6]/10',
      description: 'Our standard terms outlining appropriate usage, system ownership, and boundaries of liability. By accessing the Cogniview workspace, both recruiters and candidates agree to perform in good faith.',
      features: [
        {
          title: 'Acceptable Platform Usage',
          description: 'Users are prohibited from reverse-engineering, database flooding, injection scripting, or bypassing cheating sensors.',
          icon: <Check className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Uptime Reliability Limits',
          description: 'While Cogniview target core services are hosted on robust container platforms, we are not liable for candidate ISP failure.',
          icon: <Check className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Unalterable Ownership',
          description: 'The design libraries, AI-prompt structures, gaze evaluation systems, and voice models remain exclusive patents of Cogniview.',
          icon: <Check className="w-5 h-5 text-[#8B5CF6]" />
        },
        {
          title: 'Recruiter Responsibility',
          description: 'Recruiters are solely responsible for compliance with regional employment fairness acts when acting on system outputs.',
          icon: <Check className="w-5 h-5 text-[#8B5CF6]" />
        }
      ],
      stats: [
        { label: 'Platform Version', value: 'v2.5' },
        { label: 'Liability Limit', value: 'Standard' },
        { label: 'Service Coverage', value: 'Global' }
      ]
    }
  }[topic];

  return (
    <div className="min-h-screen bg-[#070A13] text-gray-200 py-12 md:py-20 px-4 md:px-6 relative overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute"
          style={{
            width: '1000px',
            height: '1000px',
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, ${config.accentColor}0a 0%, rgba(0, 0, 0, 0) 70%)`,
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-10 md:space-y-16">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Landing
          </button>
          
          <span 
            className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border"
            style={{ 
              borderColor: `${config.accentColor}30`, 
              color: config.accentColor,
              backgroundColor: `${config.accentColor}0a`
            }}
          >
            {config.badge}
          </span>
        </div>

        {/* Hero Header */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-2">
            {config.icon}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            {config.title}
          </h1>
          <p className="text-sm md:text-lg text-white/50 max-w-2xl leading-relaxed">
            {config.subtitle}
          </p>
          <div className="w-20 h-[2px] mx-auto md:mx-0 mt-4" style={{ backgroundColor: config.accentColor }}></div>
        </div>

        {/* Short Executive Summary */}
        <div className="p-6 md:p-8 rounded-3xl bg-[#0E1524] border border-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
          <p className="text-xs md:text-sm text-white/80 leading-relaxed font-medium">
            {config.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {config.stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center"
            >
              <p className="text-[9px] md:text-xs font-bold text-white/40 uppercase tracking-widest mb-1 md:mb-2">{stat.label}</p>
              <p className="text-sm md:text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Detailed Professional Cards */}
        <div className="space-y-6">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight mb-4">Core Operational Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {config.features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-[24px] bg-[#0E1524]/50 hover:bg-[#0E1524]/80 border border-white/[0.05] hover:border-white/10 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="p-2.5 rounded-xl bg-white/5 w-fit border border-white/5 mb-4 group-hover:scale-105 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Banner Section */}
        <div className="text-center pt-8 border-t border-white/[0.05]">
          <p className="text-xs text-white/40 mb-4 uppercase tracking-widest">Interested in trying Cogniview?</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-white text-xs font-bold text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-lg hover:shadow-xl uppercase tracking-wider"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};
