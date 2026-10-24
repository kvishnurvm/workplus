import type { CalculationResult, DayType, PunchStatus, ShiftMaster } from '../types';

/**
 * Format a Date to "HH:MM AM/PM" (12-hour format)
 */
export function formatTime12(date: Date | null): string {
  if (!date) return '--:-- --';
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

/**
 * Format a Date to "HH:MM:SS AM/PM" (12-hour live clock)
 */
export function formatLiveClock(date: Date): { time: string; period: string; seconds: string } {
  let h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return {
    time: `${String(h).padStart(2, '0')}:${m}`,
    seconds: s,
    period: ap,
  };
}

/**
 * Format minutes into "Xh Ym" or "X hour Y minutes"
 */
export function formatHoursMinutes(totalMinutes: number, verbose: boolean = false): string {
  const isNegative = totalMinutes < 0;
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const sign = isNegative ? '-' : '';

  if (verbose) {
    if (h === 0) return `${sign}${m} minutes`;
    if (m === 0) return `${sign}${h} hour${h > 1 ? 's' : ''}`;
    return `${sign}${h} hour${h > 1 ? 's' : ''} ${m} min`;
  }
  return `${sign}${h}h ${m}m`;
}

/**
 * Format date to "Monday, October 24, 2026"
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns ISO date string "YYYY-MM-DD"
 */
export function getTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse "HH:MM" string and return a Date object set for today
 */
export function parseTimeToDate(timeStr: string, baseDate: Date = new Date()): Date | null {
  if (!timeStr || !timeStr.includes(':')) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;

  const d = new Date(baseDate.getTime());
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Calculate all progress, punch-out predictions, milestones, and overtime
 */
export function calculateShiftMetrics(
  punchInStr: string,
  breakTakenMinutes: number,
  shift: ShiftMaster,
  dayType: DayType = 'work',
  now: Date = new Date()
): CalculationResult {
  const emptyResult: CalculationResult = {
    now,
    punchInTime: null,
    punchOutTarget: null,
    excludeBreakPunchOut: null,
    halfDayCompleteTime: null,
    totalCompletedMin: 0,
    totalTimeLeftMin: 0,
    workHoursLeftMin: 0,
    actualWorkedMin: 0,
    breakLeftMin: shift.allowed_break_minutes,
    extraBreakMin: 0,
    halfDayPercent: 0,
    shiftPercent: 0,
    workPercent: 0,
    isHalfDayComplete: false,
    isShiftComplete: false,
    isOvertime: false,
    status: 'not_started',
  };

  const punchInDate = parseTimeToDate(punchInStr, now);
  if (!punchInDate) {
    return emptyResult;
  }

  const shiftHours = shift.total_shift_hours || 9;
  const allowedBreakMin = shift.allowed_break_minutes || 80;
  const halfDayHours = shift.half_day_hours || 4;

  if (dayType === 'off') {
    // Non-working day logic: 8h pure work goal + break taken
    const workGoal = 8 * 60;
    const halfGoal = 4 * 60;
    const dayMinutes = workGoal + breakTakenMinutes;
    const punchOut = new Date(punchInDate.getTime() + dayMinutes * 60000);
    const halfDayComplete = new Date(punchInDate.getTime() + (halfGoal + breakTakenMinutes) * 60000);

    const completedMs = Math.max(0, now.getTime() - punchInDate.getTime());
    const totalCompMin = Math.floor(completedMs / 60000);
    const leftMs = punchOut.getTime() - now.getTime();
    const totalTimeLeftMin = Math.max(0, Math.floor(leftMs / 60000));
    const workedMin = Math.max(0, totalCompMin - breakTakenMinutes);

    const halfPercent = Math.min(100, Math.max(0, (workedMin / halfGoal) * 100));
    const shiftPercent = Math.min(100, Math.max(0, (totalCompMin / dayMinutes) * 100));
    const workPercent = Math.min(100, Math.max(0, (workedMin / workGoal) * 100));

    const isShiftComplete = leftMs <= 0;
    const isHalfDayComplete = workedMin >= halfGoal;

    return {
      now,
      punchInTime: punchInDate,
      punchOutTarget: punchOut,
      excludeBreakPunchOut: punchOut,
      halfDayCompleteTime: halfDayComplete,
      totalCompletedMin: totalCompMin,
      totalTimeLeftMin,
      workHoursLeftMin: totalTimeLeftMin,
      actualWorkedMin: workedMin,
      breakLeftMin: 0,
      extraBreakMin: 0,
      halfDayPercent: Math.round(halfPercent),
      shiftPercent: Math.round(shiftPercent),
      workPercent: Math.round(workPercent),
      isHalfDayComplete,
      isShiftComplete,
      isOvertime: isShiftComplete,
      status: isShiftComplete ? 'completed' : 'in_progress',
    };
  }

  // Standard Working day calculations
  const punchOut = new Date(punchInDate.getTime() + shiftHours * 3600000);
  const breakLeft = allowedBreakMin - breakTakenMinutes;
  const excludeBreakPunchOut = new Date(punchOut.getTime() - breakLeft * 60000);

  // If break is exceeded, punch-out moves forward to compensate extra break
  const correctPunchOut = breakLeft < 0 ? excludeBreakPunchOut : punchOut;
  const extraBreak = breakLeft < 0 ? Math.abs(breakLeft) : 0;
  const remainingBreak = Math.max(0, breakLeft);

  // Half day: halfDayHours of pure work + break taken
  const halfDayComplete = new Date(
    punchInDate.getTime() + halfDayHours * 3600000 + breakTakenMinutes * 60000
  );

  let completedMs = now.getTime() - punchInDate.getTime();
  if (completedMs < 0) completedMs = 0;
  const totalCompMin = Math.floor(completedMs / 60000);

  const leftMs = correctPunchOut.getTime() - now.getTime();
  const totalTimeLeftMin = Math.max(0, Math.floor(leftMs / 60000));

  const workLeftMs = excludeBreakPunchOut.getTime() - now.getTime();
  const workHoursLeftMin = Math.max(0, Math.floor(workLeftMs / 60000));

  const totalWorkedMin = Math.max(0, totalCompMin - breakTakenMinutes);

  // Progress Percentages
  const halfPercent = Math.min(100, Math.max(0, (totalWorkedMin / (halfDayHours * 60)) * 100));
  const shiftPercent = Math.min(100, Math.max(0, (totalCompMin / (shiftHours * 60)) * 100));

  const pureGoal = shiftHours * 60 - allowedBreakMin;
  const workPercent = Math.min(100, Math.max(0, (totalWorkedMin / pureGoal) * 100));

  const isHalfDayComplete = totalWorkedMin >= halfDayHours * 60;
  const isShiftComplete = leftMs <= 0;
  const isOvertime = leftMs < 0;

  let status: PunchStatus = 'in_progress';
  if (isOvertime) status = 'overtime';
  else if (isShiftComplete) status = 'completed';

  return {
    now,
    punchInTime: punchInDate,
    punchOutTarget: correctPunchOut,
    excludeBreakPunchOut,
    halfDayCompleteTime: halfDayComplete,
    totalCompletedMin: totalCompMin,
    totalTimeLeftMin,
    workHoursLeftMin,
    actualWorkedMin: totalWorkedMin,
    breakLeftMin: remainingBreak,
    extraBreakMin: extraBreak,
    halfDayPercent: Math.round(halfPercent),
    shiftPercent: Math.round(shiftPercent),
    workPercent: Math.round(workPercent),
    isHalfDayComplete,
    isShiftComplete,
    isOvertime,
    status,
  };
}
