import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  ShiftMaster,
  EmployeeMaster,
  BreakTypeMaster,
  TimeLog,
  BreakInterval,
  DayType,
  CalculationResult,
} from '../types';
import {
  initDatabase,
  querySql,
  executeSql,
  downloadSqliteFile,
  importDatabase,
  resetDatabase,
} from '../db/sqlite';
import {
  calculateShiftMetrics,
  getTodayKey,
} from '../utils/timeUtils';

interface WorkPulseContextType {
  isDbReady: boolean;
  dbError: string | null;
  retryInit: () => void;
  currentTime: Date;
  dayType: DayType;
  activeShift: ShiftMaster;
  shifts: ShiftMaster[];
  activeEmployee: EmployeeMaster | null;
  employees: EmployeeMaster[];
  breakTypes: BreakTypeMaster[];
  todayLog: TimeLog | null;
  breakIntervals: BreakInterval[];
  metrics: CalculationResult;
  inputPunchIn: { hh: string; mm: string };
  inputBreak: { hh: string; mm: string };
  isPunchActive: boolean;

  // Actions
  setInputPunchIn: (val: { hh: string; mm: string }) => void;
  setInputBreak: (val: { hh: string; mm: string }) => void;
  setPunchInHours: (hh: string) => void;
  setPunchInMinutes: (mm: string) => void;
  setBreakHours: (hh: string) => void;
  setBreakMinutes: (mm: string) => void;
  punchInNow: () => void;
  punchOutNow: () => void;
  quickAddBreak: (minutes: number, category?: string) => void;
  clearTimes: () => void;
  setDayType: (type: DayType) => void;
  changeActiveShift: (shiftId: string) => void;
  changeActiveEmployee: (empId: string) => void;
  reloadMasterData: () => void;
  saveShift: (shift: ShiftMaster) => void;
  deleteShift: (id: string) => void;
  saveEmployee: (emp: EmployeeMaster) => void;
  deleteEmployee: (id: string) => void;
  exportDatabaseFile: () => void;
  importDatabaseFile: (file: File) => Promise<boolean>;
  resetDatabaseToDefault: () => Promise<void>;
  runRawSqlQuery: (sql: string) => any[];
}

const defaultShift: ShiftMaster = {
  id: 'shift_standard',
  name: 'Standard 9h Shift',
  total_shift_hours: 9.0,
  allowed_break_minutes: 80,
  half_day_hours: 4.0,
  default_start_time: '09:30',
  is_default: 1,
  color: '#3b82f6',
  description: 'Standard 9-hour corporate shift with 80 mins break allowance',
};

const WorkPulseContext = createContext<WorkPulseContextType | undefined>(undefined);

export const WorkPulseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [dayType, setDayTypeState] = useState<DayType>('work');
  const [shifts, setShifts] = useState<ShiftMaster[]>([defaultShift]);
  const [activeShift, setActiveShift] = useState<ShiftMaster>(defaultShift);
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [activeEmployee, setActiveEmployee] = useState<EmployeeMaster | null>(null);
  const [breakTypes, setBreakTypes] = useState<BreakTypeMaster[]>([]);
  const [todayLog, setTodayLog] = useState<TimeLog | null>(null);
  const [breakIntervals, setBreakIntervals] = useState<BreakInterval[]>([]);

  // Time Inputs
  const [inputPunchIn, setInputPunchIn] = useState({ hh: '', mm: '' });
  const [inputBreak, setInputBreak] = useState({ hh: '', mm: '' });

  // Clock ticker: update current time every 1000ms
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reload all master data and current day from SQLite
  const reloadMasterData = useCallback(() => {
    try {
      const dbShifts = querySql<ShiftMaster>('SELECT * FROM shift_master ORDER BY is_default DESC, name ASC');
      setShifts(dbShifts);

      const dbEmployees = querySql<EmployeeMaster>('SELECT * FROM employee_master ORDER BY name ASC');
      setEmployees(dbEmployees);

      const dbBreaks = querySql<BreakTypeMaster>('SELECT * FROM break_types_master ORDER BY default_duration_min ASC');
      setBreakTypes(dbBreaks);

      const activeShiftSetting = querySql<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['active_shift_id'])[0]?.value;
      const foundShift = dbShifts.find((s) => s.id === activeShiftSetting) || dbShifts[0] || defaultShift;
      setActiveShift(foundShift);

      const activeEmpSetting = querySql<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['active_employee_id'])[0]?.value;
      const foundEmp = dbEmployees.find((e) => e.id === activeEmpSetting) || dbEmployees[0] || null;
      setActiveEmployee(foundEmp);

      // Load today's log for the active employee
      const todayStr = getTodayKey();
      const currentEmpId = foundEmp ? foundEmp.id : 'EMP-1001';
      const existingLogs = querySql<TimeLog>(
        'SELECT * FROM time_logs WHERE date = ? AND employee_id = ? LIMIT 1',
        [todayStr, currentEmpId]
      );

      if (existingLogs.length > 0) {
        const log = existingLogs[0];
        setTodayLog(log);
        setDayTypeState(log.day_type);

        if (log.punch_in) {
          const [ph, pm] = log.punch_in.split(':');
          setInputPunchIn({ hh: ph || '', mm: pm || '' });
        }

        const totalBreak = log.break_minutes || 0;
        const bh = Math.floor(totalBreak / 60);
        const bm = totalBreak % 60;
        setInputBreak({
          hh: bh > 0 ? String(bh).padStart(2, '0') : '',
          mm: bm > 0 ? String(bm).padStart(2, '0') : (bh > 0 ? '00' : ''),
        });

        // Load intervals
        const intervals = querySql<BreakInterval>(
          'SELECT * FROM break_intervals WHERE log_id = ? ORDER BY start_time ASC',
          [log.id]
        );
        setBreakIntervals(intervals);
      } else {
        setTodayLog(null);
        setBreakIntervals([]);
      }
    } catch (err) {
      console.error('Failed to reload master data from SQLite:', err);
    }
  }, []);

  const initializeAppDb = useCallback(() => {
    setDbError(null);
    initDatabase()
      .then(() => {
        setIsDbReady(true);
        setDbError(null);
        reloadMasterData();
      })
      .catch((err) => {
        console.error('SQLite initialization failed:', err);
        setDbError(err instanceof Error ? err.message : String(err));
      });
  }, [reloadMasterData]);

  // Initialize SQLite once on mount
  useEffect(() => {
    initializeAppDb();
  }, [initializeAppDb]);

  // Persist time log changes into SQLite
  const syncTodayLogToSql = useCallback(
    (newPunchInHH: string, newPunchInMM: string, newBreakHH: string, newBreakMM: string, newDayType?: DayType) => {
      if (!isDbReady || !activeEmployee) return;

      const todayStr = getTodayKey();
      const punchInStr = newPunchInHH && newPunchInMM ? `${newPunchInHH.padStart(2, '0')}:${newPunchInMM.padStart(2, '0')}` : '';
      const bH = parseInt(newBreakHH, 10) || 0;
      const bM = parseInt(newBreakMM, 10) || 0;
      const totalBreakMin = bH * 60 + bM;
      const curDayType = newDayType || dayType;

      const logId = todayLog?.id || `LOG-${todayStr}-${activeEmployee.id}`;
      const nowTs = Date.now();

      if (punchInStr) {
        executeSql(
          `INSERT INTO time_logs (id, date, employee_id, day_type, shift_id, punch_in, break_minutes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             day_type = excluded.day_type,
             shift_id = excluded.shift_id,
             punch_in = excluded.punch_in,
             break_minutes = excluded.break_minutes,
             updated_at = excluded.updated_at
          `,
          [logId, todayStr, activeEmployee.id, curDayType, activeShift.id, punchInStr, totalBreakMin, nowTs, nowTs]
        );

        setTodayLog({
          id: logId,
          date: todayStr,
          employee_id: activeEmployee.id,
          day_type: curDayType,
          shift_id: activeShift.id,
          punch_in: punchInStr,
          break_minutes: totalBreakMin,
          status: 'in_progress',
          created_at: nowTs,
          updated_at: nowTs,
        });
      }
    },
    [isDbReady, activeEmployee, dayType, todayLog, activeShift]
  );

  const setPunchInHours = (hh: string) => {
    const clean = hh.replace(/\D/g, '').slice(0, 2);
    const updated = { ...inputPunchIn, hh: clean };
    setInputPunchIn(updated);
    syncTodayLogToSql(clean, updated.mm, inputBreak.hh, inputBreak.mm);
  };

  const setPunchInMinutes = (mm: string) => {
    const clean = mm.replace(/\D/g, '').slice(0, 2);
    const updated = { ...inputPunchIn, mm: clean };
    setInputPunchIn(updated);
    syncTodayLogToSql(updated.hh, clean, inputBreak.hh, inputBreak.mm);
  };

  const setBreakHours = (hh: string) => {
    const clean = hh.replace(/\D/g, '').slice(0, 2);
    const updated = { ...inputBreak, hh: clean };
    setInputBreak(updated);
    syncTodayLogToSql(inputPunchIn.hh, inputPunchIn.mm, clean, updated.mm);
  };

  const setBreakMinutes = (mm: string) => {
    const clean = mm.replace(/\D/g, '').slice(0, 2);
    const updated = { ...inputBreak, mm: clean };
    setInputBreak(updated);
    syncTodayLogToSql(inputPunchIn.hh, inputPunchIn.mm, updated.hh, clean);
  };

  const punchInNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setInputPunchIn({ hh, mm });
    syncTodayLogToSql(hh, mm, inputBreak.hh, inputBreak.mm);
  };

  const punchOutNow = () => {
    if (!todayLog) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const punchOutStr = `${hh}:${mm}`;

    executeSql(
      'UPDATE time_logs SET punch_out = ?, status = ?, updated_at = ? WHERE id = ?',
      [punchOutStr, 'completed', Date.now(), todayLog.id]
    );

    setTodayLog((prev) => (prev ? { ...prev, punch_out: punchOutStr, status: 'completed' } : null));
  };

  const quickAddBreak = (addMinutes: number, category: string = 'Tea Break') => {
    const currentBH = parseInt(inputBreak.hh, 10) || 0;
    const currentBM = parseInt(inputBreak.mm, 10) || 0;
    const totalMin = currentBH * 60 + currentBM + addMinutes;

    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    const newHHStr = newH > 0 ? String(newH).padStart(2, '0') : '';
    const newMMStr = String(newM).padStart(2, '0');

    setInputBreak({ hh: newHHStr, mm: newMMStr });
    syncTodayLogToSql(inputPunchIn.hh, inputPunchIn.mm, newHHStr, newMMStr);

    // Also log interval
    if (todayLog) {
      const now = new Date();
      const startH = String(now.getHours()).padStart(2, '0');
      const startM = String(now.getMinutes()).padStart(2, '0');
      const intervalId = `BRK-${Date.now()}`;
      executeSql(
        `INSERT INTO break_intervals (id, log_id, category, start_time, duration_minutes)
         VALUES (?, ?, ?, ?, ?)`,
        [intervalId, todayLog.id, category, `${startH}:${startM}`, addMinutes]
      );
      setBreakIntervals((prev) => [
        ...prev,
        {
          id: intervalId,
          log_id: todayLog.id,
          category,
          start_time: `${startH}:${startM}`,
          duration_minutes: addMinutes,
        },
      ]);
    }
  };

  const clearTimes = () => {
    setInputPunchIn({ hh: '', mm: '' });
    setInputBreak({ hh: '', mm: '' });
    if (todayLog) {
      executeSql('DELETE FROM break_intervals WHERE log_id = ?', [todayLog.id]);
      executeSql('DELETE FROM time_logs WHERE id = ?', [todayLog.id]);
      setTodayLog(null);
      setBreakIntervals([]);
    }
  };

  const setDayType = (type: DayType) => {
    setDayTypeState(type);
    if (todayLog) {
      executeSql('UPDATE time_logs SET day_type = ?, updated_at = ? WHERE id = ?', [type, Date.now(), todayLog.id]);
      setTodayLog((prev) => (prev ? { ...prev, day_type: type } : null));
    }
  };

  const changeActiveShift = (shiftId: string) => {
    const target = shifts.find((s) => s.id === shiftId);
    if (target) {
      setActiveShift(target);
      executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['active_shift_id', shiftId]);
      if (todayLog) {
        executeSql('UPDATE time_logs SET shift_id = ?, updated_at = ? WHERE id = ?', [shiftId, Date.now(), todayLog.id]);
        setTodayLog((prev) => (prev ? { ...prev, shift_id: shiftId } : null));
      }
    }
  };

  const changeActiveEmployee = (empId: string) => {
    const target = employees.find((e) => e.id === empId);
    if (target) {
      setActiveEmployee(target);
      executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['active_employee_id', empId]);
      reloadMasterData();
    }
  };

  const saveShift = (shift: ShiftMaster) => {
    executeSql(
      `INSERT INTO shift_master (id, name, total_shift_hours, allowed_break_minutes, half_day_hours, default_start_time, is_default, color, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         total_shift_hours = excluded.total_shift_hours,
         allowed_break_minutes = excluded.allowed_break_minutes,
         half_day_hours = excluded.half_day_hours,
         default_start_time = excluded.default_start_time,
         is_default = excluded.is_default,
         color = excluded.color,
         description = excluded.description
      `,
      [
        shift.id,
        shift.name,
        shift.total_shift_hours,
        shift.allowed_break_minutes,
        shift.half_day_hours,
        shift.default_start_time,
        shift.is_default,
        shift.color,
        shift.description || '',
      ]
    );
    reloadMasterData();
  };

  const deleteShift = (id: string) => {
    executeSql('DELETE FROM shift_master WHERE id = ?', [id]);
    reloadMasterData();
  };

  const saveEmployee = (emp: EmployeeMaster) => {
    executeSql(
      `INSERT INTO employee_master (id, name, role, department, email, default_shift_id, weekly_goal_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         role = excluded.role,
         department = excluded.department,
         email = excluded.email,
         default_shift_id = excluded.default_shift_id,
         weekly_goal_hours = excluded.weekly_goal_hours
      `,
      [emp.id, emp.name, emp.role, emp.department, emp.email, emp.default_shift_id, emp.weekly_goal_hours]
    );
    reloadMasterData();
  };

  const deleteEmployee = (id: string) => {
    executeSql('DELETE FROM employee_master WHERE id = ?', [id]);
    reloadMasterData();
  };

  const exportDatabaseFile = () => {
    downloadSqliteFile(`workpulse_master_${getTodayKey()}.sqlite`);
  };

  const importDatabaseFile = async (file: File): Promise<boolean> => {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      await importDatabase(bytes);
      reloadMasterData();
      return true;
    } catch (err) {
      console.error('Failed to import database:', err);
      return false;
    }
  };

  const resetDatabaseToDefault = async () => {
    await resetDatabase();
    reloadMasterData();
  };

  const runRawSqlQuery = (sql: string) => {
    return querySql(sql);
  };

  // Real-time calculated metrics
  const punchInStr = inputPunchIn.hh !== '' && inputPunchIn.mm !== ''
    ? `${inputPunchIn.hh}:${inputPunchIn.mm}`
    : '';

  const breakMinutes = (parseInt(inputBreak.hh, 10) || 0) * 60 + (parseInt(inputBreak.mm, 10) || 0);

  const metrics = useMemo(() => {
    return calculateShiftMetrics(punchInStr, breakMinutes, activeShift, dayType, currentTime);
  }, [punchInStr, breakMinutes, activeShift, dayType, currentTime]);

  const isPunchActive = inputPunchIn.hh !== '' && inputPunchIn.mm !== '';

  return (
    <WorkPulseContext.Provider
      value={{
        isDbReady,
        dbError,
        retryInit: initializeAppDb,
        currentTime,
        dayType,
        activeShift,
        shifts,
        activeEmployee,
        employees,
        breakTypes,
        todayLog,
        breakIntervals,
        metrics,
        inputPunchIn,
        inputBreak,
        isPunchActive,
        setInputPunchIn,
        setInputBreak,
        setPunchInHours,
        setPunchInMinutes,
        setBreakHours,
        setBreakMinutes,
        punchInNow,
        punchOutNow,
        quickAddBreak,
        clearTimes,
        setDayType,
        changeActiveShift,
        changeActiveEmployee,
        reloadMasterData,
        saveShift,
        deleteShift,
        saveEmployee,
        deleteEmployee,
        exportDatabaseFile,
        importDatabaseFile,
        resetDatabaseToDefault,
        runRawSqlQuery,
      }}
    >
      {children}
    </WorkPulseContext.Provider>
  );
};

export const useWorkPulse = () => {
  const context = useContext(WorkPulseContext);
  if (!context) {
    throw new Error('useWorkPulse must be used within a WorkPulseProvider');
  }
  return context;
};
