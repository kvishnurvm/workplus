import React, { useState, useEffect } from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import type { TimeLog } from '../../types';
import { querySql, executeSql } from '../../db/sqlite';
import { formatHoursMinutes } from '../../utils/timeUtils';
import {
  Calendar,
  Trash2,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';

export const LogsView: React.FC = () => {
  const { isDbReady, activeEmployee, shifts } = useWorkPulse();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  const loadLogs = () => {
    if (!isDbReady) return;
    try {
      const records = querySql<TimeLog>(
        'SELECT * FROM time_logs ORDER BY date DESC, created_at DESC LIMIT 50'
      );
      setLogs(records);
    } catch (e) {
      console.error('Failed to load logs:', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [isDbReady, activeEmployee]);

  const handleDelete = (id: string) => {
    if (confirm('Delete this attendance log?')) {
      executeSql('DELETE FROM time_logs WHERE id = ?', [id]);
      executeSql('DELETE FROM break_intervals WHERE log_id = ?', [id]);
      loadLogs();
    }
  };

  const handleExportCsv = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Date', 'Employee', 'Day Type', 'Punch In', 'Punch Out', 'Break (Mins)', 'Status'];
    const rows = logs.map((l) => [
      l.id,
      l.date,
      l.employee_id,
      l.day_type,
      l.punch_in,
      l.punch_out || '',
      l.break_minutes,
      l.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workpulse_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    return l.day_type === filterType;
  });

  // Calculate summary metrics
  const totalDays = logs.length;
  const totalBreaksMin = logs.reduce((acc, curr) => acc + (curr.break_minutes || 0), 0);
  const avgBreakMin = totalDays > 0 ? Math.round(totalBreaksMin / totalDays) : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Banner with Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
          gap: '8px',
          marginBottom: '14px',
        }}
      >
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Days Tracked
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {totalDays}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Breaks Recorded
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            {formatHoursMinutes(totalBreaksMin)}
          </div>
        </div>

        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Avg Break / Day
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {avgBreakMin}m
          </div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', width: 'auto' }}
          >
            <option value="all">All Days</option>
            <option value="work">Working Days</option>
            <option value="off">Non-Working / Off Days</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <FileSpreadsheet size={14} color="var(--success)" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Logs Table / Card List */}
      {filteredLogs.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '36px 16px',
            color: 'var(--text-muted)',
          }}
        >
          <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Attendance Records Yet</h4>
          <p style={{ fontSize: '0.82rem' }}>
            Punch in on the Tracker tab to automatically save your attendance logs to SQLite.
          </p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Shift</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Break Taken</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const shiftObj = shifts.find((s) => s.id === log.shift_id);
                return (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.date}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: log.day_type === 'work' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: log.day_type === 'work' ? 'var(--primary)' : 'var(--success)',
                          fontWeight: 700,
                        }}
                      >
                        {log.day_type.toUpperCase()}
                      </span>
                    </td>
                    <td>{shiftObj?.name || log.shift_id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.punch_in}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {log.punch_out || <span style={{ color: 'var(--text-muted)' }}>--:--</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatHoursMinutes(log.break_minutes)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: log.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                          fontWeight: 700,
                        }}
                      >
                        {log.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        onClick={() => handleDelete(log.id)}
                        title="Delete log"
                      >
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
