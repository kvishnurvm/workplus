import React from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { Target, Zap, Activity } from 'lucide-react';

export const ProgressGauges: React.FC = () => {
  const { metrics, activeShift, dayType } = useWorkPulse();

  const isOff = dayType === 'off';
  const shiftHours = activeShift.total_shift_hours || 9;
  const halfHours = activeShift.half_day_hours || 4;

  const halfDayLabel = `Half Day Goal (${halfHours}h)`;
  const shiftLabel = isOff
    ? `Full Day Goal (8h + break)`
    : `Full Shift Goal (${shiftHours}h)`;
  const workLabel = isOff ? `Pure Work (8h)` : `Pure Work Goal`;

  const isOverBreak = metrics.extraBreakMin > 0 && !isOff;

  return (
    <div className="card progress-card">
      {/* 1. Half Day Progress */}
      <div>
        <div className="progress-row-header">
          <span className="title">
            <Target size={14} color="#f59e0b" />
            <span>{halfDayLabel}</span>
          </span>
          <span className="percent">{metrics.halfDayPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill fill-half"
            style={{ width: `${metrics.halfDayPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Full Shift Progress */}
      <div>
        <div className="progress-row-header">
          <span className="title">
            <Activity size={14} color="#10b981" />
            <span>{shiftLabel}</span>
          </span>
          <span className="percent">{metrics.shiftPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill fill-shift"
            style={{ width: `${metrics.shiftPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Pure Work Progress */}
      <div>
        <div className="progress-row-header">
          <span className="title">
            <Zap size={14} color={isOverBreak ? 'var(--danger)' : '#06b6d4'} />
            <span>{workLabel}</span>
          </span>
          <span className="percent">{metrics.workPercent}%</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${isOverBreak ? 'fill-danger' : 'fill-work'}`}
            style={{ width: `${metrics.workPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
