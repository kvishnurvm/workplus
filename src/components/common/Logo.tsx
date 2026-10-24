import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const dimensions = {
    sm: { icon: 28, titleSize: 'text-base', subSize: 'text-[10px]' },
    md: { icon: 38, titleSize: 'text-xl', subSize: 'text-xs' },
    lg: { icon: 48, titleSize: 'text-2xl', subSize: 'text-sm' },
  }[size];

  return (
    <div className={`brand-logo-container ${className}`}>
      <div className="logo-icon-wrapper" style={{ width: dimensions.icon, height: dimensions.icon }}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="brand-svg"
        >
          <defs>
            <linearGradient id="wpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="wpPulseGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="wpGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Ring with Shift Markers */}
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="url(#wpGradient)"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            opacity="0.85"
          />

          {/* Glowing Inner Accent Orbit */}
          <circle
            cx="24"
            cy="24"
            r="15"
            stroke="url(#wpPulseGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="60 30"
          />

          {/* Central Pulse / Chrono Mark */}
          <path
            d="M14 24H19L21.5 17L26.5 31L29 24H34"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#wpGlow)"
          />

          {/* Dynamic Master Core Dot */}
          <circle cx="24" cy="24" r="2.2" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="brand-text">
          <div className="brand-name">
            Work<span>Pulse</span>
            <span className="brand-badge">MASTER</span>
          </div>
          <div className="brand-tagline">Dynamic Worktime Tracker</div>
        </div>
      )}
    </div>
  );
};
