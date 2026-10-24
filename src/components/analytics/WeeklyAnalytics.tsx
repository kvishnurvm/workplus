import React, { useMemo } from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { querySql } from '../../db/sqlite';
import { formatHoursMinutes } from '../../utils/timeUtils';
import { Award, CheckCircle, Zap } from 'lucide-react';

export const WeeklyAnalytics: React.FC = () => {
  const { isDbReady, activeEmployee, activeShift, metrics } = useWorkPulse();

  const weekStats = useMemo(() => {
    if (!isDbReady) {
      return { totalWorkedMinutes: 0, daysLogged: 0, complianceRate: 100, days: [] };
    }

    try {
      const rows = querySql<{ date: string; break_minutes: number; day_type: string }>(
        'SELECT date, break_minutes, day_type FROM time_logs ORDER BY date DESC LIMIT 7'
      );

      const targetBreak = activeShift.allowed_break_minutes || 80;
      let compliantDays = 0;

      rows.forEach((r) => {
        if (r.break_minutes <= targetBreak) compliantDays++;
      });

      const rate = rows.length > 0 ? Math.round((compliantDays / rows.length) * 100) : 100;

      return {
        totalWorkedMinutes: metrics.actualWorkedMin,
        daysLogged: rows.length,
        complianceRate: rate,
        rows,
      };
    } catch {
      return { totalWorkedMinutes: 0, daysLogged: 0, complianceRate: 100, rows: [] };
    }
  }, [isDbReady, activeShift, metrics.actualWorkedMin]);

  const weeklyTargetHours = activeEmployee?.weekly_goal_hours || 45;
  const targetMinutes = weeklyTargetHours * 60;
  const currentWeekMinutes = weekStats.totalWorkedMinutes; // sample for today + week
  const weekProgressPercent = Math.min(100, Math.round((currentWeekMinutes / targetMinutes) * 100));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Weekly Worktime Performance</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Detailed compliance, shift achievement, and weekly target progress for{' '}
          <b>{activeEmployee?.name || 'Current Employee'}</b>.
        </p>
      </div>

      {/* Target Progress Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Weekly Target Progress
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>
              {formatHoursMinutes(currentWeekMinutes)}{' '}
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                / {weeklyTargetHours}h Goal
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              {weekProgressPercent}%
            </span>
          </div>
        </div>

        <div className="progress-track" style={{ height: '12px' }}>
          <div
            className="progress-fill fill-shift"
            style={{ width: `${weekProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Break Compliance</span>
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              margin: '8px 0 4px',
            }}
          >
            {weekStats.complianceRate}%
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Days completed without exceeding the {activeShift.allowed_break_minutes}m allowance limit.
          </p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <Zap size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Shift Efficiency</span>
          </div>
          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              margin: '8px 0 4px',
            }}
          >
            {metrics.workPercent}%
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Ratio of pure work completed against today's net active goal.
          </p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Active Role</span>
          </div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              margin: '8px 0 4px',
              color: 'var(--text-primary)',
            }}
          >
            {activeEmployee?.role || 'Engineer'}
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Department: {activeEmployee?.department || 'Operations'}
          </p>
        </div>
      </div>
    </div>
  );
};
