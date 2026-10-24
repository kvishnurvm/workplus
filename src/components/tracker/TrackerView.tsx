import React from 'react';
import { PunchControls } from './PunchControls';
import { HeroPrediction } from './HeroPrediction';
import { QuickBreakChips } from './QuickBreakChips';
import { ProgressGauges } from './ProgressGauges';
import { MetricsGrid } from './MetricsGrid';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { formatFullDate } from '../../utils/timeUtils';
import { Calendar } from 'lucide-react';

export const TrackerView: React.FC = () => {
  const { currentTime, activeEmployee, activeShift } = useWorkPulse();

  return (
    <div>
      {/* Desktop Welcome & Date Banner */}
      <div
        className="hide-on-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Worktime Dashboard
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
            }}
          >
            <Calendar size={13} />
            <span>{formatFullDate(currentTime)}</span>
          </div>
        </div>

        {/* Desktop Profile Pill */}
        {activeEmployee && (
          <div
            className="card"
            style={{
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '999px',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
              }}
            >
              {activeEmployee.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{activeEmployee.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {activeEmployee.role} • {activeShift.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Grid: Single Column on Mobile, 2 Columns on Desktop */}
      <div className="desktop-dashboard-grid">
        {/* Left Column (Primary Punch & Hero Prediction) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Hero Punch-Out Prediction Card */}
          <HeroPrediction />

          {/* Punch Controls (Inputs + Buttons) */}
          <PunchControls />

          {/* Quick Break Chips */}
          <QuickBreakChips />
        </div>

        {/* Right Column (Progress Gauges & Metrics Grid) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Progress Bars */}
          <ProgressGauges />

          {/* Metrics Grid */}
          <MetricsGrid />
        </div>
      </div>
    </div>
  );
};
