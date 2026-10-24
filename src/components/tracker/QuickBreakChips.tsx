import React, { useState } from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { Coffee, Utensils, Sparkles, Plus, Clock } from 'lucide-react';

export const QuickBreakChips: React.FC = () => {
  const { quickAddBreak, breakIntervals } = useWorkPulse();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMin, setCustomMin] = useState(20);
  const [customCategory, setCustomCategory] = useState('Personal Break');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMin > 0) {
      quickAddBreak(customMin, customCategory);
      setShowCustomModal(false);
    }
  };

  return (
    <div className="quick-break-section">
      <div className="chips-header">
        <span>Quick Add Break</span>
        {breakIntervals.length > 0 && (
          <span style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
            {breakIntervals.length} break{breakIntervals.length > 1 ? 's' : ''} logged today
          </span>
        )}
      </div>

      <div className="chips-scroll">
        <button
          type="button"
          className="break-chip"
          onClick={() => quickAddBreak(15, 'Tea & Coffee')}
          title="Add 15 minutes tea break"
        >
          <Coffee size={13} color="#f59e0b" />
          <span>+15m Tea</span>
        </button>

        <button
          type="button"
          className="break-chip"
          onClick={() => quickAddBreak(30, 'Quick Lunch')}
          title="Add 30 minutes lunch"
        >
          <Utensils size={13} color="#10b981" />
          <span>+30m Lunch</span>
        </button>

        <button
          type="button"
          className="break-chip"
          onClick={() => quickAddBreak(45, 'Full Lunch')}
          title="Add 45 minutes lunch"
        >
          <Utensils size={13} color="#06b6d4" />
          <span>+45m Lunch</span>
        </button>

        <button
          type="button"
          className="break-chip"
          onClick={() => quickAddBreak(10, 'Quick Stretch')}
          title="Add 10 minutes walk/stretch"
        >
          <Sparkles size={13} color="#8b5cf6" />
          <span>+10m Stretch</span>
        </button>

        <button
          type="button"
          className="break-chip"
          onClick={() => setShowCustomModal(true)}
          style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}
        >
          <Plus size={13} color="var(--primary)" />
          <span>Custom...</span>
        </button>
      </div>

      {/* Break Intervals Timeline (if any logged) */}
      {breakIntervals.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
          }}
        >
          {breakIntervals.map((b) => (
            <span
              key={b.id}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              <b>{b.category}</b> ({b.duration_minutes}m) at {b.start_time}
            </span>
          ))}
        </div>
      )}

      {/* Custom Break Modal */}
      {showCustomModal && (
        <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Clock size={16} />
                <span>Add Custom Break</span>
              </div>
            </div>
            <form onSubmit={handleCustomSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Break Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g. Doctor appointment, Walk"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    className="form-input"
                    value={customMin}
                    onChange={(e) => setCustomMin(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCustomModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Break
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
