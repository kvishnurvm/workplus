export type DayType = 'work' | 'off' | 'remote' | 'half_day';

export type PunchStatus = 'not_started' | 'in_progress' | 'on_break' | 'completed' | 'overtime';

export interface ShiftMaster {
  id: string;
  name: string;
  total_shift_hours: number;     // e.g. 9
  allowed_break_minutes: number; // e.g. 80
  half_day_hours: number;        // e.g. 4
  default_start_time: string;    // "09:30"
  is_default: number;            // 1 or 0
  color: string;                 // Hex or hsl
  description?: string;
}

export interface EmployeeMaster {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  default_shift_id: string;
  weekly_goal_hours: number;
}

export interface BreakTypeMaster {
  id: string;
  name: string;
  default_duration_min: number;
  icon: string;
  color: string;
}

export interface BreakInterval {
  id: string;
  log_id: string;
  category: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  notes?: string;
}

export interface TimeLog {
  id: string;
  date: string; // YYYY-MM-DD
  employee_id: string;
  day_type: DayType;
  shift_id: string;
  punch_in: string; // HH:MM
  punch_out?: string; // HH:MM
  break_minutes: number;
  status: PunchStatus;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface CalculationResult {
  now: Date;
  punchInTime: Date | null;
  punchOutTarget: Date | null;
  excludeBreakPunchOut: Date | null;
  halfDayCompleteTime: Date | null;
  totalCompletedMin: number;
  totalTimeLeftMin: number;
  workHoursLeftMin: number;
  actualWorkedMin: number;
  breakLeftMin: number;
  extraBreakMin: number;
  halfDayPercent: number;
  shiftPercent: number;
  workPercent: number;
  isHalfDayComplete: boolean;
  isShiftComplete: boolean;
  isOvertime: boolean;
  status: PunchStatus;
}

export type ActiveTab = 'tracker' | 'logs' | 'analytics' | 'master';
