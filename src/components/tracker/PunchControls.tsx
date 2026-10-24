import React, { useRef } from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import { Briefcase, Coffee, RotateCcw, Play, CheckCircle, Clock } from 'lucide-react';

export const PunchControls: React.FC = () => {
  const {
    dayType,
    setDayType,
    inputPunchIn,
    inputBreak,
    setPunchInHours,
    setPunchInMinutes,
    setBreakHours,
    setBreakMinutes,
    punchInNow,
    punchOutNow,
    clearTimes,
    isPunchActive,
    todayLog,
    activeShift,
    shifts,
    changeActiveShift,
  } = useWorkPulse();

  const inHHRef = useRef<HTMLInputElement>(null);
  const inMMRef = useRef<HTMLInputElement>(null);
  const brkHHRef = useRef<HTMLInputElement>(null);
  const brkMMRef = useRef<HTMLInputElement>(null);

  const handleInHHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setPunchInHours(val);
    if (val.length === 2 && inMMRef.current) {
      inMMRef.current.focus();
      inMMRef.current.select();
    }
  };

  const handleInMMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setPunchInMinutes(val);
    if (val.length === 2 && brkHHRef.current) {
      brkHHRef.current.focus();
      brkHHRef.current.select();
    }
  };

  const handleBrkHHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setBreakHours(val);
    if (val.length === 2 && brkMMRef.current) {
      brkMMRef.current.focus();
      brkMMRef.current.select();
    }
  };

  const handleBrkMMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setBreakMinutes(val);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentVal: string,
    prevRef?: React.RefObject<HTMLInputElement | null>,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) => {
    if (e.key === 'Backspace' && currentVal === '' && prevRef?.current) {
      prevRef.current.focus();
    } else if (e.key === 'Enter' && nextRef?.current) {
      nextRef.current.focus();
    }
  };

  return (
    <div>
      {/* Day Type Toggle (Working Day vs Non-working Day) */}
      <div className="mode-segment" role="group" aria-label="Day Type Selection">
        <button
          type="button"
          className={`mode-btn ${dayType === 'work' ? 'active' : ''}`}
          onClick={() => setDayType('work')}
        >
          <Briefcase size={16} />
          <span>Working Day</span>
        </button>
        <button
          type="button"
          className={`mode-btn off ${dayType === 'off' ? 'active' : ''}`}
          onClick={() => setDayType('off')}
        >
          <Coffee size={16} />
          <span>Non-Working Day</span>
        </button>
      </div>

      {/* Shift Selector Strip (Touch Friendly on Mobile) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Clock size={14} color="var(--primary)" />
          <span>Active Shift:</span>
        </div>
        <select
          value={activeShift.id}
          onChange={(e) => changeActiveShift(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--primary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Change active shift rules"
        >
          {shifts.map((s) => (
            <option key={s.id} value={s.id} style={{ background: '#111827', color: '#f8fafc' }}>
              {s.name} ({s.total_shift_hours}h)
            </option>
          ))}
        </select>
      </div>

      {/* Input Pairs Grid */}
      <div className="input-pair-grid">
        {/* Punch In Input Card */}
        <div className="input-field-card">
          <div className="field-header">
            <span className="field-label">
              <Briefcase size={13} color="var(--primary)" />
              Punch in (HH:MM)
            </span>
            <button
              type="button"
              className="field-action-btn"
              onClick={punchInNow}
              title="Set to Current Time"
            >
              Use Now
            </button>
          </div>
          <div className="pair-inputs">
            <input
              ref={inHHRef}
              type="text"
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputPunchIn.hh}
              onChange={handleInHHChange}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => handleKeyDown(e, inputPunchIn.hh, undefined, inMMRef)}
              className="digit-input"
              aria-label="Punch In Hour"
            />
            <span>:</span>
            <input
              ref={inMMRef}
              type="text"
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputPunchIn.mm}
              onChange={handleInMMChange}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => handleKeyDown(e, inputPunchIn.mm, inHHRef, brkHHRef)}
              className="digit-input"
              aria-label="Punch In Minute"
            />
          </div>
        </div>

        {/* Break Taken Input Card */}
        <div className="input-field-card">
          <div className="field-header">
            <span className="field-label">
              <Coffee size={13} color="var(--warning)" />
              Break taken (HH:MM)
            </span>
            <button
              type="button"
              className="field-action-btn"
              onClick={() => {
                setBreakHours('');
                setBreakMinutes('');
              }}
              title="Reset Break Input"
            >
              Reset
            </button>
          </div>
          <div className="pair-inputs">
            <input
              ref={brkHHRef}
              type="text"
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputBreak.hh}
              onChange={handleBrkHHChange}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => handleKeyDown(e, inputBreak.hh, inMMRef, brkMMRef)}
              className="digit-input"
              aria-label="Break Taken Hour"
            />
            <span>:</span>
            <input
              ref={brkMMRef}
              type="text"
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputBreak.mm}
              onChange={handleBrkMMChange}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => handleKeyDown(e, inputBreak.mm, brkHHRef, undefined)}
              className="digit-input"
              aria-label="Break Taken Minute"
            />
          </div>
        </div>
      </div>

      {/* Main Touch-Friendly Action Buttons */}
      <div className="tracker-action-buttons">
        {!isPunchActive ? (
          <button
            type="button"
            className="btn btn-primary btn-clock-action"
            onClick={punchInNow}
          >
            <Play size={16} fill="white" />
            <span>Clock In Now</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-clock-action"
            style={{
              borderColor: 'var(--success)',
              color: 'var(--success)',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
            onClick={punchOutNow}
            title={todayLog?.punch_out ? `Already punched out at ${todayLog.punch_out}` : 'Record punch out time'}
          >
            <CheckCircle size={17} />
            <span>{todayLog?.punch_out ? `Punched Out (${todayLog.punch_out})` : 'Clock Out Now'}</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '12px 18px', minHeight: '48px', fontWeight: 700 }}
          onClick={clearTimes}
          title="Clear all today punch and break inputs"
        >
          <RotateCcw size={15} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
