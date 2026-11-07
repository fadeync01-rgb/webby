import { AcademicTask, DynamicStudySession } from '../types';

/**
 * Dynamic Study Session Scheduler Engine for Webby
 * 
 * Automatically calculates and distributes realistic study sessions
 * based on task deadlines, estimated durations, and priority levels,
 * without altering the original hard deadlines.
 */

export interface ScheduleOptions {
  referenceDate?: Date;
  preferredStartHours?: number[]; // e.g. [9, 13, 16, 19]
  maxDailyMinutes?: number; // default 240 (4 hours)
  defaultSessionChunk?: number; // 60 mins
}

export function formatISODateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateRemainingDays(deadlineStr: string, referenceDate: Date): number {
  const deadline = new Date(deadlineStr);
  const diffTime = deadline.getTime() - referenceDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function generateDynamicSchedule(
  tasks: AcademicTask[],
  options: ScheduleOptions = {}
): DynamicStudySession[] {
  const refDate = options.referenceDate || new Date();
  const maxDailyMinutes = options.maxDailyMinutes || 240;
  const preferredHours = options.preferredStartHours || [9, 13, 16, 19];

  // Only consider active tasks
  const activeTasks = tasks.filter((t) => t.status !== 'selesai');

  // Sort tasks by priority weight and deadline closeness
  const priorityWeight = { tinggi: 3, sedang: 2, rendah: 1 };
  const sortedTasks = [...activeTasks].sort((a, b) => {
    const deadlineDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    if (deadlineDiff !== 0) return deadlineDiff;
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const sessions: DynamicStudySession[] = [];
  // Track allocated minutes per day: { "YYYY-MM-DD": number }
  const dailyAllocatedMinutes: Record<string, number> = {};
  const dailySessionCount: Record<string, number> = {};

  for (const task of sortedTasks) {
    let remainingMinutes = task.estimatedMinutes || 60;
    const deadlineDate = new Date(task.deadline);
    const deadlineKey = formatISODateOnly(deadlineDate);

    // Calculate how many days available between refDate and deadline
    const daysAvailable = Math.max(1, calculateRemainingDays(task.deadline, refDate));

    // Determine session chunk size: 45 to 90 minutes
    const chunkSize = remainingMinutes > 90 ? Math.min(90, Math.ceil(remainingMinutes / Math.min(daysAvailable, 3))) : remainingMinutes;

    let dayOffset = 0;
    let attempts = 0;

    while (remainingMinutes > 0 && attempts < 30) {
      attempts++;
      const currentScheduleDate = addDays(refDate, dayOffset);
      const dateKey = formatISODateOnly(currentScheduleDate);

      // Don't schedule after deadline
      if (currentScheduleDate.getTime() > deadlineDate.getTime() && dayOffset > 0) {
        break;
      }

      const allocatedToday = dailyAllocatedMinutes[dateKey] || 0;
      const countToday = dailySessionCount[dateKey] || 0;

      // Check if day has capacity
      if (allocatedToday < maxDailyMinutes && countToday < preferredHours.length) {
        const sessionDuration = Math.min(remainingMinutes, Math.max(30, chunkSize));
        const hourIndex = Math.min(countToday, preferredHours.length - 1);
        const startHour = preferredHours[hourIndex];
        const endHour = startHour + Math.floor(sessionDuration / 60);
        const endMin = sessionDuration % 60;

        const startTimeStr = `${String(startHour).padStart(2, '0')}:00`;
        const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        sessions.push({
          id: `session-${task.id}-${sessions.length + 1}`,
          taskId: task.id,
          taskTitle: task.title,
          subject: task.subject,
          date: dateKey,
          startTime: startTimeStr,
          endTime: endTimeStr,
          durationMinutes: sessionDuration,
          completed: false,
          priority: task.priority,
          isDeadlineDay: dateKey === deadlineKey,
        });

        dailyAllocatedMinutes[dateKey] = allocatedToday + sessionDuration;
        dailySessionCount[dateKey] = countToday + 1;
        remainingMinutes -= sessionDuration;
      }

      // Move to next day to distribute load, or wrap around if tight deadline
      if (dayOffset < daysAvailable - 1) {
        dayOffset++;
      } else {
        // If we reached deadline day, either fill earlier days or stop
        dayOffset = (dayOffset + 1) % daysAvailable;
      }
    }
  }

  // Sort sessions chronologically
  return sessions.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Calculate study workload metrics
 */
export function calculateWorkloadStats(tasks: AcademicTask[], sessions: DynamicStudySession[]) {
  const activeTasks = tasks.filter((t) => t.status !== 'selesai');
  const completedTasks = tasks.filter((t) => t.status === 'selesai');
  const totalEstimatedMinutes = activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalScheduledMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const highPriorityCount = activeTasks.filter((t) => t.priority === 'tinggi').length;

  return {
    activeCount: activeTasks.length,
    completedCount: completedTasks.length,
    totalEstimatedHours: +(totalEstimatedMinutes / 60).toFixed(1),
    totalScheduledHours: +(totalScheduledMinutes / 60).toFixed(1),
    highPriorityCount,
    completionPercentage: tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100),
  };
}
