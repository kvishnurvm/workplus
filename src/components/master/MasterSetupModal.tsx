import React, { useState } from 'react';
import { useWorkPulse } from '../../context/WorkPulseContext';
import type { ShiftMaster, EmployeeMaster } from '../../types';
import {
  Sliders,
  X,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Coffee,
  Users,
  Database,
  Download,
  Upload,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface MasterSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterSetupModal: React.FC<MasterSetupModalProps> = ({ isOpen, onClose }) => {
  const {
    shifts,
    saveShift,
    deleteShift,
    activeShift,
    changeActiveShift,
    employees,
    saveEmployee,
    deleteEmployee,
    activeEmployee,
    changeActiveEmployee,
    breakTypes,
    exportDatabaseFile,
    importDatabaseFile,
    resetDatabaseToDefault,
    runRawSqlQuery,
  } = useWorkPulse();

  const [activeTab, setActiveTab] = useState<'shifts' | 'breaks' | 'employees' | 'sqlite'>('shifts');

  // Form states for Shift
  const [editingShift, setEditingShift] = useState<Partial<ShiftMaster> | null>(null);

  // Form states for Employee
  const [editingEmployee, setEditingEmployee] = useState<Partial<EmployeeMaster> | null>(null);

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM shift_master;');
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Shift Form Submit
  const handleShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift || !editingShift.name) return;

    const shiftToSave: ShiftMaster = {
      id: editingShift.id || `shift_${Date.now()}`,
      name: editingShift.name,
      total_shift_hours: Number(editingShift.total_shift_hours) || 9,
      allowed_break_minutes: Number(editingShift.allowed_break_minutes) || 80,
      half_day_hours: Number(editingShift.half_day_hours) || 4,
      default_start_time: editingShift.default_start_time || '09:30',
      is_default: editingShift.is_default ? 1 : 0,
      color: editingShift.color || '#3b82f6',
      description: editingShift.description || '',
    };

    saveShift(shiftToSave);
    setEditingShift(null);
  };

  // Handle Employee Form Submit
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name) return;

    const empToSave: EmployeeMaster = {
      id: editingEmployee.id || `EMP-${Date.now().toString().slice(-4)}`,
      name: editingEmployee.name,
      role: editingEmployee.role || 'Staff Member',
      department: editingEmployee.department || 'Operations',
      email: editingEmployee.email || '',
      default_shift_id: editingEmployee.default_shift_id || activeShift.id,
      weekly_goal_hours: Number(editingEmployee.weekly_goal_hours) || 45,
    };

    saveEmployee(empToSave);
    setEditingEmployee(null);
  };

  // Handle SQL Console Execute
  const handleRunSql = () => {
    try {
      setSqlError(null);
      const res = runRawSqlQuery(sqlQuery);
      setSqlResults(res);
    } catch (err: any) {
      setSqlError(err?.message || 'SQL execution failed');
      setSqlResults(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await importDatabaseFile(file);
      if (ok) {
        alert('SQLite database imported successfully!');
      } else {
        alert('Failed to import SQLite file.');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Grab Indicator */}
        <div
          style={{
            width: '36px',
            height: '4px',
            background: 'var(--border-card)',
            borderRadius: '999px',
            margin: '8px auto 0',
          }}
          className="hide-on-desktop"
        />

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={18} color="var(--primary)" />
            <span>Master Setup & Timings</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div style={{ padding: '0 20px', paddingTop: '14px' }}>
          <div className="tabs-header">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'shifts' ? 'active' : ''}`}
              onClick={() => setActiveTab('shifts')}
            >
              <Clock size={15} />
              <span>Shift Master</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'breaks' ? 'active' : ''}`}
              onClick={() => setActiveTab('breaks')}
            >
              <Coffee size={15} />
              <span>Break Rules</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <Users size={15} />
              <span>Employee Master</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'sqlite' ? 'active' : ''}`}
              onClick={() => setActiveTab('sqlite')}
            >
              <Database size={15} />
              <span>SQLite Engine</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* TAB 1: SHIFT MASTER */}
          {activeTab === 'shifts' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Configured Shifts</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Customize shift duration, break allowance, and half-day requirements.
                  </p>
                </div>
                {!editingShift && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    onClick={() =>
                      setEditingShift({
                        name: '',
                        total_shift_hours: 9,
                        allowed_break_minutes: 80,
                        half_day_hours: 4,
                        default_start_time: '09:30',
                        color: '#3b82f6',
                        is_default: 0,
                      })
                    }
                  >
                    <Plus size={14} />
                    <span>Add Shift</span>
                  </button>
                )}
              </div>

              {/* Editing or Creating Form */}
              {editingShift && (
                <form
                  onSubmit={handleShiftSubmit}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <h5 style={{ marginBottom: '12px', fontSize: '0.88rem', fontWeight: 700 }}>
                    {editingShift.id ? 'Edit Shift Preset' : 'Create New Shift Preset'}
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Shift Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Standard 9h Shift"
                        value={editingShift.name || ''}
                        onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Total Shift Duration (Hours)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="1"
                        max="24"
                        className="form-input"
                        value={editingShift.total_shift_hours || 9}
                        onChange={(e) =>
                          setEditingShift({
                            ...editingShift,
                            total_shift_hours: parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Break Allowance (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        className="form-input"
                        value={editingShift.allowed_break_minutes || 80}
                        onChange={(e) =>
                          setEditingShift({
                            ...editingShift,
                            allowed_break_minutes: parseInt(e.target.value, 10),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Half-Day Work Requirement (Hours)</label>
                      <input
                        type="number"
                        step="0.25"
                        min="1"
                        max="12"
                        className="form-input"
                        value={editingShift.half_day_hours || 4}
                        onChange={(e) =>
                          setEditingShift({
                            ...editingShift,
                            half_day_hours: parseFloat(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Default Start Time (HH:MM)</label>
                      <input
                        type="time"
                        className="form-input"
                        value={editingShift.default_start_time || '09:30'}
                        onChange={(e) =>
                          setEditingShift({
                            ...editingShift,
                            default_start_time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingShift(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save to SQLite
                    </button>
                  </div>
                </form>
              )}

              {/* Shift Cards List */}
              <div style={{ display: 'grid', gap: '10px' }}>
                {shifts.map((shift) => {
                  const isActive = activeShift.id === shift.id;
                  return (
                    <div
                      key={shift.id}
                      className="card"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderColor: isActive ? 'var(--primary)' : 'var(--border-card)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{shift.name}</span>
                          {isActive && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                background: 'rgba(56, 189, 248, 0.2)',
                                color: 'var(--primary)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          <b>{shift.total_shift_hours}h</b> Total Shift • <b>{shift.allowed_break_minutes}m</b> Break Allowance • <b>{shift.half_day_hours}h</b> Half Day
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isActive && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => changeActiveShift(shift.id)}
                          >
                            Apply
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => setEditingShift(shift)}
                          title="Edit Shift"
                        >
                          <Edit2 size={13} />
                        </button>
                        {shifts.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => {
                              if (confirm(`Delete shift "${shift.name}"?`)) {
                                deleteShift(shift.id);
                              }
                            }}
                            title="Delete Shift"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BREAK RULES */}
          {activeTab === 'breaks' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                Break Categories & Policies
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Preset break quick-actions available to employees on the tracking dashboard.
              </p>

              <div style={{ display: 'grid', gap: '8px' }}>
                {breakTypes.map((bt) => (
                  <div
                    key={bt.id}
                    className="card"
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${bt.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Coffee size={16} color={bt.color} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{bt.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Default duration: {bt.default_duration_min} minutes
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: bt.color,
                      }}
                    >
                      +{bt.default_duration_min}m
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '4px' }}>
                  Break Compensation Rule:
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  If taken break exceeds the active shift allowance (currently{' '}
                  <b>{activeShift.allowed_break_minutes} mins</b>), the punch-out target automatically
                  advances minute-for-minute to preserve pure worked time goals.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: EMPLOYEE MASTER */}
          {activeTab === 'employees' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Employee Master Profiles</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Manage team members and assigned default shifts.
                  </p>
                </div>
                {!editingEmployee && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    onClick={() =>
                      setEditingEmployee({
                        name: '',
                        role: 'Engineer',
                        department: 'Tech',
                        email: '',
                        weekly_goal_hours: 45,
                        default_shift_id: activeShift.id,
                      })
                    }
                  >
                    <Plus size={14} />
                    <span>Add Employee</span>
                  </button>
                )}
              </div>

              {/* Employee Form */}
              {editingEmployee && (
                <form
                  onSubmit={handleEmployeeSubmit}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <h5 style={{ marginBottom: '12px', fontSize: '0.88rem', fontWeight: 700 }}>
                    {editingEmployee.id ? 'Edit Employee' : 'Add New Employee'}
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Alex Morgan"
                        value={editingEmployee.name || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. EMP-1003"
                        value={editingEmployee.id || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, id: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Senior Specialist"
                        value={editingEmployee.role || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, role: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Operations"
                        value={editingEmployee.department || ''}
                        onChange={(e) =>
                          setEditingEmployee({ ...editingEmployee, department: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Assigned Shift</label>
                      <select
                        className="form-select"
                        value={editingEmployee.default_shift_id || activeShift.id}
                        onChange={(e) =>
                          setEditingEmployee({
                            ...editingEmployee,
                            default_shift_id: e.target.value,
                          })
                        }
                      >
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.total_shift_hours}h)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Weekly Target (Hours)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={editingEmployee.weekly_goal_hours || 45}
                        onChange={(e) =>
                          setEditingEmployee({
                            ...editingEmployee,
                            weekly_goal_hours: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingEmployee(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Employee
                    </button>
                  </div>
                </form>
              )}

              {/* Employee Cards */}
              <div style={{ display: 'grid', gap: '10px' }}>
                {employees.map((emp) => {
                  const isCurrent = activeEmployee?.id === emp.id;
                  return (
                    <div
                      key={emp.id}
                      className="card"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderColor: isCurrent ? 'var(--primary)' : 'var(--border-card)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{emp.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({emp.id})
                          </span>
                          {isCurrent && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                background: 'rgba(56, 189, 248, 0.2)',
                                color: 'var(--primary)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              CURRENT USER
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {emp.role} • {emp.department} • Weekly Target: {emp.weekly_goal_hours}h
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isCurrent && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => changeActiveEmployee(emp.id)}
                          >
                            Switch To
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => setEditingEmployee(emp)}
                          title="Edit Employee"
                        >
                          <Edit2 size={13} />
                        </button>
                        {employees.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-icon"
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => {
                              if (confirm(`Delete employee "${emp.name}"?`)) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            title="Delete Employee"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SQLITE ENGINE */}
          {activeTab === 'sqlite' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Embedded SQLite WebAssembly Engine
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  All master data and logs are stored inside a real SQLite database file persisted
                  to browser IndexedDB.
                </p>
              </div>

              {/* Actions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={exportDatabaseFile}
                  style={{ padding: '10px', justifyContent: 'flex-start' }}
                >
                  <Download size={16} color="var(--primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Export .sqlite File</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Download full DB</div>
                  </div>
                </button>

                <label
                  className="btn btn-secondary"
                  style={{
                    padding: '10px',
                    justifyContent: 'flex-start',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <Upload size={16} color="var(--warning)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Restore .sqlite Backup</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Import DB file</div>
                  </div>
                  <input
                    type="file"
                    accept=".sqlite,.db"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Interactive SQL Console */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Terminal size={14} color="var(--primary)" />
                    Interactive SQL Query Runner
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    onClick={handleRunSql}
                  >
                    Run SQL
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    height: '68px',
                    resize: 'none',
                  }}
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM shift_master;"
                />
              </div>

              {/* SQL Result Table or Error */}
              {sqlError && (
                <div
                  style={{
                    color: 'var(--danger)',
                    fontSize: '0.8rem',
                    background: 'var(--danger-glow)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}
                >
                  SQL Error: {sqlError}
                </div>
              )}

              {sqlResults && (
                <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Returned {sqlResults.length} record(s):
                  </div>
                  {sqlResults.length > 0 ? (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {Object.keys(sqlResults[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResults.map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((val: any, j) => (
                                <td key={j}>{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      No rows returned.
                    </div>
                  )}
                </div>
              )}

              {/* Danger Zone: Factory Reset */}
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>
                    Reset SQLite Database
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Restores factory defaults and wipes current records.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                  onClick={async () => {
                    if (confirm('Are you sure you want to reset SQLite database to factory defaults?')) {
                      await resetDatabaseToDefault();
                      alert('SQLite database reset to factory defaults.');
                    }
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Reset DB</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
