import React from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { formatTime12, formatHoursMinutes } from '../../utils/timeUtils';
import { CheckCircle2, Clock, Flame, AlertCircle } from 'lucide-react';

export const HeroPrediction: React.FC = () => {
  const { metrics, isPunchActive, activeShift, dayType } = useWorkPulse();

  const punchOutStr = formatTime12(metrics.punchOutTarget);

  // Status Badge Logic
  let statusBadge = (
    <div className="hero-status-pill pill-idle">
      <Clock size={12} />
      <span>Awaiting Punch In</span>
    </div>
  );

  if (isPunchActive) {
    if (metrics.isOvertime) {
      statusBadge = (
        <div className="hero-status-pill pill-overtime">
          <Flame size={12} />
          <span>Overtime ({formatHoursMinutes(Math.abs(metrics.totalTimeLeftMin))})</span>
        </div>
      );
    } else if (metrics.isShiftComplete) {
      statusBadge = (
        <div className="hero-status-pill pill-completed">
          <CheckCircle2 size={12} />
          <span>Shift Goal Met</span>
        </div>
      );
    } else {
      statusBadge = (
        <div className="hero-status-pill pill-active">
          <span className="hero-pulse-dot" />
          <span>Active Shift</span>
        </div>
      );
    }
  }

  // Subtitle
  const subtitle =
    dayType === 'off' ? (
      <>
        <b>8h</b> of pure work • Break time excluded from goal
      </>
    ) : (
      <>
        Full shift <b>{activeShift.total_shift_hours}h</b> with{' '}
        <b>{activeShift.allowed_break_minutes}m</b> break allowance
      </>
    );

  return (
    <div className="hero-card">
      <div className="hero-badge-row">
        {statusBadge}
        {isPunchActive && metrics.isHalfDayComplete && (
          <div
            className="hero-status-pill pill-completed"
            title="Half Day 4h Pure Work Completed!"
          >
            <CheckCircle2 size={11} />
            <span>Half Day Done</span>
          </div>
        )}
      </div>

      <div className="hero-label">Estimated Punch Out</div>
      <div className="hero-time">{punchOutStr}</div>
      <div className="hero-sub">{subtitle}</div>

      {metrics.extraBreakMin > 0 && dayType !== 'off' && (
        <div
          style={{
            marginTop: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--danger)',
            background: 'var(--danger-glow)',
            padding: '4px 10px',
            borderRadius: '999px',
          }}
        >
          <AlertCircle size={13} />
          <span>Punch-out shifted +{formatHoursMinutes(metrics.extraBreakMin)} for extra break</span>
        </div>
      )}
    </div>
  );
};
