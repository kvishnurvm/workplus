import React from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { formatTime12, formatHoursMinutes } from '../../utils/timeUtils';
import {
  CheckCircle,
  AlertTriangle,
  Coffee,
  Calendar,
  Clock,
  Hourglass,
  Briefcase,
  Layers,
} from 'lucide-react';

export const MetricsGrid: React.FC = () => {
  const { metrics, activeShift, dayType } = useWorkPulse();

  const isOff = dayType === 'off';
  const halfDayTimeStr = formatTime12(metrics.halfDayCompleteTime);
  const excludeBreakStr = formatTime12(metrics.excludeBreakPunchOut);
  const allowedBreak = activeShift.allowed_break_minutes || 80;

  // Break Left Label and Color
  const breakTitle = isOff ? 'Break Taken' : 'Break Left';
  const breakSub = isOff ? 'Recorded breaks' : `of ${allowedBreak}m allowed`;
  let breakValueStr = formatHoursMinutes(metrics.breakLeftMin);
  let breakColorClass = 'tile-val-green';

  if (isOff) {
    const totalTaken = (activeShift.allowed_break_minutes || 80) - metrics.breakLeftMin;
    breakValueStr = formatHoursMinutes(totalTaken);
    breakColorClass = '';
  } else if (metrics.extraBreakMin > 0) {
    breakValueStr = '0m';
    breakColorClass = 'tile-val-red';
  }

  // Shift Completion Label
  const shiftCompletionTitle = isOff ? 'Day Length' : 'Shift Target';
  const shiftCompletionSub = isOff ? '8h pure work + break' : 'Target exit time';
  const shiftCompletionVal = isOff
    ? formatHoursMinutes(8 * 60 + ((activeShift.allowed_break_minutes || 80) - metrics.breakLeftMin))
    : excludeBreakStr;

  // Total Time Left
  const timeLeftDisplay =
    metrics.isShiftComplete && metrics.totalCompletedMin > 0 ? (
      <span className="tile-val-green">Done</span>
    ) : (
      <span className={metrics.totalCompletedMin > 0 ? 'tile-val-red' : ''}>
        {formatHoursMinutes(metrics.totalTimeLeftMin)}
      </span>
    );

  // Work Hours Left
  const workHoursLeftDisplay =
    metrics.workHoursLeftMin <= 0 && metrics.totalCompletedMin > 0 ? (
      <span className="tile-val-green">Done</span>
    ) : (
      <span className={metrics.totalCompletedMin > 0 ? 'tile-val-red' : ''}>
        {formatHoursMinutes(metrics.workHoursLeftMin)}
      </span>
    );

  return (
    <div className="metrics-grid">
      {/* 1. Half Day Complete (Wide Accent) */}
      <div className="metric-tile span-2 accent-tile">
        <div className="tile-title">
          <span>Half Day Milestone</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="tile-sub-badge">{activeShift.half_day_hours || 4}h pure work</span>
            <CheckCircle size={14} color="var(--primary)" />
          </div>
        </div>
        <div className="tile-value tile-val-green">{halfDayTimeStr}</div>
      </div>

      {/* 2. Extra Break Taken (Wide Red Alert - Only when extra break > 0) */}
      {metrics.extraBreakMin > 0 && !isOff && (
        <div className="metric-tile span-2 alert-tile">
          <div className="tile-title">
            <span style={{ color: 'var(--danger)' }}>Break Allowance Exceeded</span>
            <AlertTriangle size={14} color="var(--danger)" />
          </div>
          <div className="tile-value tile-val-red">
            +{formatHoursMinutes(metrics.extraBreakMin)} extra break
          </div>
        </div>
      )}

      {/* 3. Break Left */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>{breakTitle}</span>
          <Coffee size={13} color="var(--text-muted)" />
        </div>
        <div className={`tile-value ${breakColorClass}`}>{breakValueStr}</div>
        <div className="tile-footnote">{breakSub}</div>
      </div>

      {/* 4. Shift Completion */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>{shiftCompletionTitle}</span>
          <Calendar size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{shiftCompletionVal}</div>
        <div className="tile-footnote">{shiftCompletionSub}</div>
      </div>

      {/* 5. Total Completed */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>Total Elapsed</span>
          <Clock size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{formatHoursMinutes(metrics.totalCompletedMin)}</div>
        <div className="tile-footnote">Time since punch in</div>
      </div>

      {/* 6. Total Time Left */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>Shift Time Left</span>
          <Hourglass size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{timeLeftDisplay}</div>
        <div className="tile-footnote">Until shift complete</div>
      </div>

      {/* 7. Work Hours Left (hidden on off day) */}
      {!isOff && (
        <div className="metric-tile">
          <div className="tile-title">
            <span>Work Remaining</span>
            <Briefcase size={13} color="var(--text-muted)" />
          </div>
          <div className="tile-value">{workHoursLeftDisplay}</div>
          <div className="tile-footnote">Pure work goal</div>
        </div>
      )}

      {/* 8. Actual Worked Time */}
      <div className={`metric-tile ${isOff ? 'span-2' : ''}`}>
        <div className="tile-title">
          <span>Actual Worked</span>
          <Layers size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{formatHoursMinutes(metrics.actualWorkedMin)}</div>
        <div className="tile-footnote">Excludes all breaks</div>
      </div>
    </div>
  );
};
