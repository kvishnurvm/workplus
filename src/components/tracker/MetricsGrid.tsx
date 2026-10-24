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
  const breakTitle = isOff ? 'Break taken' : `Break left (of ${allowedBreak}m)`;
  let breakValueStr = `${Math.floor(metrics.breakLeftMin / 60)} hour ${metrics.breakLeftMin % 60} minutes`;
  let breakColorClass = 'tile-val-green';

  if (isOff) {
    const totalTaken = (activeShift.allowed_break_minutes || 80) - metrics.breakLeftMin; // fallback
    breakValueStr = formatHoursMinutes(totalTaken);
    breakColorClass = '';
  } else if (metrics.extraBreakMin > 0) {
    breakValueStr = '0 hour 0 minutes';
    breakColorClass = 'tile-val-red';
  }

  // Shift Completion Label
  const shiftCompletionTitle = isOff ? 'Day length (8h + break)' : 'Shift completion';
  const shiftCompletionVal = isOff
    ? formatHoursMinutes(8 * 60 + ((activeShift.allowed_break_minutes || 80) - metrics.breakLeftMin))
    : excludeBreakStr;

  // Total Time Left
  const timeLeftDisplay =
    metrics.isShiftComplete && metrics.totalCompletedMin > 0 ? (
      <span className="tile-val-green">Shift Completed</span>
    ) : (
      <span className={metrics.totalCompletedMin > 0 ? 'tile-val-red' : ''}>
        {formatHoursMinutes(metrics.totalTimeLeftMin)}
      </span>
    );

  // Work Hours Left
  const workHoursLeftDisplay =
    metrics.workHoursLeftMin <= 0 && metrics.totalCompletedMin > 0 ? (
      <span className="tile-val-green">Work Completed</span>
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
          <span>Half day complete ({activeShift.half_day_hours || 4}h work + break)</span>
          <CheckCircle size={15} color="var(--primary)" />
        </div>
        <div className="tile-value tile-val-green">{halfDayTimeStr}</div>
      </div>

      {/* 2. Extra Break Taken (Wide Red Alert - Only when extra break > 0) */}
      {metrics.extraBreakMin > 0 && !isOff && (
        <div className="metric-tile span-2 alert-tile">
          <div className="tile-title">
            <span style={{ color: 'var(--danger)' }}>Extra break taken</span>
            <AlertTriangle size={15} color="var(--danger)" />
          </div>
          <div className="tile-value tile-val-red">
            {formatHoursMinutes(metrics.extraBreakMin)}
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
      </div>

      {/* 4. Shift Completion */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>{shiftCompletionTitle}</span>
          <Calendar size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{shiftCompletionVal}</div>
      </div>

      {/* 5. Total Completed */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>Total completed</span>
          <Clock size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{formatHoursMinutes(metrics.totalCompletedMin)}</div>
      </div>

      {/* 6. Total Time Left */}
      <div className="metric-tile">
        <div className="tile-title">
          <span>Total time left</span>
          <Hourglass size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{timeLeftDisplay}</div>
      </div>

      {/* 7. Work Hours Left (hidden on off day) */}
      {!isOff && (
        <div className="metric-tile">
          <div className="tile-title">
            <span>Work hours left</span>
            <Briefcase size={13} color="var(--text-muted)" />
          </div>
          <div className="tile-value">{workHoursLeftDisplay}</div>
        </div>
      )}

      {/* 8. Actual Worked Time */}
      <div className={`metric-tile ${isOff ? 'span-2' : ''}`}>
        <div className="tile-title">
          <span>Actual worked time</span>
          <Layers size={13} color="var(--text-muted)" />
        </div>
        <div className="tile-value">{formatHoursMinutes(metrics.actualWorkedMin)}</div>
      </div>
    </div>
  );
};
