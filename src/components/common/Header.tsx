import React from 'react';
import { Logo } from './Logo';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { formatLiveClock } from '../../utils/timeUtils';
import {
  Sliders,
  Clock,
  Download,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface HeaderProps {
  onOpenMaster: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMaster, activeTab, setActiveTab }) => {
  const {
    currentTime,
    activeShift,
    shifts,
    changeActiveShift,
    exportDatabaseFile,
  } = useWorkPulse();

  const clock = formatLiveClock(currentTime);

  return (
    <header className="header-bar">
      <div className="header-inner">
        {/* Brand Logo */}
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onClick={() => setActiveTab('tracker')}
          title="Return to Tracker"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="desktop-nav-tabs">
          <button
            type="button"
            className={`btn ${activeTab === 'tracker' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: '36px' }}
            onClick={() => setActiveTab('tracker')}
          >
            <Clock size={14} />
            <span>Tracker</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: '36px' }}
            onClick={() => setActiveTab('logs')}
          >
            <Calendar size={14} />
            <span>Attendance Logs</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: '36px' }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={14} />
            <span>Analytics</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Live Digital Clock Badge */}
          <div className="header-live-clock" title="Current Time">
            <Clock size={13} color="var(--primary)" />
            <span>{clock.time}</span>
            <span className="sec">:{clock.seconds}</span>
            <span className="ampm">{clock.period}</span>
          </div>

          {/* Desktop-Only Shift Selector */}
          <div className="hide-on-mobile" style={{ alignItems: 'center' }}>
            <select
              value={activeShift.id}
              onChange={(e) => changeActiveShift(e.target.value)}
              className="form-select"
              style={{
                padding: '6px 10px',
                minHeight: '36px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--bg-input)',
                borderColor: 'var(--border-card)',
                maxWidth: '150px',
                cursor: 'pointer',
              }}
              title="Select Shift Preset"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.total_shift_hours}h)
                </option>
              ))}
            </select>
          </div>

          {/* Desktop-Only Quick SQLite Export */}
          <button
            type="button"
            className="btn btn-secondary btn-icon hide-on-mobile"
            style={{ width: '36px', height: '36px', minWidth: '36px' }}
            onClick={exportDatabaseFile}
            title="Download SQLite Database (.sqlite)"
            aria-label="Export SQLite Database"
          >
            <Download size={15} />
          </button>

          {/* Master Setup Action Button - Desktop Only (Mobile has dedicated Bottom Nav item) */}
          <button
            type="button"
            className="btn btn-primary hide-on-mobile"
            onClick={onOpenMaster}
            style={{
              padding: '7px 12px',
              fontSize: '0.82rem',
              minHeight: '36px',
            }}
            title="Open Master Setup & Timings"
          >
            <Sliders size={14} />
            <span>Master Setup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
