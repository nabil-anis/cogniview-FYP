
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className = '', 
  ...props 
}) => {
  // Xiaomi Aesthetic: Pill shapes or very rounded rectangles, subtle scaling on click
  const baseStyles = "inline-flex items-center justify-center font-medium transition-transform active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none";
  
  const variants = {
    primary: "bg-white text-black shadow-lg shadow-white/10 hover:bg-gray-100",
    secondary: "bg-[#333] text-white hover:bg-[#444]",
    outline: "bg-transparent text-white border border-white/20 hover:bg-white/5",
    ghost: "bg-transparent text-white/60 hover:text-white hover:bg-white/5",
    danger: "bg-[#2d1a1a] text-[#ff5a5a] border border-[#ff5a5a]/20"
  };

  const sizes = {
    xs: "px-2.5 py-1 text-[10px] rounded-full",
    sm: "px-3 py-1.5 text-xs rounded-full",
    md: "px-5 py-2 text-xs md:text-sm rounded-full", // Pill shape
    lg: "px-6 py-3 text-sm rounded-[16px]" // Tighter large button
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, noPadding?: boolean }> = ({ children, className = "", noPadding = false }) => (
  // HyperOS Card: Dark grey surface, large rounded corners, very subtle border
  <div className={`bg-[#1C1C1E] border border-white/[0.08] rounded-[24px] overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, subLabel?: string }> = ({ label, subLabel, ...props }) => (
  <div className="w-full space-y-2">
    {(label || subLabel) && (
      <div className="flex justify-between items-end px-1">
        {label && <label className="text-xs font-medium text-white/70">{label}</label>}
        {subLabel && <span className="text-[10px] text-white/40 uppercase tracking-wider">{subLabel}</span>}
      </div>
    )}
    <input 
      {...props} 
      className={`w-full px-4 py-3 rounded-[14px] bg-[#2C2C2E] border-none text-white placeholder-white/20 text-sm outline-none focus:ring-1 focus:ring-[#007AFF]/50 transition-all ${props.className || ''}`}
    />
  </div>
);
